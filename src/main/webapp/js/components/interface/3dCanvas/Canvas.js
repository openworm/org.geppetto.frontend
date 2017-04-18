define(function(require) {

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
		factory: new SceneFactory(this),
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


        setupScene: function() {
            this.scene = new THREE.Scene();
            this.visualModelMap = {};
            this.meshes = {};
            this.splitMeshes = {};
            this.connectionLines = {};
        },

        /**
         * Sets up the camera that is used to view the objects in the 3D Scene.
         */
        setupCamera: function() {
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
        setupRenderer: function() {
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

        configureRenderer: function(shaders) {

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
        setupLights: function() {
            // Lights
            this.camera.add(new THREE.PointLight(0xffffff, 1.5));

        },

        /**
         * Sets up the controls used by the camera to make it able to zoom and
         * pan.
         */
        setupControls: function() {
            // Controls
            this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
            this.controls.noZoom = false;
            this.controls.noPan = false;
        },

        /**
         * Set up the listeners use to detect mouse movement and windoe resizing
         */
        setupListeners: function() {
            if (!this.listenersCreated) {
                // when the mouse moves, call the given function
                this.renderer.domElement.addEventListener('mousedown', function(event) {
                    if (event.button == 0) //only for left click
                    {
                        if (this.pickingEnabled) {
                            var intersects = GEPPETTO.getIntersectedObjects();

                            if (intersects.length > 0) {
                                var selected = "";
                                var geometryIdentifier = "";

                                // sort intersects
                                var compare = function(a, b) {
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
                                    if (this.meshes.hasOwnProperty(selected) || this.splitMeshes.hasOwnProperty(selected)) {
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

				var that=this;
                this.renderer.domElement.addEventListener('mousemove', function(event) {
					that.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
					that.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
				}, false);

                this.container.addEventListener('resize', function() {
					var container = $(that.container);
					var width = container.width();
					var height = container.height();

					that.camera.aspect = (width) / (height);
					that.camera.updateProjectionMatrix();
					that.renderer.setSize(width, height);
					that.composer.setSize(width, height);
				}, false);

                this.listenersCreated = true;
            }
        },


        shouldComponentUpdate() {
            return false;
        },

        componentDidMount: function() {
            this.container = $("#" + this.props.id + "_component").get(0);
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupLights();
            this.setupControls();
            this.setupListeners();
            this.initialised = true;
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