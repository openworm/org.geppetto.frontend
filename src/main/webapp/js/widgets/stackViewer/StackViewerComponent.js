define(function (require) {

    require('widgets/stackViewer/vendor/pixi.min');
    require('widgets/stackViewer/vendor/browser.min');
    var React = require('react');

    var Canvas = React.createClass({
        getInitialState: function () {
            return {
                buffer: {},
                images: {},
                text: this.props.statusText,
                serverUrl: this.props.serverUrl,
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
                plane: [0,0,0,this.props.width,0,0,0,this.props.height,0,this.props.width,this.props.height,0],
                planeUpdating: false,
                lastUpdate: 0,
                updating: false,
                numTiles: 1,
                posX: 0,
                posY: 0,
                loadingLabels: false,
                mode: this.props.mode,
                orth: this.props.orth
            };
        },
        /**
         * In this case, componentDidMount is used to grab the canvas container ref, and
         * and hook up the PixiJS renderer
         **/
        componentDidMount: function () {
            console.log('Loading....');
            //Setup PIXI Canvas in componentDidMount
            this.renderer = PIXI.autoDetectRenderer(this.props.width, this.props.height);
            // maintain full window size
            this.refs.stackCanvas.appendChild(this.renderer.view);


            // create the root of the scene graph
            this.stage = new PIXI.Container();
            this.stage.pivot.x = 0;
            this.stage.pivot.y = 0;
            this.stage.position.x = this.renderer.view.width * 0.5;
            this.stage.position.y = this.renderer.view.height * 0.5;
            this.disp = new PIXI.Container();
            this.disp.pivot.x = 0;
            this.disp.pivot.y = 0;
            this.stage.addChild(this.disp);
            this.stack = new PIXI.Container();
            this.stack.pivot.x = 0;
            this.stack.pivot.y = 0;

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
            GEPPETTO.getVARS().scene.remove(window.stackViewerPlane);
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
                    this.state.buffer[-1].text = '';
                    // console.log(image);
                    // console.log(JSON.stringify({minDst: min, maxDst: max}));
                    this.callPlaneEdges();
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
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
                    // console.log(data.trim());
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
                    console.error(this.props.url, status, err.toString());
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
                    // console.log(data.trim());
                    var result = data.trim().split(':')[1].split(' ');
                    var imageX = Number(result[0]);
                    var imageY = Number(result[1]);
                    this.setState({imageX: imageX, imageY: imageY});

                    // update slice view
                    this.state.lastUpdate = 0;
                    this.checkStack();
                    this.callPlaneEdges();
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }.bind(this)
            });
        },

        callPlaneEdges: function() {
            if (!this.state.planeUpdating) {
                this.state.planeUpdating = true;
                if (this.stack.width > 1) {
                    // console.log('Render width: ' + this.renderer.view.width);
                    // console.log('Stack width: ' + this.stack.width);
                    // console.log('Stack pox x: ' + this.stack.position.x);
                    // console.log('Display area width: ' + $('#displayArea').width());
                    // console.log('Stage width: ' + this.stage.width);
                    // console.log('Stage pox x: ' + this.stage.position.x);
                    var coordinates = [];
                    var x, y, z;
                    // update widget window extents (X,Y) :
                    x = (this.stack.width * 0.5) - (this.stage.position.x + this.stack.position.x);
                    y = (this.stack.height * 0.5) - (this.stage.position.y + this.stack.position.y);
                    coordinates[0] = x.toFixed(0);
                    coordinates[1] = y.toFixed(0);
                    x = x + this.renderer.view.width;
                    y = y + this.renderer.view.height;
                    coordinates[2] = x.toFixed(0);
                    coordinates[3] = y.toFixed(0);
                    // console.log('Visible screen: ' + coordinates);
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
                    } else if (this.state.orth == 2) { // sagital
                        this.state.plane[2] = coordinates[1];
                        this.state.plane[1] = coordinates[0];
                        this.state.plane[5] = coordinates[1];
                        this.state.plane[4] = coordinates[2];
                        this.state.plane[8] = coordinates[3];
                        this.state.plane[7] = coordinates[0];
                        this.state.plane[11] = coordinates[3];
                        this.state.plane[10] = coordinates[2];
                    }
                }
                // Pass Z coordinates
                z = this.props.dst - (this.state.minDst);
                // console.log('z: ' + z);
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
                } else if (this.state.orth == 2) { // sagital
                    this.state.plane[0] = z;
                    this.state.plane[3] = z;
                    this.state.plane[6] = z;
                    this.state.plane[9] = z;
                }
                this.passPlane();
            }
        },

        passPlane: function () {
            if (window.stackViewerPlane) {
                // console.log('Moving plane to: ' + this.state.plane);
                window.stackViewerPlane=GEPPETTO.SceneFactory.modify3DPlane(window.stackViewerPlane, this.state.plane[0], this.state.plane[1], this.state.plane[2], this.state.plane[3], this.state.plane[4], this.state.plane[5], this.state.plane[6], this.state.plane[7], this.state.plane[8], this.state.plane[9], this.state.plane[10], this.state.plane[11]);
            }else{
                // console.log('Creating plane: ' + this.state.plane);
                window.stackViewerPlane=GEPPETTO.SceneFactory.add3DPlane(this.state.plane[0], this.state.plane[1], this.state.plane[2], this.state.plane[3], this.state.plane[4], this.state.plane[5], this.state.plane[6], this.state.plane[7], this.state.plane[8], this.state.plane[9], this.state.plane[10], this.state.plane[11]);
                if (!window.stackViewerPlane.visible) {
                    window.stackViewerPlane.visible = true;
                }
            }
            this.state.planeUpdating = false;
        },

        callObjects: function () {

            var i, j, result, id, label;
            var that = this;
            while (GEPPETTO.G.getSelection()[0] != undefined) {
                GEPPETTO.G.getSelection()[0].deselect();
            }
            $.each(this.state.stack, function (i, item) {
                (function(i, that) {
                    if (i>0 || that.state.stack.length == 1) {
                        var image = that.state.serverUrl.toString() + '?wlz=' + item + '&sel=0,255,255,255&mod=zeta&fxp=' + that.props.fxp.join(',') + '&scl=' + that.props.scl.toFixed(1) + '&dst=' + Number(that.state.dst).toFixed(1) + '&pit=' + Number(that.state.pit).toFixed(0) + '&yaw=' + Number(that.state.yaw).toFixed(0) + '&rol=' + Number(that.state.rol).toFixed(0);
                        //get image size;
                        $.ajax({
                            url: image + '&prl=-1,' + that.state.posX.toFixed(0) + ',' + that.state.posY.toFixed(0) + '&obj=Wlz-foreground-objects',
                            type: 'POST',
                            success: function (data) {
                                result = data.trim().split(':')[1].trim().split(' ');
                                if (result !== '') {
                                    for (j in result) {
                                        if (result[j] == '0') {
                                            console.log(that.state.label[i] + ' clicked');
                                            eval(that.state.id[i]).select();
                                            that.setStatusText(that.state.label[i] + ' clicked!');
                                            that.setState({text: that.state.label[i] + ' clicked!'});
                                        } else {
                                            console.log('Odd value: ' + result[j].toString());
                                        }
                                    }
                                }
                                // update slice view
                                that.state.lastUpdate = 0;
                                that.checkStack();
                            },
                            error: function (xhr, status, err) {
                                console.error(that.props.url, status, err.toString());
                            }.bind(this)
                        });
                    }
                })(i, that);
            });
        },

        listObjects: function () {

            var i, j, result;
            var that = this;
            for (i in this.state.stack) {
                var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.disp.scale.x.toFixed(1) + '&dst=' + Number(this.state.dst).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0);
                //get image size;
                $.ajax({
                    url: image + '&prl=-1,' + this.state.posX + ',' + this.state.posY + '&obj=Wlz-foreground-objects',
                    type: 'POST',
                    success: function (data) {
                        // console.log(that.props.label[i] + ' - ' + data.trim());
                        result = data.trim().split(':')[1].trim().split(' ');
                        if (result !== '') {
                            for (j in result) {
                                if (result[j] == '0') {
                                    console.log(that.props.label[i]);
                                    that.setStatusText(that.props.label[i]);
                                } else {
                                    console.log('Odd value: ' + result[j].toString());
                                }
                            }
                        }

                        // update slice view
                        that.state.lastUpdate = 0;
                        that.checkStack();
                        that.state.loadingLabels = false;

                    }.bind({that: this, i: i}),
                    error: function (xhr, status, err) {
                        console.error(this.props.url, status, err.toString());
                    }.bind(this)
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
                    if (this.state.orth == 0){
                        step = this.state.voxelZ;
                    }else if (this.state.orth == 1){
                        step = this.state.voxelY;
                    }else if (this.state.orth == 2){
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
                for (j = 0; j < this.state.numTiles; j++) {
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
                    this.state.buffer[-1].text = 'Buffering stack ' + loader.progress.toFixed(1) + "%";
                }
            }

            function setup() {
                // console.log('Buffered ' + (1000 - buffMax).toString() + ' tiles');
                this.state.buffer[-1].text = '';
            }
        },

        checkStack: function () {
            if (this.state.lastUpdate < (Date.now() - 2000)) {
                this.state.lastUpdate = Date.now();
                this.state.buffer[-1].text = '';
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
        },

        generateColor: function () {
            var i;
            for (i in this.state.stack) {
                if (this.state.stack[i] && this.state.stack[i].trim() !== '' && !this.state.color[i]) {
                    this.setState({color: this.state.color.concat([Math.random() * 0xFFFFFF])});
                }
            }
        },

        createImages: function () {
            var i, x, y, w, h, d, offX, offY, t, image;
            // move through tiles
            // console.log('Creating slice view...');
            this.state.visibleTiles = [];
            w = Math.ceil(this.state.imageX / this.state.tileX);
            h = Math.ceil(this.state.imageY / this.state.tileY);
            // console.log('Tile grid is ' + w.toString() + ' wide by ' + h.toString() + ' high');
            this.state.numTiles = w * h;
            for (t = 0; t < w * h; t++) {
                x = -(this.state.imageX * 0.5);
                y = -(this.state.imageY * 0.5);
                offY = 0;
                if ((t + 1) > w) {
                    offY = Math.floor(t / w);
                }
                offX = (t - (offY * w));
                x += offX * this.state.tileX;
                y += offY * this.state.tileY;
                // console.log('Tiling: ' + [t,offX,offY,x,y,w,h]);
                if (((x * this.disp.scale.x) + this.stack.position.x) > -((this.renderer.view.width * 1) + (this.state.tileX * 2)) && ((x * this.disp.scale.x) + this.stack.position.x) < ((this.renderer.view.width * 1) + (this.state.tileX * 1)) && ((y * this.disp.scale.y) + this.stack.position.y) > -((this.renderer.view.height * 1) + (this.state.tileY * 2)) && ((y * this.disp.scale.y) + this.stack.position.y) < ((this.renderer.view.height * 1) + (this.state.tileY * 1))) {
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
        },

        createStatusText: function () {
            if (!this.state.buffer[-1]) {
                var style = {
                    font: '13px Helvetica',
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
            this.state.buffer[-1].x = -this.stage.position.x;
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
            if (nextProps.text == 'View reset'){
                console.log('Reseting position...');
                this.stage.position.x = this.renderer.view.width * 0.5;
                this.stage.position.y = this.renderer.view.height * 0.5;
            }
            if (nextProps.stack !== this.state.stack || nextProps.color !== this.state.color || this.state.serverUrl !== nextProps.serverUrl) {
                this.state.stack = nextProps.stack;
                this.state.color = nextProps.color;
                this.state.label = nextProps.label;
                this.state.id = nextProps.id;
                this.state.serverUrl = nextProps.serverUrl;
                this.createImages();
                this.updateImages(nextProps);
            }
            if (nextProps.zoomLevel !== this.props.zoomLevel) {
                this.updateZoomLevel(nextProps);
            }
            if (nextProps.fxp !== this.props.fxp) {
                this.state.dst = nextProps.dst;
                updDst = true;
            }
            if (nextProps.statusText !== this.state.buffer[-1].text) {
                this.updateStatusText(nextProps);
            }
            if (nextProps.stackX !== this.stack.position.x || nextProps.stackY !== this.stack.position.y) {
                this.stack.position.x = nextProps.stackX;
                this.stack.position.y = nextProps.stackY;
            }
            if (nextProps.mode !== this.state.mode) {
                this.changeMode(nextProps.mode);
            }
            if (nextProps.orth !== this.state.orth) {
                this.changeOrth(nextProps.orth);
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
            this.state.buffer[-1].text = props.statusText;
            this.setState({text: props.statusText});
        },

        changeMode: function (mode) {
            // console.log('Mode: ' + mode);
            this.state.mode = mode;
            if (mode == 0) {
                console.log('Selection');
                this.updateStatusText({statusText: 'Selection'});
            }else if (mode == 1) {
                console.log('Label');
                this.updateStatusText({statusText: 'Hover Labels'});
            }else if (mode == 2) {
                console.log('Add');
                this.updateStatusText({statusText: 'Add Anatomy'});
            }else{
                console.log('Mode:' + mode);
                this.updateStatusText({statusText: '...'});
            }
        },

        changeOrth: function (orth) {
            // console.log('Orth: ' + orth);
            this.state.orth = orth;
            if (orth == 0) {
                console.log('Frontal');
                this.updateStatusText({statusText: 'Frontal'});
            }else if (orth == 1) {
                console.log('Transverse');
                this.updateStatusText({statusText: 'Transverse'});
            }else if (orth == 2) {
                console.log('Sagital');
                this.updateStatusText({statusText: 'Sagital'});
            }else {
                console.log('Orth:' + orth);
                this.updateStatusText({statusText: '...'});
            }
        },

        setStatusText: function (text) {
            this.setState({text: text});
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
                            // console.log('Loading ' + image);
                            this.state.buffer[-1].text = 'Loading slice ' + Number(props.dst-this.state.minDst).toFixed(1) + '...';
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
            // render the stage container
            this.renderer.render(this.stage);
            this.frame = requestAnimationFrame(this.animate);
        },

        onDragStart: function (event) {
            // store a reference to the data
            // the reason for this is because of multitouch
            // we want to track the movement of this particular touch
            // console.log('drag start');
            this.stack.data = event.data;
            this.stack.alpha = 0.7;
            this.stack.dragging = true;
            var startPosition = this.stack.data.getLocalPosition(this.disp);
            this.stack.dragOffset = {
                x: (startPosition.x - this.stack.position.x),
                y: (startPosition.y - this.stack.position.y)
            };
            startPosition = this.stack.data.getLocalPosition(this.stack);
            // console.log([startPosition.x,this.state.imageX*0.5,1/this.disp.scale.x]);
            this.state.posX = startPosition.x + ((this.state.imageX * 0.5) * (1 / this.disp.scale.x));
            this.state.posY = startPosition.y + ((this.state.imageY * 0.5) * (1 / this.disp.scale.y));
            // console.log([this.state.posX,this.state.posY]);
        },

        onDragEnd: function () {
            if (this.stack.data !== null) {
                // console.log('drag stop');
                this.stack.alpha = 1;

                this.stack.dragging = false;
                var startPosition = this.stack.data.getLocalPosition(this.stack);
                var newPosX = startPosition.x + ((this.state.imageX * 0.5) * (1 / this.disp.scale.x));
                var newPosY = startPosition.y + ((this.state.imageY * 0.5) * (1 / this.disp.scale.y));
                if (newPosX == this.state.posX && newPosY == this.state.posY) {
                    // console.log([newPosX, newPosY]);
                    this.callObjects();
                }
                // set the interaction data to null
                this.stack.data = null;
            }
        },

        onHoverEvent: function (event) {
            if (!this.state.loadingLabels) {
                this.state.loadingLabels = true;
                this.stack.data = event.data;
                var currentPosition = this.stack.data.getLocalPosition(this.stack);
                //console.log(currentPosition);
                var xOffset = (this.state.imageX * 0.5) * (1 / this.disp.scale.x);
                var yOffset = (this.state.imageY * 0.5) * (1 / this.disp.scale.y);
                //console.log(xOffset);
                //console.log(yOffset);
                this.state.posX = (currentPosition.x + xOffset);
                this.state.posY = (currentPosition.y + yOffset);
                //console.log(this.state.posX);
                //console.log(this.state.posY);
                if (this.state.posX > 0 && this.state.posY > 0 && this.state.posX < (xOffset * 2.0) && this.state.posY < (yOffset * 2.0)) {
                    this.listObjects();
                }
            }
        },

        onDragMove: function (event) {
            if (this.stack.dragging) {
                var startPosition = this.stack.dragOffset;
                var newPosition = this.stack.data.getLocalPosition(this.stack);
                this.stack.position.x += newPosition.x - startPosition.x;
                this.stack.position.y += newPosition.y - startPosition.y;
                this.props.setExtent({stackX: this.stack.position.x, stackY: this.stack.position.y});
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
                <div className="stack-canvas-container" ref="stackCanvas">
                </div>
            );
        }
    });

    var prefix = "", _addEventListener, onwheel, support;

    var StackViewerComponent = React.createClass({
        getInitialState: function () {
            return {
                zoomLevel: 1.0,
                dst: 0,
                text: '',
                serverUrl: 'http://vfbdev.inf.ed.ac.uk/fcgi/wlziipsrv.fcgi',
                stackX: 0,
                stackY: 0,
                fxp: [511, 255, 108],
                pit: 0,
                yaw: 0,
                rol: 0,
                scl: 1.0,
                voxelX: 0.622088,
                voxelY: 0.622088,
                voxelZ: 0.622088,
                minDst: -100,
                maxDst: 100,
                orth: 0,
                color: [0xFFFFFF],
                stack: ['/disk/data/VFB/IMAGE_DATA/VFB/i/0001/7894/volume.wlz'],
                label: ['Adult Brain'],
                id: ['VFB_00017894'],
                mode: 0,
                plane: null
            }; // mode: 0=select, 1=label, 2=add.
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
                    if (this.state.orth == 0){
                        step = this.state.voxelZ;
                    }else if (this.state.orth == 1){
                        step = this.state.voxelY;
                    }else if (this.state.orth == 2){
                        step = this.state.voxelX;
                    }
                } else if (step < 0) {
                    if (this.state.orth == 0){
                        step = -this.state.voxelZ;
                    }else if (this.state.orth == 1){
                        step = -this.state.voxelY;
                    }else if (this.state.orth == 2){
                        step = -this.state.voxelX;
                    }
                }
                newdst += step;
                
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
            this.addWheelListener($('#displayArea')[0], function (e) {
                this.onWheelEvent(e);
            }.bind(this));

            if (this.props.data && this.props.data != null && this.props.data.instances && this.props.data.instances != null) {
                this.handleInstances(this.props.data.instances);
            }
        },

        componentWillReceiveProps: function (nextProps) {
            // console.log('Recieved Props:');
            // console.log(nextProps);
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
                var server = this.state.serverUrl;
                for (instance in instances) {
                    try {
                        vals = instances[instance].getVariable().getInitialValue().value;
                        data = JSON.parse(vals.data);
                        server = data.serverUrl;
                        files.push(data.fileLocation);
                        ids.push(instances[instance].parent.getId());
                        labels.push(instances[instance].parent.getName());
                        if (instances[instance].parent.isSelected() || (typeof instances[instance].parent[instances[instance].parent.getId()+'_obj'] != 'undefined' && instances[instance].parent[instances[instance].parent.getId()+'_obj'].isSelected()) || (typeof instances[instance].parent[instances[instance].parent.getId()+'_swc'] != 'undefined' && instances[instance].parent[instances[instance].parent.getId()+'_swc'].isSelected())){
                            colors.push('0Xffcc00'); // selected
                        }else {
                            colors.push(instances[instance].parent.getColor());
                        }
                    }
                    catch (ignore) {
                        console.log('Error handling ' + instance.data);
                    }
                }
                if (server != this.state.serverUrl && server != null) {
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
                if (colors != this.state.color && colors != null && colors.length > 0) {
                    this.setState({color: colors});
                    // console.log('updating colours to ' + JSON.stringify(colors));
                }
            }else{
                console.log('No instances sent');
            }
        },

        componentWillUnmount: function () {
        	// React.unmountComponentAtNode(document.getElementById('displayArea'));
            return true;
        },
        /**
         * Event handler for clicking zoom in. Increments the zoom level
         **/
        onZoomIn: function () {
            let zoomLevel = this.state.zoomLevel += .1;
            if (zoomLevel < 10.0) {
                this.setState({
                    zoomLevel: zoomLevel,
                    text: 'Zooming in to (X' + Number(zoomLevel).toFixed(1) + ')'
                });
            } else {
                this.setState({zoomLevel: 10.0, text: 'Max zoom! (X10)'});
            }
        },

        toggleMode: function () {
            let mode = this.state.mode += 1;
            if (mode > 2) {
                mode = 0;
            }
            this.setState({mode: mode});
        },

        toggleOrth: function () {
            let orth = this.state.orth +=1;
            var pit,yaw,rol;
            if (orth > 2) {
                orth = 0;
                this.state.orth = orth;
            }
            if (orth == 0) {
                pit = 0;
                yaw = 0;
                rol = 0;
            }else if (orth == 1) {
                pit = 90;
                yaw = 90;
                rol = 90;
            }else if (orth == 2) {
                pit = 90;
                yaw = 0;
                rol = 90;
            }
            this.setState({orth: orth, pit: pit, yaw: yaw, rol: rol, dst: 0, stackX: 0, stackY: 0});
        },

        /**
         * Event handler for clicking zoom out. Decrements the zoom level
         **/
        onZoomOut: function () {
            let zoomLevel = this.state.zoomLevel -= .1;

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
         * Event handler for clicking step in. Increments the dst level
         **/
        onStepIn: function () {
            var newdst = this.state.dst + this.state.voxelZ;
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
         * Event handler for clicking step out. Decrements the dst level
         **/
        onStepOut: function () {
            var newdst = this.state.dst - this.state.voxelZ;
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
            this.setState({dst: 0, stackX: 0, stackY: 0, text: 'View reset', zoomLevel: 1.0});
        },

        onExtentChange: function (data) {
            this.setState(data);
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
            var startOffset = 105;
            return (
                <div id="displayArea" style={{position: 'absolute', top: -1, left: -1}}>
                    <button style={{position: 'absolute', left: startOffset, top: -21, padding: 0, border: 0}} className={homeClass} onClick={this.onHome}></button>
                    <button style={{position: 'absolute', left: startOffset+20, top: -21, padding: 0, border: 0}} className={zoomInClass} onClick={this.onZoomIn}></button>
                    <button style={{position: 'absolute', left: startOffset+35, top: -21, padding: 0, border: 0}} className={zoomOutClass} onClick={this.onZoomOut}></button>
                    <button style={{position: 'absolute', left: startOffset+55, top: -21, padding: 0, border: 0}} className={stepInClass} onClick={this.onStepIn}></button>
                    <button style={{position: 'absolute', left: startOffset+70, top: -21, padding: 0, border: 0}} className={stepOutClass} onClick={this.onStepOut}></button>
                    <button style={{position: 'absolute', left: startOffset+90, top: -21, padding: 0, border: 0}} className={orthClass} onClick={this.toggleOrth}></button>
                    <button style={{position: 'absolute', left: startOffset+110, top: -21, padding: 0, border: 0}} className={pointerClass} onClick={this.toggleMode}></button>
                    <Canvas zoomLevel={this.state.zoomLevel} dst={this.state.dst} serverUrl={this.state.serverUrl}
                            fxp={this.state.fxp} pit={this.state.pit} yaw={this.state.yaw} rol={this.state.rol}
                            stack={this.state.stack} color={this.state.color} setExtent={this.onExtentChange}
                            statusText={this.state.text} stackX={this.state.stackX} stackY={this.state.stackY}
                            scl={this.state.scl} orth={this.state.orth}
                            label={this.state.label} id={this.state.id} height={this.props.data.height}
                            width={this.props.data.width} mode={this.state.mode} voxelX={this.state.voxelX} voxelY={this.state.voxelY} voxelZ={this.state.voxelZ} />
                </div>
            );
        }
    });

    return StackViewerComponent;
});