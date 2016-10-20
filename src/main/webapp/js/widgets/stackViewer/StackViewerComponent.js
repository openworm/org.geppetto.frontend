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
                minDst: -100,
                maxDst: 100,
                tileX: 1025,
                tileY: 1025,
                imageX: 1024,
                imageY: 1024,
                visibleTiles: [0],
                lastUpdate: 0,
                updating: false,
                numTiles: 1,
                posX: 0,
                posY: 0,
                loadingLabels: false
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

        },

        componentDidUpdate: function () {
            console.log('Canvas update');
            this.renderer.resize(this.props.width, this.props.height);
            this.checkStack();
        },

        componentWillUnmount: function () {
            this.stage.destroy(true);
            this.stage = null;
            this.refs.stackCanvas.removeChild(this.renderer.view);
            this.renderer.destroy(true);
            this.renderer = null;
        },

        callDstRange: function () {
            var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[0] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=0&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0);
            this.state.buffer[-1].text = 'Buffering stack...';
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
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }.bind(this)
            });
        },

        callTileSize: function () {
            var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[0] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=0&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0);
            //get tile size;
            $.ajax({
                url: image + '&obj=Tile-size',
                type: 'POST',
                success: function (data) {
                    console.log(data.trim());
                    var result = data.trim().split(':')[1].split(' ');
                    var tileX = Number(result[0]);
                    var tileY = Number(result[1]);
                    this.setState({tileX: tileX, tileY: tileY});

                    // update slice view
                    this.state.lastUpdate = 0;
                    this.checkStack();

                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }.bind(this)
            });
        },

        callImageSize: function () {
            var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[0] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=0&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0);
            //get image size;
            $.ajax({
                url: image + '&obj=Max-size',
                type: 'POST',
                success: function (data) {
                    console.log(data.trim());
                    var result = data.trim().split(':')[1].split(' ');
                    var imageX = Number(result[0]);
                    var imageY = Number(result[1]);
                    this.setState({imageX: imageX, imageY: imageY});

                    // update slice view
                    this.state.lastUpdate = 0;
                    this.checkStack();

                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }.bind(this)
            });
        },

        callObjects: function () {

            var i, j, result;
            var that = this;
            for (i in this.state.stack) {
                var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(this.props.dst).toFixed(1) + '&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0);
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
                                    console.log(that.props.label[i] + ' clicked');
                                    that.setStatusText(that.props.label[i] + ' clicked!');
                                    that.setState({text: that.props.label[i] + ' clicked!'});
                                } else {
                                    console.log('Odd value: ' + result[j].toString());
                                }
                            }
                        }

                        // update slice view
                        that.state.lastUpdate = 0;
                        that.checkStack();

                    }.bind({i: i}),
                    error: function (xhr, status, err) {
                        console.error(this.props.url, status, err.toString());
                    }.bind(this)
                });
            }
        },

        listObjects: function () {

            var i, j, result;
            var that = this;
            for (i in this.state.stack) {
                var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(this.props.dst).toFixed(1) + '&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0);
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
                    image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(this.props.dst).toFixed(1) + '&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0) + '&qlt=80&jtl=' + j.toString();
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
                        image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=0.0&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0) + '&qlt=80&jtl=' + this.state.visibleTiles[j].toString();
                        if (!PIXI.loader.resources[image]) {
                            // console.log('buffering ' + this.state.stack[i].toString() + '...');
                            imageLoader.add(image, image, loaderOptions);
                            buffMax -= 1;
                        }
                        if (buffMax < 1) {
                            break;
                        }
                    }
                    for (dst = 0.1; -dst > min || dst < max; dst += 0.1) {
                        for (i in this.state.stack) {
                            image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(dst).toFixed(1) + '&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0) + '&qlt=80&jtl=' + this.state.visibleTiles[j].toString();
                            if (dst < max && !PIXI.loader.resources[image]) {
                                imageLoader.add(image, image, loaderOptions);
                                buffMax -= 1;
                            }
                            image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(-dst).toFixed(1) + '&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0) + '&qlt=80&jtl=' + this.state.visibleTiles[j].toString();
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
                        image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(this.props.dst - 0.1).toFixed(1) + '&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0) + '&qlt=80&jtl=' + j.toString();
                        if (!PIXI.loader.resources[image]) {
                            // console.log('buffering ' + this.state.stack[i].toString() + '...');
                            imageLoader.add(image, image, loaderOptions);
                            buffMax -= 1;
                        }
                        if (buffMax < 1) {
                            break;
                        }
                        image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(this.props.dst + 0.1).toFixed(1) + '&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0) + '&qlt=80&jtl=' + j.toString();
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
                this.state.buffer[-1].text = 'Buffering stack ' + loader.progress.toFixed(1) + "%";
            }

            function setup() {
                console.log('Buffered ' + (1000 - buffMax).toString() + ' tiles');
                this.state.buffer[-1].text = '';
            }
        },

        checkStack: function () {
            if (this.state.lastUpdate < (Date.now() - 2000)) {
                this.state.lastUpdate = Date.now();
                this.state.buffer[-1].text = '';
                console.log('Updating scene...');
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
                            image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + this.props.scl.toFixed(1) + '&dst=' + Number(this.props.dst).toFixed(1) + '&pit=' + Number(this.props.pit).toFixed(0) + '&yaw=' + Number(this.props.yaw).toFixed(0) + '&rol=' + Number(this.props.rol).toFixed(0) + '&qlt=80&jtl=' + t.toString();
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
                    font: 'bold 24px Helvetica',
                    fill: '#F7EDCA',
                    stroke: '#4a1850',
                    strokeThickness: 5,
                    dropShadow: true,
                    dropShadowColor: '#000000',
                    dropShadowAngle: Math.PI / 6,
                    dropShadowDistance: 6,
                    wordWrap: true,
                    wordWrapWidth: this.renderer.view.width
                };
                this.state.buffer[-1] = new PIXI.Text(this.state.text, style);
                this.state.buffer[-1].x = -this.stage.position.x;
                this.state.buffer[-1].y = -this.stage.position.y;
                this.state.buffer[-1].anchor.x = 0;
                this.state.buffer[-1].anchor.y = 100;
                this.state.buffer[-1].zOrder = 1000;
                this.stage.addChild(this.state.buffer[-1]);
            } else {
                this.state.buffer[-1].text = this.state.text;
            }
        },

        /**
         * When we get new props, run the appropriate imperative functions
         **/
        componentWillReceiveProps: function (nextProps) {
            console.log('update props ' + JSON.stringify(nextProps));
            if (nextProps.stack !== this.state.stack || nextProps.color !== this.state.color || this.state.serverUrl !== nextProps.serverUrl) {
                this.state.stack = nextProps.stack;
                this.state.color = nextProps.color;
                this.state.serverUrl = nextProps.serverUrl;
                this.updateImages(nextProps);
            }
            if (nextProps.zoomLevel !== this.props.zoomLevel) {
                this.updateZoomLevel(nextProps);
            }
            if (nextProps.dst !== this.props.dst || nextProps.fxp !== this.props.fxp || nextProps.pit !== this.props.pit || nextProps.yaw !== this.props.yaw || nextProps.rol !== this.props.rol || nextProps.serverUrl !== this.props.serverUrl) {
                this.updateImages(nextProps);
            }
            if (nextProps.stack !== this.state.stack || nextProps.color !== this.state.color) {
                this.setState({stack: this.props.stack, color: this.props.color});
                this.createImages();
                this.updateImages(nextProps);
            }
            if (nextProps.statusText !== this.state.buffer[-1].text) {
                this.updateStatusText(nextProps);
            }
            if (nextProps.stackX !== this.stack.position.x || nextProps.stackY !== this.stack.position.y) {
                this.stack.position.x = nextProps.stackX;
                this.stack.position.y = nextProps.stackX;
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
                            this.state.buffer[-1].text = 'Loading slice ' + Number(props.dst).toFixed(1) + '...';
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
                var xOffset = ((this.state.imageX * 0.5) * (1 / this.disp.scale.x));
                var yOffset = ((this.state.imageY * 0.5) * (1 / this.disp.scale.y));
                this.state.posX = currentPosition.x + xOffset;
                this.state.posY = currentPosition.y + yOffset;
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
                minDst: -100,
                maxDst: 100,
                color: [0xFFFFFF],
                stack: ['/disk/data/VFB/IMAGE_DATA/VFB/i/0001/7894/volume.wlz'],
                label: ['Adult Brain']
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
                var step = -1 * e.wheelDelta * 0.1;
                // Max step of 0.6 imposed
                // TODO: derive max and min step from voxel size
                if (step > 3) {
                    step = 0.6;
                } else if (step < -3) {
                    step = -0.6;
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
            console.log('Recieved Props:');
            console.log(nextProps);
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
            console.log('Handling Instances: ' + instances.length);
            if (instances && instances != null && instances.length > 0) {
                var instance;
                var data, vals;
                var files = [];
                var colors = [];
                var labels = [];
                var server = this.state.serverUrl;
                for (instance in instances) {
                    try {
                        console.log('Instance:' + instance);
                        vals = instances[instance].getVariable().getInitialValue().value;
                        console.log(JSON.stringify(vals));
                        data = JSON.parse(vals.data);
                        server = data.serverUrl;
                        files.push(data.fileLocation);
                        labels.push(instances[instance].parent.getName());
                        colors.push(instances[instance].parent.getColor());
                        console.log(instances[instance].parent.getName());
                    }
                    catch (ignore) {
                        console.log('Error handling ' + instance.data);
                    }
                }
                if (server != this.state.serverUrl && server != null) {
                    this.setState({serverURL: server});
                    console.log('Changing IIP server to ' + server);
                }
                if (files != this.state.stack && files != null && files.length > 0) {
                    this.setState({stack: files});
                    console.log('setting stack to ' + JSON.stringify(files));
                }
                if (labels != this.state.label && labels != null && labels.length > 0) {
                    this.setState({label: labels});
                    console.log('updating labels to ' + JSON.stringify(labels));
                }
                if (colors != this.state.color && colors != null && colors.length > 0) {
                    this.setState({color: colors});
                    console.log('updating colours to ' + JSON.stringify(colors));
                }
            }else{
                console.log('No instances sent');
            }
        },

        componentWillUnmount: function () {
            React.unmountComponentAtNode(document.getElementById('displayArea'));
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
            var newdst = this.state.dst + 0.1;
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
            var newdst = this.state.dst - 0.1;
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
            return (
                <div id="displayArea">
                    <button style={{position: 'absolute', right: 25, top: 10, padding: 2}} onClick={this.onZoomIn}>
                        +
                    </button>
                    <button style={{position: 'absolute', right: 10, top: 10, padding: 2}} onClick={this.onZoomOut}>
                        -
                    </button>
                    <button style={{position: 'absolute', right: 25, top: 30, padding: 2}}
                            onClick={this.onStepIn}>&lt;</button>
                    <button style={{position: 'absolute', right: 10, top: 30, padding: 2}}
                            onClick={this.onStepOut}>&gt;</button>
                    <button style={{position: 'absolute', right: 5, top: 50, padding: 2}} onClick={this.onHome}>
                        HOME
                    </button>
                    <Canvas zoomLevel={this.state.zoomLevel} dst={this.state.dst} serverUrl={this.state.serverUrl}
                            fxp={this.state.fxp} pit={this.state.pit} yaw={this.state.yaw} rol={this.state.rol}
                            stack={this.state.stack} color={this.state.color} setExtent={this.onExtentChange}
                            statusText={this.state.text} stackX={this.state.stackX} stackY={this.state.stackY}
                            scl={this.state.scl}
                            label={this.state.label} height={this.props.data.height}
                            width={this.props.data.width}/>
                </div>
            );
        }
    });

    return StackViewerComponent;
});