define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/interface/3dCanvas/Canvas.css";
    document.getElementsByTagName("head")[0].appendChild(link);

    var React = require('react');

    var THREE = require('three');
    var isWebglEnabled = require('detector-webgl');
    require('./TrackballControls');
    require('./OBJLoader');
    var THREEx = require('./THREEx.KeyboardState');
    THREE.ColladaLoader = require('imports?THREE=three!exports?THREE.ColladaLoader!../../../../node_modules\/three\/examples\/js\/loaders\/ColladaLoader');
    THREE.ConvolutionShader = require('imports?THREE=three!exports?THREE.ConvolutionShader!../../../../node_modules\/three\/examples\/js\/shaders\/ConvolutionShader');
    THREE.CopyShader = require('imports?THREE=three!exports?THREE.CopyShader!../../../../node_modules\/three\/examples\/js\/shaders\/CopyShader');
    THREE.FilmShader = require('imports?THREE=three!exports?THREE.FilmShader!../../../../node_modules\/three\/examples\/js\/shaders\/FilmShader');
    THREE.FocusShader = require('imports?THREE=three!exports?THREE.FocusShader!../../../../node_modules\/three\/examples\/js\/shaders\/FocusShader');
    THREE.EffectComposer = require('imports?THREE=three!exports?THREE.EffectComposer!../../../../node_modules\/three\/examples\/js\/postprocessing\/EffectComposer');
    THREE.MaskPass = require('imports?THREE=three!exports?THREE.MaskPass!../../../../node_modules\/three\/examples\/js\/postprocessing\/MaskPass');
    THREE.RenderPass = require('imports?THREE=three!exports?THREE.RenderPass!../../../../node_modules\/three\/examples\/js\/postprocessing\/RenderPass');
    THREE.BloomPass = require('imports?THREE=three!exports?THREE.BloomPass!../../../../node_modules\/three\/examples\/js\/postprocessing\/BloomPass');
    THREE.ShaderPass = require('imports?THREE=three!exports?THREE.ShaderPass!../../../../node_modules\/three\/examples\/js\/postprocessing\/ShaderPass');
    THREE.FilmPass = require('imports?THREE=three!exports?THREE.FilmPass!../../../../node_modules\/three\/examples\/js\/postprocessing\/FilmPass');
    var SceneFactory = require('./SceneFactory');

    var canvasComponent = React.createClass({
        factory: null,
        camera: null,
        container: null,
        controls: null,
        scene: null,
        meshes: {},
        splitMeshes: {},
        connectionLines: {},
        renderer: null,
        clock: new THREE.Clock(),
        stats: null,
        projector: null,
        keyboard: new THREEx.KeyboardState(),
        needsUpdate: false,
        metadata: {},
        customUpdate: null,
        mouseClickListener: null,
        rotationMode: false,
        mouse: {
            x: 0,
            y: 0
        },
        visualModelMap: null,
        idCounter: 0,
        sceneCenter: new THREE.Vector3(),
        cameraPosition: new THREE.Vector3(),
        canvasCreated: false,
        listenersCreated: false,
        selected: [],
        pickingEnabled: true, // flag to enable disable 3d picking
        backgroundColor: 0x101010,


        setupScene: function () {
            this.scene = new THREE.Scene();
            this.visualModelMap = {};
            this.meshes = {};
            this.splitMeshes = {};
            this.connectionLines = {};
        },

        /**
         * Sets up the camera that is used to view the objects in the 3D Scene.
         */
        setupCamera: function () {
            // Camera
            var SCREEN_WIDTH = $(this.container).width();
            var SCREEN_HEIGHT = $(this.container).height();
            var VIEW_ANGLE = 60;
            var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
            var NEAR = 10;
            var FAR = 2000000;
            this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
            this.scene.add(this.camera);
            this.camera.position.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z);
            this.camera.up = new THREE.Vector3(0, 1, 0);
            this.camera.direction = new THREE.Vector3(0, 0, 1);
            this.camera.lookAt(this.sceneCenter);
        },

        /**
         * Set up the WebGL Renderer
         */
        setupRenderer: function () {
            // Reuse a single WebGL renderer.
            // NOTE: Recreating the renderer causes camera displacement on Chrome OSX.
            if (!this.canvasCreated) {
                this.renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true
                });

            }

            this.configureRenderer();
            this.canvasCreated = true;
        },

        configureRenderer: function (shaders) {

            if (shaders == undefined) {
                shaders = false;
            }

            var color = new THREE.Color(this.backgroundColor);
            //this.renderer.setClearColor(color, 1);
            var width = $(this.container).width();
            var height = $(this.container).height();
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(width, height);
            this.renderer.autoClear = false;
            this.container.appendChild(this.renderer.domElement);

            var renderModel = new THREE.RenderPass(this.scene, this.camera);

            this.composer = new THREE.EffectComposer(this.renderer);

            if (shaders) {
                var effectBloom = new THREE.BloomPass(0.75);
                var effectFilm = new THREE.FilmPass(0.5, 0.5, 1448, false);
                var effectFocus = new THREE.ShaderPass(THREE.FocusShader);

                effectFocus.uniforms["screenWidth"].value = window.innerWidth;
                effectFocus.uniforms["screenHeight"].value = window.innerHeight;

                effectFocus.renderToScreen = true;

                this.composer.addPass(renderModel);
                this.composer.addPass(effectBloom);
                this.composer.addPass(effectFilm);
                this.composer.addPass(effectFocus);
            } else {
                //standard
                var copyPass = new THREE.ShaderPass(THREE.CopyShader);
                copyPass.renderToScreen = true;
                this.composer.addPass(renderModel);
                this.composer.addPass(copyPass);
            }

        },

        /**
         * Light up the scene
         */
        setupLights: function () {
            // Lights
            this.camera.add(new THREE.PointLight(0xffffff, 1.5));

        },

        /**
         * Sets up the controls used by the camera to make it able to zoom and
         * pan.
         */
        setupControls: function () {
            // Controls
            this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
            this.controls.noZoom = false;
            this.controls.noPan = false;
        },

        /**
         * Set up the listeners use to detect mouse movement and windoe resizing
         */
        setupListeners: function () {
            if (!this.listenersCreated) {
                var that = this;
                // when the mouse moves, call the given function
                this.renderer.domElement.addEventListener('mousedown', function (event) {
                    if (event.button == 0) //only for left click
                    {
                        if (that.pickingEnabled) {
                            var intersects = that.getIntersectedObjects();

                            if (intersects.length > 0) {
                                var selected = "";
                                var geometryIdentifier = "";

                                // sort intersects
                                var compare = function (a, b) {
                                    if (a.distance < b.distance)
                                        return -1;
                                    if (a.distance > b.distance)
                                        return 1;
                                    return 0;
                                };

                                intersects.sort(compare);

                                var selectedIntersect;
                                // Iterate and get the first visible item (they are now ordered by proximity)
                                for (var i = 0; i < intersects.length; i++) {
                                    // figure out if the entity is visible
                                    var instancePath = "";
                                    if (intersects[i].object.hasOwnProperty("instancePath")) {
                                        instancePath = intersects[i].object.instancePath;
                                        geometryIdentifier = intersects[i].object.geometryIdentifier;
                                    } else {
                                        //weak assumption: if the object doesn't have an instancePath its parent will
                                        instancePath = intersects[i].object.parent.instancePath;
                                        geometryIdentifier = intersects[i].object.parent.geometryIdentifier;
                                    }
                                    if (instancePath != null || undefined) {
                                        var visible = eval(instancePath + '.visible');
                                        if (intersects.length == 1 || i == intersects.length) {
                                            //if there's only one element intersected we select it regardless of its opacity
                                            if (visible) {
                                                selected = instancePath;
                                                selectedIntersect = intersects[i];
                                                break;
                                            }
                                        } else {
                                            //if there are more than one element intersected and opacity of the current one is less than 1
                                            //we skip it to realize a "pick through"
                                            var opacity = this.meshes[instancePath].defaultOpacity;
                                            if ((opacity == 1 && visible) || GEPPETTO.isKeyPressed("ctrl")) {
                                                selected = instancePath;
                                                selectedIntersect = intersects[i];
                                                break;
                                            } else if (visible && opacity < 1 && opacity > 0) {
                                                //if only transparent objects intersected select first or the next down if
                                                //one is already selected in order to enable "burrow through" sample.
                                                if (selected == "" && !eval(instancePath + '.selected')) {
                                                    selected = instancePath;
                                                    selectedIntersect = intersects[i];
                                                } else {
                                                    if (eval(instancePath + '.selected') && i != intersects.length - 1) {
                                                        selected = "";
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }


                                if (selected != "") {
                                    if (that.meshes.hasOwnProperty(selected) || that.splitMeshes.hasOwnProperty(selected)) {
                                        if (!GEPPETTO.isKeyPressed("shift")) {
                                            GEPPETTO.G.unSelectAll();
                                        }

                                        var selectedIntersectCoordinates = [selectedIntersect.point.x, selectedIntersect.point.y, selectedIntersect.point.z]
                                        if (geometryIdentifier == undefined) {
                                            geometryIdentifier = "";
                                        }
                                        GEPPETTO.Console.executeCommand(selected + '.select(' + false + ', ' + '"' + geometryIdentifier + '", [' + selectedIntersectCoordinates + '])');
                                    }
                                }
                            } else if (GEPPETTO.isKeyPressed("ctrl")) {
                                GEPPETTO.G.unSelectAll();
                            }
                        }
                    }
                }, false);



                $("#" + this.props.id).on("dialogresizestop", function (event, ui) {
                    var height=ui.size.height-40;
                    var width=ui.size.width-30;
                    $(that.container).height(height);
                    $(that.container).width(width);
                    that.camera.aspect = width / height;
                    that.camera.updateProjectionMatrix();
                    that.renderer.setSize(width, height);
                    that.composer.setSize(width, height);

                });

                this.renderer.domElement.addEventListener('mousemove', function (event) {
                    that.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                    that.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                }, false);


                this.listenersCreated = true;
            }
        },


        /**
         * Reset camera for scene.
         */
        resetCamera: function () {
            this.controls.reset();

            var aabbMin = null;
            var aabbMax = null;

            this.scene.traverse(function (child) {
                if (child.hasOwnProperty("geometry")) {
                    child.geometry.computeBoundingBox();

                    var bb = child.geometry.boundingBox;
                    bb.translate(child.localToWorld(new THREE.Vector3()));

                    // If min and max vectors are null, first values become
                    // default min and max
                    if (aabbMin == null && aabbMax == null) {
                        aabbMin = bb.min;
                        aabbMax = bb.max;
                    }

                    // Compare other meshes, particles BB's to find min and max
                    else {
                        aabbMin.x = Math.min(aabbMin.x, bb.min.x);
                        aabbMin.y = Math.min(aabbMin.y, bb.min.y);
                        aabbMin.z = Math.min(aabbMin.z, bb.min.z);
                        aabbMax.x = Math.max(aabbMax.x, bb.max.x);
                        aabbMax.y = Math.max(aabbMax.y, bb.max.y);
                        aabbMax.z = Math.max(aabbMax.z, bb.max.z);
                    }
                }
            });

            if (aabbMin != null && aabbMax != null) {
                // Compute world AABB center
                this.sceneCenter.x = (aabbMax.x + aabbMin.x) * 0.5;
                this.sceneCenter.y = (aabbMax.y + aabbMin.y) * 0.5;
                this.sceneCenter.z = (aabbMax.z + aabbMin.z) * 0.5;

                this.updateCamera(aabbMax, aabbMin);
            }
        },

        /**
         * Update camera with new position and place to lookat
         */
        updateCamera: function (aabbMax, aabbMin) {
            // Compute world AABB "radius"
            var diag = new THREE.Vector3();
            diag = diag.subVectors(aabbMax, aabbMin);
            var radius = diag.length() * 0.5;

            this.pointCameraTo(this.sceneCenter);

            // Compute offset needed to move the camera back that much needed to center AABB
            var offset = radius / Math.sin(Math.PI / 180.0 * this.camera.fov * 0.5);

            var dir = this.camera.direction.clone();
            dir.multiplyScalar(offset);

            // Store camera position
            this.camera.position.addVectors(dir, this.controls.target);
            this.camera.updateProjectionMatrix();
        },

        boundingBox: function (obj) {
            if (obj instanceof THREE.Mesh) {

                var geometry = obj.geometry;
                geometry.computeBoundingBox();
                return geometry.boundingBox;

            }

            if (obj instanceof THREE.Object3D) {

                var bb = new THREE.Box3();
                for (var i = 0; i < obj.children.length; i++) {
                    bb.union(this.boundingBox(obj.children[i]));
                }
                return bb;
            }
        },

        shapeCenterOfGravity: function (obj) {
            return this.boundingBox(obj).center();
        },

        /** */
        pointCameraTo: function (node) {
            // Refocus camera to the center of the new object
            var COG;
            if (node instanceof THREE.Vector3) {
                COG = node;
            } else {
                COG = this.shapeCenterOfGravity(node);
            }
            var v = new THREE.Vector3();
            v.subVectors(COG, this.controls.target);
            this.camera.position.addVectors(
                this.camera.position, v);

            // retrieve camera orientation

            this.camera.lookAt(COG);
            this.controls.target.set(COG.x, COG.y, COG.z);
        },

        /**
         * Status of scene, populated or not
         *
         * @returns {Boolean} True or false depending whether scene is populated
         *          or not
         */
        isScenePopulated: function () {
            return !(_.isEmpty(this.visualModelMap));
        },

        /**
         * Has canvas been created?
         *
         * @returns {Boolean] True or false if canvas has been created or not
		 */
        isCanvasCreated: function () {
            return this.canvasCreated;
        },

        /**
         * Sets up the HUD display with the scene stat's fps.
         */
        setupStats: function () {
            // Stats
            if ($("#stats").length == 0) {
                if (VARS != null) {
                    this.stats = new Stats();
                    this.stats.domElement.style.float = 'right';
                    this.stats.domElement.style.position = 'absolute';
                    this.stats.domElement.style.top = '60px';
                    this.stats.domElement.style.right = '5px';
                    this.stats.domElement.style.zIndex = 100;
                    $('#controls').append(this.stats.domElement);
                }
            }
        },

        /**
         * Displays HUD for FPS stats
         */
        toggleStats: function (mode) {
            if (mode) {
                if ($("#stats").length == 0) {
                    this.setupStats();
                } else {
                    $("#stats").show();
                }
            } else {
                $("#stats").hide();
            }
        },


        /**
         * Adds debug axis to the scene
         */
        setupAxis: function () {
            // To use enter the axis length
            this.scene.add(new THREE.AxisHelper(200));
        },

        /**
         * Renders objects in the scene
         */
        renderCanvas: function () {
            this.renderer.clear();
            this.composer.render(0.01);
        },

        /**
         * Returns intersected objects from mouse click
         *
         * @returns {Array} a list of objects intersected by the current mouse coordinates
         */
        getIntersectedObjects: function () {
            // create a Ray with origin at the mouse position and direction into th scene (camera direction)
            var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 1);
            vector.unproject(this.camera);

            var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

            var visibleChildren = [];
            this.scene.traverse(function (child) {
                if (child.visible && !(child.clickThrough == true)) {
                    if (child.geometry != null && child.geometry != undefined) {
                        child.geometry.computeBoundingBox();
                        visibleChildren.push(child);
                    }
                }
            });

            // returns an array containing all objects in the scene with which the ray intersects
            return raycaster.intersectObjects(visibleChildren);
        },


        /**
         * @param x
         * @param y
         */
        incrementCameraPan: function (x, y) {
            this.controls.incrementPanEnd(x, y);
        },

        /**
         * @param x
         * @param y
         * @param z
         */
        incrementCameraRotate: function (x, y, z) {
            this.controls.incrementRotationEnd(x, y, z);
        },

        /**
         * @param z
         */
        incrementCameraZoom: function (z) {
            this.controls.incrementZoomEnd(z);
        },

        /**
         * @param x
         * @param y
         * @param z
         */
        setCameraPosition: function (x, y, z) {
            this.controls.setPosition(x, y, z);
        },

        /**
         * @param rx
         * @param ry
         * @param rz
         * @param radius
         */
        setCameraRotation: function (rx, ry, rz, radius) {
            this.controls.setRotation(rx, ry, rz, radius);
        },


        animate: function () {
            this.debugUpdate = this.needsUpdate;
            // so that we log only the cycles when we are updating the scene

            this.controls.update();

            this.isAnimated = true;
            requestAnimationFrame(this.animate);
            this.renderCanvas();

            if (this.stats) {
                this.stats.update();
            }

            if (this.debugUpdate) {
                GEPPETTO.log(GEPPETTO.Resources.UPDATE_FRAME_END);
            }
        },


        shouldComponentUpdate() {
            return false;
        },

        componentDidMount: function () {
            if (!isWebglEnabled) {
                Detector.addGetWebGLMessage();
            } else {
                this.factory = new SceneFactory(this);
                var containerSelector = $("#" + this.props.id + "_component");
                containerSelector.height(containerSelector.parent().height()-40);
                containerSelector.width(containerSelector.parent().width()-30);
                this.container = containerSelector.get(0);
                this.setupScene();
                this.setupCamera();
                this.setupRenderer();
                this.setupLights();
                this.setupControls();
                this.setupListeners();
                this.animate();
            }
        },

        render: function () {
            return (
                <div key={this.props.id + "_component"} id={this.props.id + "_component"} className="canvas">
                </div>
            )
        }
    });
    return canvasComponent;
});