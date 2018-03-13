define(function (require) {

    require('pixi.js');
    var React = require('react');

    var Canvas = React.createClass({
        _isMounted: false,

        getInitialState: function () {
            return {
                buffer: {},
                images: {},
                text: this.props.statusText,
                serverUrl: this.props.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol),
                color: this.props.color,
                stack: this.props.stack,
                label: this.props.label,
                pit: this.props.pit,
                yaw: this.props.yaw,
                rol: this.props.rol,
                dst: this.props.dst,
                id: this.props.id,
                minDst: -100,
                maxDst: 100,
                tileX: 1025,
                tileY: 1025,
                imageX: 1024,
                imageY: 1024,
                voxelX: this.props.voxelX,
                voxelY: this.props.voxelY,
                voxelZ: this.props.voxelZ,
                visibleTiles: [0],
                stackViewerPlane: false,
                plane: [0, 0, 0, this.props.width, 0, 0, 0, this.props.height, 0, this.props.width, this.props.height, 0],
                planeUpdating: false,
                lastUpdate: 0,
                updating: false,
                numTiles: 1,
                posX: 0,
                posY: 0,
                oldX: 0,
                oldY: 0,
                oldEvent: 0,
                loadingLabels: false,
                orth: this.props.orth,
                data: {},
                dragOffset: {},
                dragging: false,
                recenter: false,
                txtUpdated: Date.now(),
                txtStay: 3000,
                objects: [],
                hoverTime: Date.now()
            };
        },
        /**
         * In this case, componentDidMount is used to grab the canvas container ref, and
         * and hook up the PixiJS renderer
         **/
        componentDidMount: function () {
            // signal component mounted (used to avoid calling isMounted() deprecated method)
            this._isMounted = true;

            console.log('Loading....');
            //Setup PIXI Canvas in componentDidMount
            this.renderer = PIXI.autoDetectRenderer(this.props.width, this.props.height);
            // maintain full window size
            this.refs.stackCanvas.appendChild(this.renderer.view);


            // create the root of the scene graph
            this.stage = new PIXI.Container();
            this.stage.pivot.x = 0;
            this.stage.pivot.y = 0;
            this.stage.position.x = 0;
            this.stage.position.y = 0;
            this.disp = new PIXI.Container();
            this.disp.pivot.x = 0;
            this.disp.pivot.y = 0;
            this.disp.scale.x = this.props.zoomLevel;
            this.disp.scale.y = this.props.zoomLevel;
            this.stage.addChild(this.disp);
            this.stack = new PIXI.Container();
            this.stack.pivot.x = 0;
            this.stack.pivot.y = 0;
            this.stack.position.x = -10000;
            this.stack.position.y = -10000;
            this.state.recenter = true;

            this.createStatusText();

            this.stack.interactive = true;
            this.stack.buttonMode = true;
            this.stack
            // events for drag start
                .on('mousedown', this.onDragStart)
                .on('touchstart', this.onDragStart)
                // events for drag end
                .on('mouseup', this.onDragEnd)
                .on('mouseupoutside', this.onDragEnd)
                .on('touchend', this.onDragEnd)
                .on('touchendoutside', this.onDragEnd)
                // events for drag move
                .on('mousemove', this.onDragMove)
                .on('touchmove', this.onDragMove)
                .on('mousewheel', this.onWheelEvent)
                .on('wheel', this.onWheelEvent)
                .on('DOMMouseScroll', this.onWheelEvent);

            this.disp.addChild(this.stack);

            // block move event outside stack
            this.renderer.plugins.interaction.moveWhenInside = true;

            //call metadata from server
            this.callDstRange();
            this.callTileSize();
            this.callImageSize();

            //start the display
            this.createImages();
            this.animate();

            this.callPlaneEdges();

        },

        componentDidUpdate: function () {
            // console.log('Canvas update');
            this.renderer.resize(this.props.width, this.props.height);
            this.checkStack();
            this.callPlaneEdges();
        },

        componentWillUnmount: function () {
            this.stage.destroy(true);
            this.stage = null;
            this.refs.stackCanvas.removeChild(this.renderer.view);
            this.renderer.destroy(true);
            this.renderer = null;

            if (this.props.canvasRef != null && this.props.canvasRef != undefined) {
                this.props.canvasRef.removeObject(this.state.stackViewerPlane);
            }

            PIXI.loader.reset();

            // free texture caches
            var textureUrl;
            for (textureUrl in PIXI.utils.BaseTextureCache) {
                delete PIXI.utils.BaseTextureCache[textureUrl];
            }
            for (textureUrl in PIXI.utils.TextureCache) {
                delete PIXI.utils.TextureCache[textureUrl];
            }

            // signal component is now unmounted
            this._isMounted = false;

            return true;
        },

        callDstRange: function () {
            var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[0] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=0&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0);
            // this.state.buffer[-1].text = 'Buffering stack...';
            //get distance range;
            $.ajax({
                url: image + '&obj=Wlz-distance-range',
                type: 'POST',
                success: function (data) {
                    var result = data.trim().split(':')[1].split(' ');
                    var min = Number(result[0]);
                    var max = Number(result[1]);
                    this.setState({minDst: min, maxDst: max});
                    var extent = {minDst: min, maxDst: max};
                    this.props.setExtent(extent);
                    this.bufferStack(extent);
                    if (this.state.txtUpdated < Date.now() - this.state.txtStay) {
                        this.state.buffer[-1].text = '';
                    }
                    this.callPlaneEdges();
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error("Calling Dst Range", status + " - " + xhr.progress().state(), err.toString());
                }.bind(this)
            });
        },

        callTileSize: function () {
            var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[0] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=0&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0);
            //get tile size;
            $.ajax({
                url: image + '&obj=Tile-size',
                type: 'POST',
                success: function (data) {
                    var result = data.trim().split(':')[1].split(' ');
                    var tileX = Number(result[0]);
                    var tileY = Number(result[1]);
                    this.setState({tileX: tileX, tileY: tileY});

                    // update slice view
                    this.state.lastUpdate = 0;
                    this.checkStack();
                    this.callPlaneEdges();
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error("Calling Tile Size", status + " - " + xhr.progress().state(), err.toString());
                }.bind(this)
            });
        },

        callImageSize: function () {
            var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[0] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=0&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0);
            //get image size;
            $.ajax({
                url: image + '&obj=Max-size',
                type: 'POST',
                success: function (data) {
                    var result = data.trim().split(':')[1].split(' ');
                    var imageX = Number(result[0]);
                    var imageY = Number(result[1]);
                    var extent = {imageX: imageX, imageY: imageY};
                    this.setState(extent);
                    this.props.setExtent(extent);
                    // update slice view
                    this.state.lastUpdate = 0;
                    this.checkStack();
                    this.callPlaneEdges();
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error("Calling Max Size", status + " - " + xhr.progress().state(), err.toString());
                }.bind(this)
            });
        },

        callPlaneEdges: function () {
            if (!this.state.planeUpdating) {
                this.state.planeUpdating = true;
                if (this.stack.width > 1) {
                    var coordinates = [];
                    var x, y, z;
                    // update widget window extents (X,Y):
                    if (this.state.orth == 2) {
                        x = (this.stack.position.x) + (-this.disp.position.x / this.disp.scale.x);
                    }
                    else {
                        x = (-this.stack.position.x) + (-this.disp.position.x / this.disp.scale.x);
                    }
                    if (this.state.orth == 1) {
                        y = (this.stack.position.y) + (-this.disp.position.y / this.disp.scale.x);
                    }
                    else {
                        y = (-this.stack.position.y) + (-this.disp.position.y / this.disp.scale.x);
                    }
                    coordinates[0] = x.toFixed(0);
                    coordinates[1] = y.toFixed(0);
                    x = x + (this.renderer.width / this.disp.scale.x);
                    y = y + (this.renderer.height / this.disp.scale.y);
                    coordinates[2] = x.toFixed(0);
                    coordinates[3] = y.toFixed(0);
                    if (this.state.orth == 0) { // frontal
                        this.state.plane[0] = coordinates[0];
                        this.state.plane[1] = coordinates[1];
                        this.state.plane[3] = coordinates[2];
                        this.state.plane[4] = coordinates[1];
                        this.state.plane[6] = coordinates[0];
                        this.state.plane[7] = coordinates[3];
                        this.state.plane[9] = coordinates[2];
                        this.state.plane[10] = coordinates[3];
                    } else if (this.state.orth == 1) { // transverse
                        this.state.plane[0] = coordinates[0];
                        this.state.plane[2] = coordinates[1];
                        this.state.plane[3] = coordinates[2];
                        this.state.plane[5] = coordinates[1];
                        this.state.plane[6] = coordinates[0];
                        this.state.plane[8] = coordinates[3];
                        this.state.plane[9] = coordinates[2];
                        this.state.plane[11] = coordinates[3];
                    } else if (this.state.orth == 2) { // sagittal
                        this.state.plane[1] = coordinates[1];
                        this.state.plane[2] = coordinates[0];
                        this.state.plane[4] = coordinates[1];
                        this.state.plane[5] = coordinates[2];
                        this.state.plane[7] = coordinates[3];
                        this.state.plane[8] = coordinates[0];
                        this.state.plane[10] = coordinates[3];
                        this.state.plane[11] = coordinates[2];
                    }
                }
                // Pass Z coordinates
                z = this.props.dst - (this.state.minDst);
                if (this.state.orth == 0) { // frontal
                    this.state.plane[2] = z;
                    this.state.plane[5] = z;
                    this.state.plane[8] = z;
                    this.state.plane[11] = z;
                } else if (this.state.orth == 1) { // transverse
                    this.state.plane[1] = z;
                    this.state.plane[4] = z;
                    this.state.plane[7] = z;
                    this.state.plane[10] = z;
                } else if (this.state.orth == 2) { // sagittal
                    this.state.plane[0] = z;
                    this.state.plane[3] = z;
                    this.state.plane[6] = z;
                    this.state.plane[9] = z;
                }
                this.passPlane();
            }
        },

        passPlane: function () {
            if (this.state.stackViewerPlane) {
                if (this.props.canvasRef != undefined && this.props.canvasRef != null) {
                    this.state.stackViewerPlane = this.props.canvasRef.modify3DPlane(this.state.stackViewerPlane, this.state.plane[0], this.state.plane[1], this.state.plane[2], this.state.plane[3], this.state.plane[4], this.state.plane[5], this.state.plane[6], this.state.plane[7], this.state.plane[8], this.state.plane[9], this.state.plane[10], this.state.plane[11]);
                }
            } else {
                if (this.props.canvasRef != undefined && this.props.canvasRef != null) {
                    this.state.stackViewerPlane = this.props.canvasRef.add3DPlane(this.state.plane[0], this.state.plane[1], this.state.plane[2], this.state.plane[3], this.state.plane[4], this.state.plane[5], this.state.plane[6], this.state.plane[7], this.state.plane[8], this.state.plane[9], this.state.plane[10], this.state.plane[11], "geppetto/js/components/widgets/stackViewer/images/glass.jpg");
                }
                if (this.state.stackViewerPlane.visible) {
                    this.state.stackViewerPlane.visible = true;
                }
            }
            if (this.disp.width > 0 && this.props.slice) {
                this.state.stackViewerPlane.visible = true;
            } else {
                this.state.stackViewerPlane.visible = false;
            }
            this.state.planeUpdating = false;
        },

        callObjects: function () {

            var i, j, result, id, label;
            var that = this;
            while (GEPPETTO.SceneController.getSelection()[0] != undefined) {
                GEPPETTO.SceneController.getSelection()[0].deselect();
            }
            $.each(this.state.stack, function (i, item) {
                (function (i, that, shift) {
                    var shift = GEPPETTO.isKeyPressed("shift");
                    var image = that.state.serverUrl.toString() + '?wlz=' + item + '&sel=0,255,255,255&mod=zeta&fxp=' + that.props.fxp.join(',') + '&scl=' + that.props.scl.toFixed(1) + '&dst=' + Number(that.state.dst).toFixed(1) + '&pit=' + Number(that.state.pit).toFixed(0) + '&yaw=' + Number(that.state.yaw).toFixed(0) + '&rol=' + Number(that.state.rol).toFixed(0);
                    //get image size;
                    $.ajax({
                        url: image + '&prl=-1,' + that.state.posX.toFixed(0) + ',' + that.state.posY.toFixed(0) + '&obj=Wlz-foreground-objects',
                        type: 'POST',
                        success: function (data) {
                            if (GEPPETTO.SceneController.getSelection()[0] == undefined) { // check nothing already selected
                                result = data.trim().split(':')[1].trim().split(' ');
                                if (result !== '') {
                                    for (j in result) {
                                        if (result[j].trim() !== '') {
                                            var index = Number(result[j]);
                                            if (i !== 0 || index !== 0) { // don't select template
                                                if (index == 0 && !shift) {
                                                    console.log(that.state.label[i] + ' clicked');
                                                    try {
                                                        eval(that.state.id[i][Number(result[j])]).select();
                                                        that.setStatusText(that.state.label[i] + ' selected');
                                                    } catch (err) {
                                                        console.log("Error selecting: " + that.state.id[i][Number(result[j])]);
                                                        console.log(err.message);
                                                    }
                                                    break;
                                                } else {
                                                    if (typeof that.props.templateDomainIds !== 'undefined' && typeof that.props.templateDomainNames !== 'undefined' && typeof that.props.templateDomainIds[index] !== 'undefined' && typeof that.props.templateDomainNames[index] !== 'undefined') {
                                                        try {
                                                            eval(that.state.id[i][Number(result[j])]).select();
                                                            console.log(that.props.templateDomainNames[index] + ' clicked');
                                                            that.setStatusText(that.props.templateDomainNames[index] + ' selected');
                                                            break;
                                                        } catch (ignore) {
                                                            console.log(that.props.templateDomainNames[index] + ' requested');
                                                            that.setStatusText(that.props.templateDomainNames[index] + ' requested');
                                                            if (shift) {
                                                                console.log('Adding ' + that.props.templateDomainNames[index]);
                                                                that.setStatusText('Adding ' + that.props.templateDomainNames[index]);
                                                                var varriableId = that.props.templateDomainIds[index];
                                                                stackViewerRequest(varriableId); // window.stackViewerRequest must be configured in init script
                                                                break;
                                                            } else {
                                                                that.setStatusText(that.props.templateDomainNames[index] + ' (⇧click to add)');
                                                                stackViewerRequest(that.props.templateDomainTypeIds[index]);
                                                                break;
                                                            }
                                                        }
                                                    } else {
                                                        console.log('Index not listed: ' + result[j]);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                // update slice view
                                that.state.lastUpdate = 0;
                                that.checkStack();
                            }
                        },
                        error: function (xhr, status, err) {
                            console.error("Calling Objects", status + " - " + xhr.progress().state(), err.toString());
                        }.bind(this)
                    });
                })(i, that);
            });
        },

        listObjects: function () {
            if (!this.state.loadingLabels) {
                this.state.objects = [];
                var i, j, result;
                var that = this;
                var callX = that.state.posX.toFixed(0), callY = that.state.posY.toFixed(0);
                $.each(this.state.stack, function (i, item) {
                    (function (i, that, shift) {
                        if (i == 0) {
                            that.state.loadingLabels = true;
                        }
                        var shift = GEPPETTO.isKeyPressed("shift");
                        var image = that.state.serverUrl.toString() + '?wlz=' + item + '&sel=0,255,255,255&mod=zeta&fxp=' + that.props.fxp.join(',') + '&scl=' + that.props.scl.toFixed(1) + '&dst=' + Number(that.state.dst).toFixed(1) + '&pit=' + Number(that.state.pit).toFixed(0) + '&yaw=' + Number(that.state.yaw).toFixed(0) + '&rol=' + Number(that.state.rol).toFixed(0);
                        //get image size;
                        $.ajax({
                            url: image + '&prl=-1,' + callX + ',' + callY + '&obj=Wlz-foreground-objects',
                            type: 'POST',
                            success: function (data) {
                                result = data.trim().split(':')[1].trim().split(' ');
                                if (result !== '') {
                                    var currentPosition = that.renderer.plugins.interaction.mouse.getLocalPosition(that.stack);
                                    if (callX == currentPosition.x.toFixed(0) && callY == currentPosition.y.toFixed(0)) {
                                        for (j in result) {
                                            if (result[j].trim() !== '') {
                                                var index = Number(result[j]);
                                                if (i !== 0 || index !== 0) { // don't select template
                                                    if (index == 0) {
                                                        if (!shift) {
                                                            that.state.objects.push(that.state.label[i]);
                                                        }
                                                    } else {
                                                        if (typeof that.props.templateDomainIds !== 'undefined' && typeof that.props.templateDomainNames !== 'undefined' && typeof that.props.templateDomainIds[index] !== 'undefined' && typeof that.props.templateDomainNames[index] !== 'undefined') {
                                                            that.state.objects.push(that.props.templateDomainNames[index]);
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        var list = $.unique(that.state.objects).sort();
                                        var objects = '';
                                        if (shift) {
                                            objects = 'Click to add: ';
                                        }
                                        for (j in list) {
                                            objects = objects + list[j] + '\n';
                                        }
                                        if (objects !== '') {
                                            that.setStatusText(objects);
                                        }
                                    } else if (i == 0) {
                                        that.state.loadingLabels = false;
                                        that.onHoverEvent();
                                    }
                                }
                                // update slice view
                                if (i == 0) {
                                    that.state.loadingLabels = false;
                                }
                                that.state.lastUpdate = 0;
                                that.checkStack();
                            },
                            error: function (xhr, status, err) {
                                that.state.loadingLabels = false;
                                console.error("Listing Objects", status + " - " + xhr.progress().state(), err.toString());
                            }.bind(this)
                        });
                    })(i, that);
                });
            }
        },

        bufferStack: function (extent) {
            var i, j, dst, image;
            var min = extent.minDst;
            var max = extent.maxDst;
            var buffMax = 1000;
            var imageLoader = PIXI.loader;
            var loaderOptions = {
                loadType: PIXI.loaders.Resource.LOAD_TYPE.IMAGE,
                xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BLOB
            };
            for (j = 0; j < this.state.numTiles; j++) {
                for (i in this.state.stack) {
                    image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(this.state.dst).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + j.toString();
                    if (!PIXI.loader.resources[image]) {
                        // console.log('buffering ' + this.state.stack[i].toString() + '...');
                        imageLoader.add(image, image, loaderOptions);
                        buffMax -= 1;
                    }
                    if (buffMax < 1) {
                        break;
                    }
                }
            }
            if (this.state.numTiles < 10) {
                for (j in this.state.visibleTiles) {
                    for (i in this.state.stack) {
                        image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=0.0&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + this.state.visibleTiles[j].toString();
                        if (!PIXI.loader.resources[image]) {
                            // console.log('buffering ' + this.state.stack[i].toString() + '...');
                            imageLoader.add(image, image, loaderOptions);
                            buffMax -= 1;
                        }
                        if (buffMax < 1) {
                            break;
                        }
                    }
                    var step;
                    if (this.state.orth == 0) {
                        step = this.state.voxelZ;
                    } else if (this.state.orth == 1) {
                        step = this.state.voxelY;
                    } else if (this.state.orth == 2) {
                        step = this.state.voxelX;
                    }
                    for (dst = 0; -dst > min || dst < max; dst += step) {
                        for (i in this.state.stack) {
                            image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(dst).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + this.state.visibleTiles[j].toString();
                            if (dst < max && !PIXI.loader.resources[image]) {
                                imageLoader.add(image, image, loaderOptions);
                                buffMax -= 1;
                            }
                            image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(-dst).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + this.state.visibleTiles[j].toString();
                            if (-dst > min && !PIXI.loader.resources[image]) {
                                imageLoader.add(image, image, loaderOptions);
                                buffMax -= 1;
                            }
                        }
                        if (buffMax < 1) {
                            break;
                        }
                    }
                }
            } else {
                console.log('Buffering neighbouring layers (' + this.state.numTiles.toString() + ') tiles...');
                for (j = 0; j < this.state.numTiles && j < this.state.stack.length; j++) {
                    for (i in this.state.stack) {
                        image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(this.state.dst - 0.1).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + j.toString();
                        if (!PIXI.loader.resources[image]) {
                            // console.log('buffering ' + this.state.stack[i].toString() + '...');
                            imageLoader.add(image, image, loaderOptions);
                            buffMax -= 1;
                        }
                        if (buffMax < 1) {
                            break;
                        }
                        image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(this.state.dst + 0.1).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + j.toString();
                        if (!PIXI.loader.resources[image]) {
                            // console.log('buffering ' + this.state.stack[i].toString() + '...');
                            imageLoader.add(image, image, loaderOptions);
                            buffMax -= 1;
                        }
                        if (buffMax < 1) {
                            break;
                        }
                    }
                }
            }
            imageLoader
                .on('progress', loadProgressHandler.bind(this))
                .on('error', console.log)
                .on('complete', setup.bind(this))
                .load();

            function loadProgressHandler(loader, resource) {
                if (loader.progress < 100) {
                    if (this.state.txtUpdated < Date.now() - this.state.txtStay) {
                        this.state.buffer[-1].text = 'Buffering stack ' + loader.progress.toFixed(1) + "%";
                    }
                }
            }

            function setup() {
                // console.log('Buffered ' + (1000 - buffMax).toString() + ' tiles');
                if (this.state.txtUpdated < Date.now() - this.state.txtStay) {
                    this.state.buffer[-1].text = '';
                }
            }
        },

        checkStack: function () {
            if (!this._isMounted) {
                // check that component is still mounted
                return;
            }

            if (this.disp.width > 1) {
                if (this.state.recenter) {
                    //console.log('centering image ' + this.disp.width + ' inside window ' + this.props.width + ' wide');
                    this.disp.position.x = ((this.props.width / 2) - (this.disp.width / 2));
                    this.disp.position.y = ((this.props.height / 2) - (this.disp.height / 2));
                    this.stack.position.x = 0;
                    this.stack.position.y = 0;
                    this.state.recenter = false;
                    this.props.setExtent({stackX: this.stack.position.x, stackY: this.stack.position.y});
                }
            }

            if (this.state.stack.length < 1) {
                this.state.images = [];
                this.stack.removeChildren();
            }

            if (this.state.lastUpdate < (Date.now() - 2000)) {
                this.state.lastUpdate = Date.now();
                if (this.state.txtUpdated < Date.now() - this.state.txtStay) {
                    this.state.buffer[-1].text = '';
                }
                // console.log('Updating scene...');
                this.createImages();
                this.updateImages(this.props);
                var extent = {minDst: this.state.minDst, maxDst: this.state.maxDst};
                this.bufferStack(extent);
            } else if (!this.state.updating) {
                this.state.updating = true;
                var that = this;
                window.setTimeout(function () {
                    that.state.updating = false;
                    that.checkStack();
                }, 1000);
            }

            if (Object.keys(this.state.images).length > (this.state.stack.length * this.state.visibleTiles.length )) {
                for (i in Object.keys(this.state.images)) {
                    var id = Object.keys(this.state.images)[i].split(",")[0];
                    if (id > (this.state.stack.length - 1)) {
                        delete this.state.images[Object.keys(this.state.images)[i]];
                        try {
                            this.stack.removeChildAt(i);
                        } catch (ignore) {
                            //ignore if it doesn't exist
                        }
                    }
                }
            }

        },

        generateColor: function () {
            var i;
            for (i in this.state.stack) {
                if (this.state.stack[i] && this.state.stack[i].trim() !== '' && !this.state.color[i]) {
                    this.state.color = this.state.color.concat(['0xFFFFFF']);
                }
            }
        },

        createImages: function () {
            if (this.state.stack.length > 0) {
                var i, x, y, w, h, d, offX, offY, t, image;
                // move through tiles
                // console.log('Creating slice view...');
                this.state.visibleTiles = [];
                w = Math.ceil(this.state.imageX / this.state.tileX);
                h = Math.ceil(this.state.imageY / this.state.tileY);
                // console.log('Tile grid is ' + w.toString() + ' wide by ' + h.toString() + ' high');
                this.state.numTiles = w * h;

                for (t = 0; t < w * h; t++) {
                    x = 0;
                    y = 0;
                    offY = 0;
                    if ((t + 1) > w) {
                        offY = Math.floor(t / w);
                    }
                    offX = (t - (offY * w));
                    x += offX * this.state.tileX;
                    y += offY * this.state.tileY;
                    // console.log('Tiling: ' + [t,offX,offY,x,y,w,h]);
                    if ((w * h == 1) || (((x * this.disp.scale.x) + this.stack.position.x) > (-((this.renderer.view.width * 1) + (this.state.tileX * 2)) + this.stack.position.x) && ((x * this.disp.scale.x) + this.stack.position.x) < ((this.renderer.view.width * 1) + ((this.state.tileX * 1) + this.stack.position.x)) && ((y * this.disp.scale.y) + this.stack.position.y) > (-((this.renderer.view.height * 1) + (this.state.tileY * 2)) + this.stack.position.y) && ((y * this.disp.scale.y) + this.stack.position.y) < ((this.renderer.view.height * 1) + ((this.state.tileY * 1) + this.stack.position.y)))) {
                        this.state.visibleTiles.push(t);
                        for (i in this.state.stack) {
                            d = i.toString() + ',' + t.toString();
                            if (!this.state.images[d]) {
                                // console.log('Adding ' + this.state.stack[i].toString());
                                image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(this.state.dst).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + t.toString();
                                // console.log(image);
                                this.state.images[d] = PIXI.Sprite.fromImage(image);
                                this.state.images[d].anchor.x = 0;
                                this.state.images[d].anchor.y = 0;
                                this.state.images[d].position.x = x;
                                this.state.images[d].position.y = y;
                                this.state.images[d].zOrder = i;
                                this.state.images[d].visible = true;
                                if (!this.state.color[i]) {
                                    this.generateColor();
                                }
                                this.state.images[d].tint = this.state.color[i];
                                if (i > 0) {
                                    // this.state.images[d].alpha = 0.9;
                                    this.state.images[d].blendMode = PIXI.BLEND_MODES.SCREEN;
                                }
                                this.stack.addChild(this.state.images[d]);
                            } else {
                                this.state.images[d].anchor.x = 0;
                                this.state.images[d].anchor.y = 0;
                                this.state.images[d].position.x = x;
                                this.state.images[d].position.y = y;
                                this.state.images[d].zOrder = i;
                                this.state.images[d].visible = true;
                                if (!this.state.color[i]) {
                                    this.generateColor();
                                }
                                this.state.images[d].tint = this.state.color[i];
                                if (i > 0) {
                                    // this.state.images[d].alpha = 0.9;
                                    this.state.images[d].blendMode = PIXI.BLEND_MODES.SCREEN;
                                }
                            }
                        }
                    } else {
                        for (i in this.state.stack) {
                            d = i.toString() + ',' + t.toString();
                            if (this.state.images[d] && this.state.images[d].visible) {
                                this.state.images[d].visible = false;
                                console.log('Hiding tile ' + d);
                            }
                        }
                        // console.log('Tile ' + [offX,offY] + ' off screen.');
                    }
                }
            }
        },

        createStatusText: function () {
            if (!this.state.buffer[-1]) {
                var style = {
                    font: '12px Helvetica',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2,
                    dropShadow: true,
                    dropShadowColor: '#000000',
                    dropShadowAngle: Math.PI / 6,
                    dropShadowDistance: 2,
                    wordWrap: true,
                    wordWrapWidth: this.renderer.view.width
                };
                this.state.buffer[-1] = new PIXI.Text(this.state.text, style);
                this.stage.addChild(this.state.buffer[-1]);
            } else {
                this.state.buffer[-1].text = this.state.text;
            }
            // fix position
            this.state.buffer[-1].x = -this.stage.position.x + 20;
            this.state.buffer[-1].y = -this.stage.position.y;
            this.state.buffer[-1].anchor.x = 0;
            this.state.buffer[-1].anchor.y = 0;
            this.state.buffer[-1].zOrder = 1000;
        },

        /**
         * When we get new props, run the appropriate imperative functions
         **/
        componentWillReceiveProps: function (nextProps) {
            var updDst = false;
            if (nextProps.stack !== this.state.stack || nextProps.color !== this.state.color || this.state.serverUrl !== nextProps.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol) || this.state.id !== nextProps.id) {
                this.setState({
                    stack: nextProps.stack,
                    color: nextProps.color,
                    label: nextProps.label,
                    id: nextProps.id,
                    serverUrl: nextProps.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol)
                });
                this.createImages();
                this.updateImages(nextProps);
                this.checkStack();
            }
            if (nextProps.zoomLevel !== this.props.zoomLevel) {
                this.updateZoomLevel(nextProps);
                // recenter display for new image size keeping any stack offset.
                this.disp.position.x = ((this.props.width / 2) - (this.disp.width / 2));
                this.disp.position.y = ((this.props.height / 2) - (this.disp.height / 2));
            }
            if (nextProps.fxp[0] !== this.props.fxp[0] || nextProps.fxp[1] !== this.props.fxp[1] || nextProps.fxp[2] !== this.props.fxp[2]) {
                this.state.dst = nextProps.dst;
                updDst = true;
            }
            if (nextProps.statusText !== this.props.statusText && nextProps.statusText.trim() !== '') {
                this.updateStatusText(nextProps);
            }
            if (nextProps.stackX !== this.stack.position.x || nextProps.stackY !== this.stack.position.y) {
                this.stack.position.x = nextProps.stackX;
                this.stack.position.y = nextProps.stackY;
                if (nextProps.stackX == -10000 && nextProps.stackY == -10000) {
                    this.state.recenter = true;
                    this.checkStack();
                }
            }
            if (nextProps.orth !== this.state.orth) {
                this.changeOrth(nextProps.orth);
                this.state.recenter = true;
                this.callImageSize();
                this.callDstRange();
            }
            if (nextProps.dst !== this.state.dst) {
                this.state.dst = nextProps.dst;
                updDst = true;
            }
            if (nextProps.pit !== this.state.pit) {
                this.state.pit = nextProps.pit;
                updDst = true;
            }
            if (nextProps.yaw !== this.state.yaw) {
                this.state.yaw = nextProps.yaw;
                updDst = true;
            }
            if (nextProps.rol !== this.state.rol) {
                this.state.rol = nextProps.rol;
                updDst = true;
            }
            if (updDst) {
                this.callDstRange();
                this.callImageSize();
                this.updateImages(nextProps);
            }
        },
        /**
         * Update the stage "zoom" level by setting the scale
         **/
        updateZoomLevel: function (props) {
            this.disp.scale.x = props.zoomLevel;
            this.disp.scale.y = props.zoomLevel;
            // update slice view
            this.checkStack();
        },

        /**
         * Update the display text
         **/
        updateStatusText: function (props) {
            this.setStatusText(props.statusText);
        },

        changeOrth: function (orth) {
            // console.log('Orth: ' + orth);
            this.state.orth = orth;
            this.state.images = [];
            this.stack.removeChildren();
            if (orth == 0) {
                console.log('Frontal');
                this.setStatusText('Frontal');
            } else if (orth == 1) {
                console.log('Transverse');
                this.setStatusText('Transverse');
            } else if (orth == 2) {
                console.log('Sagittal');
                this.setStatusText('Sagittal');
            } else {
                console.log('Orth:' + orth);
                this.setStatusText('...');
            }
        },

        setStatusText: function (text) {
            this.state.buffer[-1].text = text;
            this.state.text = text;
            this.state.txtUpdated = Date.now();
        },

        /**
         * Update the stage Image files when any change.
         **/
        updateImages: function (props) {
            var i, j, d, image;
            // console.log(this.state.visibleTiles);
            for (j in this.state.visibleTiles) {
                for (i in this.state.stack) {
                    image = props.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + props.fxp.join(',') + '&scl=' + props.scl.toFixed(1) + '&dst=' + Number(props.dst).toFixed(1) + '&pit=' + Number(props.pit).toFixed(0) + '&yaw=' + Number(props.yaw).toFixed(0) + '&rol=' + Number(props.rol).toFixed(0) + '&qlt=80&jtl=' + this.state.visibleTiles[j].toString();
                    d = i.toString() + ',' + this.state.visibleTiles[j].toString();
                    if (this.state.images[d]) {
                        if (PIXI.loader.resources[image] && PIXI.loader.resources[image].texture) {
                            this.state.images[d].texture = PIXI.loader.resources[image].texture;
                        } else {
                            if (this.state.txtUpdated < Date.now() - this.state.txtStay) {
                                this.state.buffer[-1].text = 'Loading slice ' + Number(props.dst - this.state.minDst).toFixed(1) + '...';
                            }
                            this.state.images[d].texture = PIXI.Texture.fromImage(image);
                            if (!PIXI.loader.resources[image]) {
                                PIXI.loader.add(image, image, {
                                    loadType: PIXI.loaders.Resource.LOAD_TYPE.IMAGE,
                                    xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BLOB
                                });
                            }
                        }
                        this.state.images[d].tint = this.state.color[i];
                        this.state.images[d].zOrder = i;
                        // console.log([d,this.state.images[d].position.x,this.state.images[d].position.y,this.state.images[d].anchor.x,this.state.images[d].anchor.y])
                    }//else{
                    //   console.log(d + ' not loaded!?');
                    //   console.log(this.state.images);
                    //   console.log(this.state.visibleTiles[j]);
                    // }
                }
            }
            PIXI.loader.load();
        },

        /**
         * Animation loop for updating Pixi Canvas
         **/
        animate: function () {
            if (this._isMounted) {
                // render the stage container (if the component is still mounted)
                this.renderer.render(this.stage);
                this.frame = requestAnimationFrame(this.animate);
            }
        },

        onDragStart: function (event) {
            // store a reference to the data
            // the reason for this is because of multitouch
            // we want to track the movement of this particular touch
            this.state.data = event.data;
            this.stack.alpha = 0.7;
            this.state.dragging = true;
            var offPosition = this.state.data.global;
            this.state.dragOffset = {
                x: offPosition.x,
                y: offPosition.y
            };
            //console.log('DragStartOffset:'+JSON.stringify(this.state.dragOffset));
            var startPosition = this.state.data.getLocalPosition(this.stack);
            // console.log([startPosition.x,this.state.imageX*0.5,1/this.disp.scale.x]);
            this.state.posX = Number(startPosition.x.toFixed(0));
            this.state.posY = Number(startPosition.y.toFixed(0));
            //console.log('DragStart:'+JSON.stringify(startPosition));
        },

        onDragEnd: function () {
            if (this.state.data !== null && typeof this.state.data.getLocalPosition === "function") {
                this.stack.alpha = 1;
                var startPosition = this.state.data.getLocalPosition(this.stack);
                var newPosX = Number(startPosition.x.toFixed(0));
                var newPosY = Number(startPosition.y.toFixed(0));
                //console.log('DragEnd:'+JSON.stringify(startPosition));
                if (newPosX == this.state.posX && newPosY == this.state.posY) {
                    this.callObjects();
                    this.state.oldX = newPosX;
                    this.state.oldY = newPosY;
                    this.state.hoverTime = Date.now();
                }
                // set the interaction data to null
                this.state.data = null;
                this.state.dragging = false;
                this.props.setExtent({stackX: this.stack.position.x, stackY: this.stack.position.y});
            }
        },

        onHoverEvent: function (event, repeat) {
            var oldEvent = this.state.oldEvent;
            if (!this.state.loadingLabels && !this.state.dragging) {
                repeat = typeof repeat !== 'undefined' ? repeat : true;
                var currentPosition = this.renderer.plugins.interaction.mouse.getLocalPosition(this.stack);
                currentPosition.x = Number(currentPosition.x.toFixed(0));
                currentPosition.y = Number(currentPosition.y.toFixed(0));
                if (this.state.hoverTime < Date.now() - 1000 && !(this.state.posX == this.state.oldX && this.state.posY == this.state.oldY) && this.state.posX == currentPosition.x && this.state.posY == currentPosition.y) {
                    this.state.hoverTime = Date.now();
                    this.listObjects();
                    this.state.oldX = currentPosition.x;
                    this.state.oldY = currentPosition.y;
                } else {
                    // Timeout:
                    if (this.state.hoverTime < Date.now() - 5000) {
                        this.listObjects();
                    }
                    // Check valid value:
                    if (this.state.hoverTime > Date.now()) {
                        this.state.hoverTime = Date.now();
                        this.listObjects();
                    }
                    // update new position:
                    this.state.posX = currentPosition.x;
                    this.state.posY = currentPosition.y;
                    if (repeat) {
                        clearTimeout(oldEvent);
                        oldEvent = setTimeout(function (func, event) {
                            func(event, false);
                        }, 1000, this.onHoverEvent, event);
                    }
                }
            } else if (this.state.loadingLabels) {
                if (repeat) {
                    clearTimeout(oldEvent);
                    oldEvent = setTimeout(function (func, event) {
                        func(event, false);
                    }, 5000, this.onHoverEvent, event);
                }
            }
            this.state.oldEvent = oldEvent;
        },

        onDragMove: function (event) {
            if (this.state.dragging) {
                var newPosition = this.state.data.global;
                var xmove = (newPosition.x - this.state.dragOffset.x) / this.disp.scale.x;
                var ymove = (newPosition.y - this.state.dragOffset.y) / this.disp.scale.y;
                this.state.dragOffset.x = newPosition.x;
                this.state.dragOffset.y = newPosition.y;
                this.stack.position.x += xmove;
                this.stack.position.y += ymove;
                //console.log('Moving :'+xmove+','+ymove);
                this.state.buffer[-1].text = 'Moving stack... (X:' + Number(this.stack.position.x).toFixed(2) + ',Y:' + Number(this.stack.position.y).toFixed(2) + ')';
                // update slice view
                this.checkStack();
            } else {
                this.onHoverEvent(event);
            }
        },

        /**
         * Render our container that will store our PixiJS game canvas. Store the ref
         **/
        render: function () {
            return (
                < div
            className = "stack-canvas-container"
            ref = "stackCanvas" > < /div>
        )
            ;
        }
    });

    var prefix = "", _addEventListener, onwheel, support;

    var StackViewerComponent = React.createClass({
        _isMounted: false,

        getInitialState: function () {
            return {
                zoomLevel: 0.5,
                dst: 0,
                text: '',
                stackX: -10000,
                stackY: -10000,
                imageX: 1024,
                imageY: 1024,
                fxp: [511, 255, 108],
                pit: 0,
                yaw: 0,
                rol: 0,
                scl: 1.0,
                voxelX: (this.props.voxel.x || 0.622088),
                voxelY: (this.props.voxel.y || 0.622088),
                voxelZ: (this.props.voxel.z || 0.622088),
                minDst: -100,
                maxDst: 100,
                orth: 0,
                color: [],
                stack: [],
                label: [],
                id: [],
                tempId: [],
                tempName: [],
                tempType: [],
                plane: null,
                initalised: false,
                slice: false
            };
        },

        onWheelEvent: function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            var newdst = this.state.dst;
            if (e.ctrlKey && e.wheelDelta > 0) {
                this.onZoomIn();
            } else if (e.ctrlKey && e.wheelDelta < 0) {
                this.onZoomOut();
            } else {
                // Mac keypad returns values (+/-)1-20 Mouse wheel (+/-)120
                var step = -1 * e.wheelDelta;
                // Max step of imposed
                if (step > 0) {
                    if (this.state.orth == 0) {
                        step = this.state.voxelZ;
                    } else if (this.state.orth == 1) {
                        step = this.state.voxelY;
                    } else if (this.state.orth == 2) {
                        step = this.state.voxelX;
                    }
                } else if (step < 0) {
                    if (this.state.orth == 0) {
                        step = -this.state.voxelZ;
                    } else if (this.state.orth == 1) {
                        step = -this.state.voxelY;
                    } else if (this.state.orth == 2) {
                        step = -this.state.voxelX;
                    }
                }
                if (e.shiftKey) {
                    newdst += step * 10;
                } else {
                    newdst += step;
                }

                if (newdst < this.state.maxDst && newdst > this.state.minDst) {
                    this.setState({dst: newdst, text: 'Slice:' + (newdst - this.state.minDst).toFixed(1)});
                } else if (newdst < this.state.maxDst) {
                    newdst = this.state.minDst;
                    this.setState({dst: newdst, text: 'First slice!'});
                } else if (newdst > this.state.minDst) {
                    newdst = this.state.maxDst;
                    this.setState({dst: newdst, text: 'Last slice!'});
                }
            }
        },

        componentDidMount: function () {
            this._isMounted = true;

            // detect event model
            if (window.addEventListener) {
                this._addEventListener = "addEventListener";
            } else {
                this._addEventListener = "attachEvent";
                prefix = "on";
            }

            // detect available wheel event
            support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
                document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
                    "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
            this.addWheelListener($('#' + this.props.data.id + 'displayArea')[0], function (e) {
                this.onWheelEvent(e);
            }.bind(this));

            if (this.props.data && this.props.data != null && this.props.data.instances && this.props.data.instances != null) {
                this.handleInstances(this.props.data.instances);
            }
        },

        componentWillReceiveProps: function (nextProps) {
            if (nextProps.data && nextProps.data != null) {
                if (nextProps.data.instances && nextProps.data.instances != null) {
                    this.handleInstances(nextProps.data.instances);
                }

                if (nextProps.data.height && nextProps.data.height != null) {
                    this.setState({height: nextProps.data.height});
                }
                if (nextProps.data.width && nextProps.data.width != null) {
                    this.setState({width: nextProps.data.width});
                }
                if (nextProps.config && nextProps.config != null && nextProps.config.subDomains && nextProps.config.subDomains != null && nextProps.config.subDomains.length && nextProps.config.subDomains.length > 0 && nextProps.config.subDomains[0] && nextProps.config.subDomains[0].length && nextProps.config.subDomains[0].length > 2) {
                    this.setState({
                        voxelX: Number(nextProps.config.subDomains[0][0] || 0.622088),
                        voxelY: Number(nextProps.config.subDomains[0][1] || 0.622088),
                        voxelZ: Number(nextProps.config.subDomains[0][2] || 0.622088),
                    });
                }
                if (nextProps.config && nextProps.config != null) {
                    if (nextProps.config.subDomains && nextProps.config.subDomains != null && nextProps.config.subDomains.length) {
                        if (nextProps.config.subDomains.length > 0 && nextProps.config.subDomains[0] && nextProps.config.subDomains[0].length && nextProps.config.subDomains[0].length > 2) {
                            this.setState({
                                voxelX: Number(nextProps.config.subDomains[0][0] || 0.622088),
                                voxelY: Number(nextProps.config.subDomains[0][1] || 0.622088),
                                voxelZ: Number(nextProps.config.subDomains[0][2] || 0.622088),
                            });
                        }
                        if (nextProps.config.subDomains.length > 4 && nextProps.config.subDomains[1] != null) {
                            this.setState({
                                tempName: nextProps.config.subDomains[2],
                                tempId: nextProps.config.subDomains[1],
                                tempType: nextProps.config.subDomains[3]
                            });
                            if (nextProps.config.subDomains[4] && nextProps.config.subDomains[4].length && nextProps.config.subDomains[4].length > 0) {
                                this.setState({fxp: JSON.parse(nextProps.config.subDomains[4][0])});
                            }
                        }
                    }
                }
                if (nextProps.voxel && nextProps.voxel != null) {
                    this.setState({voxelX: nextProps.voxel.x, voxelY: nextProps.voxel.y, voxelZ: nextProps.voxel.z});
                }
            }
        },

        handleInstances: function (instances) {
            if (instances && instances != null && instances.length > 0) {
                var instance;
                var data, vals;
                var files = [];
                var colors = [];
                var labels = [];
                var ids = [];
                var server = this.props.config.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol);
                for (instance in instances) {
                    try {
                        if (instances[instance].id != undefined){
	                    	vals = instances[instance].getVariable().getInitialValue().value;
	                        data = JSON.parse(vals.data);
	                        server = data.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol);
	                        files.push(data.fileLocation);
	                        // Take multiple ID's for template
	                        if (typeof this.props.config.templateId !== 'undefined' && typeof this.props.config.templateDomainIds !== 'undefined' && instances[instance].parent.getId() == this.props.config.templateId) {
	                            ids.push(this.props.config.templateDomainIds);
	                        } else {
	                            ids.push([instances[instance].parent.getId()]);
	                        }
	                        labels.push(instances[instance].parent.getName());
	                        if (instances[instance].parent.isSelected() || (typeof instances[instance].parent[instances[instance].parent.getId() + '_obj'] != 'undefined' && instances[instance].parent[instances[instance].parent.getId() + '_obj'].isSelected()) || (typeof instances[instance].parent[instances[instance].parent.getId() + '_swc'] != 'undefined' && instances[instance].parent[instances[instance].parent.getId() + '_swc'].isSelected())) {
	                            colors.push('0Xffcc00'); // selected
	                        } else {
	                            colors.push(instances[instance].parent.getColor().replace('#', '0X'));
	                        }
                        }
                    }
                    catch (err) {
                        console.log('Error handling ' + instance);
                        console.log(err.message);
                        console.log(err.stack);
                    }
                }
                if (server != this.props.config.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol) && server != null) {
                    this.setState({serverURL: server});
                    // console.log('Changing IIP server to ' + server);
                }
                if (files != this.state.stack && files != null && files.length > 0) {
                    this.setState({stack: files});
                    // console.log('setting stack to ' + JSON.stringify(files));
                }
                if (labels != this.state.label && labels != null && labels.length > 0) {
                    this.setState({label: labels});
                    // console.log('updating labels to ' + JSON.stringify(labels));
                }
                if (ids != this.state.id && ids != null && ids.length > 0) {
                    this.setState({id: ids});
                    // console.log('updating ids to ' + JSON.stringify(ids));
                }
                if (colors.toString() != this.state.color.toString() && colors != null && colors.length > 0) {
                    this.setState({color: colors});
                    // console.log('updating colours to ' + JSON.stringify(colors));
                }
            } else {
                this.setState({label: [], stack: [], id: [], color: []});
            }
        },

        componentWillUnmount: function () {
            clearTimeout(this.state.oldEvent);
            this._isMounted = false;
            return true;
        },
        /**
         * Event handler for clicking zoom in. Increments the zoom level
         **/
        onZoomIn: function () {
            var zoomLevel = 1;
            if (GEPPETTO.isKeyPressed("shift")) {
                zoomLevel = Number((this.state.zoomLevel += 1).toFixed(1));
            } else {
                zoomLevel = Number((this.state.zoomLevel += 0.1).toFixed(1));
            }
            if (zoomLevel < 10.0) {
                this.setState({
                    zoomLevel: zoomLevel,
                    text: 'Zooming in to (X' + Number(zoomLevel).toFixed(1) + ')'
                });
            } else {
                this.setState({zoomLevel: 10.0, text: 'Max zoom! (X10)'});
            }
        },

        toggleOrth: function () {
            var orth = this.state.orth += 1;
            var pit, yaw, rol;
            if (orth > 2) {
                orth = 0;
                this.state.orth = orth;
            }
            if (orth == 0) {
                pit = 0;
                yaw = 0;
                rol = 0;
            } else if (orth == 1) {
                pit = 90;
                yaw = 90;
                rol = 270;
            } else if (orth == 2) {
                pit = 90;
                yaw = 0;
                rol = 0;
            }
            this.setState({orth: orth, pit: pit, yaw: yaw, rol: rol, dst: 0, stackX: -10000, stackY: -10000});
        },

        toggleSlice: function () {
            if (this.state.slice) {
                this.setState({slice: false});
            } else {
                this.setState({slice: true});
            }
        },

        /**
         * Event handler for clicking zoom out. Decrements the zoom level
         **/
        onZoomOut: function () {
            var zoomLevel = 1;
            if (GEPPETTO.isKeyPressed("shift")) {
                zoomLevel = Number((this.state.zoomLevel -= 1).toFixed(1));
            } else {
                zoomLevel = Number((this.state.zoomLevel -= .1).toFixed(1));
            }
            if (zoomLevel > 0.1) {
                this.setState({
                    zoomLevel: zoomLevel,
                    text: 'Zooming out to (X' + Number(zoomLevel).toFixed(1) + ')'
                });
            } else {
                this.setState({zoomLevel: 0.1, text: 'Min zoom! (X0.1)'});
            }
        },

        /**
         * Event handler for clicking step in. Increments the dst level - TODO Remove
         **/
        onStepIn: function () {
            var shift = GEPPETTO.isKeyPressed("shift");
            var newdst = this.state.dst
            if (shift) {
                newdst += this.state.voxelZ * 10;
            } else {
                newdst += this.state.voxelZ;
            }
            if (newdst < this.state.maxDst && newdst > this.state.minDst) {
                this.setState({dst: newdst, text: 'Slice:' + (newdst - this.state.minDst).toFixed(1)});
            } else if (newdst < this.state.maxDst) {
                newdst = this.state.minDst;
                this.setState({dst: newdst, text: 'First slice!'});
            } else if (newdst > this.state.minDst) {
                newdst = this.state.maxDst;
                this.setState({dst: newdst, text: 'Last slice!'});
            }
        },
        /**
         * Event handler for clicking step out. Decrements the dst level - TODO Remove
         **/
        onStepOut: function () {
            var shift = GEPPETTO.isKeyPressed("shift");
            var newdst = this.state.dst
            if (shift) {
                newdst -= this.state.voxelZ * 10;
            } else {
                newdst -= this.state.voxelZ;
            }
            if (newdst < this.state.maxDst && newdst > this.state.minDst) {
                this.setState({dst: newdst, text: 'Slice:' + (newdst - this.state.minDst).toFixed(1)});
            } else if (newdst < this.state.maxDst) {
                newdst = this.state.minDst;
                this.setState({dst: newdst, text: 'First slice!'});
            } else if (newdst > this.state.minDst) {
                newdst = this.state.maxDst;
                this.setState({dst: newdst, text: 'Last slice!'});
            }
        },

        /**
         * Event handler for clicking Home.
         **/
        onHome: function () {
            var autoScale = Number(Math.min(this.props.data.height / this.state.imageY, this.props.data.width / this.state.imageX).toFixed(1));
            this.setState({dst: 0, stackX: -10000, stackY: -10000, text: 'Stack Centred', zoomLevel: autoScale});
        },

        onExtentChange: function (data) {
            this.setState(data);
            if (!this.state.initalised && JSON.stringify(data).indexOf('imageX') > -1) {
                this.state.initalised = true;
                this.onHome();
            }
        },

        addWheelListener: function (elem, callback, useCapture) {
            this._addWheelListener(elem, support, callback, useCapture);

            // handle MozMousePixelScroll in older Firefox
            if (support == "DOMMouseScroll") {
                this._addWheelListener(elem, "MozMousePixelScroll", callback, useCapture);
            }
        },

        _addWheelListener: function (elem, eventName, callback, useCapture) {
            elem[this._addEventListener](prefix + eventName, support == "wheel" ? callback : function (originalEvent) {
                !originalEvent && ( originalEvent = window.event );

                // create a normalized event object
                var event = {
                    // keep a ref to the original event object
                    originalEvent: originalEvent,
                    target: originalEvent.target || originalEvent.srcElement,
                    type: "wheel",
                    deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
                    deltaX: 0,
                    delatZ: 0,
                    preventDefault: function () {
                        originalEvent.preventDefault ?
                            originalEvent.preventDefault() :
                            originalEvent.returnValue = false;
                    }
                };

                // calculate deltaY (and deltaX) according to the event
                if (support == "mousewheel") {
                    event.deltaY = -1 / 40 * originalEvent.wheelDelta;
                    // Webkit also support wheelDeltaX
                    originalEvent.wheelDeltaX && ( event.deltaX = -1 / 40 * originalEvent.wheelDeltaX );
                } else {
                    event.deltaY = originalEvent.detail;
                }

                // it's time to fire the callback
                return callback(event);

            }, useCapture || false);
        },

        render: function () {
            var homeClass = 'btn fa fa-home';
            var zoomInClass = 'btn fa fa-search-plus';
            var zoomOutClass = 'btn fa fa-search-minus';
            var stepInClass = 'btn fa fa-chevron-down';
            var stepOutClass = 'btn fa fa-chevron-up';
            var pointerClass = 'btn fa fa-hand-pointer-o';
            var orthClass = 'btn fa fa-refresh';
            var toggleSliceClass = 'btn ';
            if (this.state.slice) {
                toggleSliceClass += 'gpt-hideplane';
            }else{
                toggleSliceClass += 'gpt-showplane';
            }
            var startOffset = 2.5;
            var displayArea = this.props.data.id + 'displayArea';

            var markup = '';
            if (this.state.stack.length > 0) {
                markup = (
                    <div id={displayArea} style={{position: 'absolute', top: -1, left: -1}}>
                        <button style={{
                            position: 'absolute',
                            left: 2.5,
                            top: startOffset,
                            padding: 0,
                            border: 0,
                            background: 'transparent'
                        }} className={homeClass} onClick={this.onHome} title={'Center Stack'}/>
                        <button style={{
                            position: 'absolute',
                            left: 2.5,
                            top: startOffset + 20,
                            padding: 0,
                            border: 0,
                            background: 'transparent'
                        }} className={zoomInClass} onClick={this.onZoomIn} title={'Zoom In'}/>
                        <button style={{
                            position: 'absolute',
                            left: 2.5,
                            top: startOffset + 35,
                            padding: 0,
                            border: 0,
                            background: 'transparent'
                        }} className={zoomOutClass} onClick={this.onZoomOut} title={'Zoom Out'}/>
                        <button style={{
                            position: 'absolute',
                            left: 2.5,
                            top: startOffset + 64,
                            padding: 0,
                            border: 0,
                            background: 'transparent'
                        }} className={stepInClass} onClick={this.onStepIn} title={'Step Into Stack'}/>
                        <button style={{
                            position: 'absolute',
                            left: 2.5,
                            top: startOffset + 52,
                            padding: 0,
                            border: 0,
                            background: 'transparent'
                        }} className={stepOutClass} onClick={this.onStepOut} title={'Step Out Of Stack'}/>
                        <button style={{
                            position: 'absolute',
                            left: 2.5,
                            top: startOffset + 83,
                            padding: 0,
                            border: 0,
                            background: 'transparent'
                        }} className={orthClass} onClick={this.toggleOrth} title={'Change Slice Plane Through Stack'}/>
                        <button style={{
                            position: 'absolute',
                            left: 3.5,
                            top: startOffset + 106,
                            padding: 0,
                            border: 0,
                            background: 'transparent'
                        }} className={toggleSliceClass} onClick={this.toggleSlice} title={'Toggle the 3D slice display'}/>
                        <Canvas zoomLevel={this.state.zoomLevel} dst={this.state.dst}
                                serverUrl={this.props.config.serverUrl} canvasRef={this.props.canvasRef}
                                fxp={this.state.fxp} pit={this.state.pit} yaw={this.state.yaw} rol={this.state.rol}
                                stack={this.state.stack} color={this.state.color} setExtent={this.onExtentChange}
                                statusText={this.state.text} stackX={this.state.stackX} stackY={this.state.stackY}
                                scl={this.state.scl} orth={this.state.orth}
                                label={this.state.label} id={this.state.id} height={this.props.data.height}
                                width={this.props.data.width} voxelX={this.state.voxelX}
                                voxelY={this.state.voxelY} voxelZ={this.state.voxelZ} displayArea={displayArea}
                                templateId={this.props.config.templateId}
                                templateDomainIds={this.state.tempId}
                        		templateDomainTypeIds={this.state.tempType}
                                templateDomainNames={this.state.tempName}
                                slice={this.state.slice} />
                    </div>
                );
            } else {
                markup = (
                    < div
                id = {displayArea}
                style = {
                {
                    position: 'absolute',
                        top
                :
                    -1,
                        left
                :
                    -1,
                        background
                :
                    'black',
                        width
                :
                    this.props.data.width,
                        height
                :
                    this.props.data.height
                }
            }>
            <
                /div>
            )
                ;
            }

            return markup;
        }
    });

    return StackViewerComponent;
});
