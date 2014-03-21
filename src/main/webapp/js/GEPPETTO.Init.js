define(function(require) {
	return function(GEPPETTO) {
		var $ = require('jquery');

		require('three');
		require('vendor/THREEx.KeyboardState');

		var VARS = {
			debug: false,
			camera: null,
			container: null,
			controls: null,
			scene: null,
			renderer: null,
			stats: null,
			gui: null,
			projector: null,
			keyboard: new THREEx.KeyboardState(),
			jsonscene: null,
			needsUpdate: false,
			metadata: {},
			customUpdate: null,
			mouseClickListener: null,
			rotationMode: false,
			mouse: {
				x: 0,
				y: 0
			},
			geometriesMap: null,
			idCounter: 0,

			sceneCenter: new THREE.Vector3(),
			cameraPosition: new THREE.Vector3(),
			canvasCreated: false
		};

		var setupScene = function() {
			VARS.scene = new THREE.Scene();
			VARS.geometriesMap = {};
		};

		/**
		 * Sets up the camera that is used to view the objects in the 3D Scene.
		 */
		var setupCamera = function() {
			// Camera
			var SCREEN_WIDTH = $(VARS.container).width(), SCREEN_HEIGHT = $(VARS.container).height();
			var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
			VARS.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
			VARS.scene.add(VARS.camera);
			VARS.camera.position.set(VARS.cameraPosition.x, VARS.cameraPosition.y, VARS.cameraPosition.z);
			VARS.camera.lookAt(VARS.sceneCenter);
			VARS.projector = new THREE.Projector();
		};

		/**
		 * Set up the WebGL Renderer
		 */
		var setupRenderer = function() {
			VARS.renderer = new THREE.WebGLRenderer(
				{
					antialias: true
				});
			VARS.renderer.setClearColor(0x000000, 1);
			var width = $(VARS.container).width();
			var height = $(VARS.container).height();
			VARS.renderer.setSize(width, height);
			VARS.renderer.autoClear = true;
			VARS.container.appendChild(VARS.renderer.domElement);

			VARS.canvasCreated = true;
		};

		/**
		 * Light up the scene
		 */
		var setupLights = function() {
			// Lights

			VARS.scene.add(new THREE.AmbientLight(0x000000));

			VARS.scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 1.1));

			var directionalLight = new THREE.DirectionalLight(0xffffff, 0.09);
			directionalLight.position.set(0, 1, 0);
			directionalLight.castShadow = true;
			VARS.scene.add(directionalLight);

			var spotLight1 = new THREE.SpotLight(0xffffff, 0.1);
			spotLight1.position.set(100, 1000, 100);
			spotLight1.castShadow = true;
			spotLight1.shadowDarkness = 0.2;
			VARS.scene.add(spotLight1);

			var spotLight2 = new THREE.SpotLight(0xffffff, 0.22);
			spotLight2.position.set(100, 1000, 100);
			spotLight2.castShadow = true;
			spotLight2.shadowDarkness = 0.2;
			VARS.scene.add(spotLight2);

		};

		/**
		 * Sets up the controls used by the camera to make it able to zoom and pan.
		 */
		var setupControls = function() {
			// Controls
			VARS.controls = new THREE.TrackballControls(VARS.camera, VARS.renderer.domElement);
			VARS.controls.noZoom = false;
			VARS.controls.noPan = false;
			VARS.controls.addEventListener('change', GEPPETTO.render);
		};

		/**
		 * Set up the listeners use to detect mouse movement and windoe resizing
		 */
		var setupListeners = function() {
			// when the mouse moves, call the given function
			VARS.renderer.domElement.addEventListener('mousedown', function(event) {
				if(VARS.mouseClickListener) {
					VARS.mouseClickListener(GEPPETTO.getIntersectedObjects(), event.which);
				}
			}, false);

			VARS.renderer.domElement.addEventListener('mousemove', function(event) {
				VARS.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				VARS.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

			}, false);

			window.addEventListener('resize', function() {
				VARS.camera.aspect = ($(VARS.container).width()) / ($(VARS.container).height());
				;
				VARS.camera.updateProjectionMatrix();
				VARS.renderer.setSize($(VARS.container).width(), $(VARS.container).height());
			}, false);
		};
//	============================================================================
//	Application logic.
//	============================================================================
		var setupApplicationLogic = function() {
			$(document).ready(function() {
				// Toolbar controls

				$("#w").click(function(event) {
					VARS.controls.incrementPanEnd(-0.01, 0);
				}).mouseup(function(event) {
						VARS.controls.resetSTATE();
					}).next().click(function(event) {
						VARS.controls.incrementPanEnd(0, -0.01);
					}).mouseup(function(event) {
						VARS.controls.resetSTATE();
					}).next().click(function(event) {
						VARS.controls.incrementPanEnd(0.01, 0);
					}).mouseup(function(event) {
						VARS.controls.resetSTATE();
					}).next().click(function(event) {
						VARS.controls.incrementPanEnd(0, 0.01);
					}).mouseup(function(event) {
						VARS.controls.resetSTATE();
					}).next().click(function(event) {
						GEPPETTO.calculateSceneCenter();
						GEPPETTO.updateCamera();
					});

				$("#rw").click(function(event) {
					VARS.controls.incrementRotationEnd(-0.01, 0, 0);
				}).mouseup(function(event) {
						VARS.controls.resetSTATE();
					}).next().click(function(event) {
						VARS.controls.incrementRotationEnd(0, 0, 0.01);
					}).mouseup(function(event) {
						VARS.controls.resetSTATE();
					}).next().click(function(event) {
						VARS.controls.incrementRotationEnd(0.01, 0, 0);
					}).mouseup(function(event) {
						VARS.controls.resetSTATE();
					}).next().click(function(event) {
						VARS.controls.incrementRotationEnd(0, 0, -0.01);
					}).mouseup(function(event) {
						VARS.controls.resetSTATE();
					}).next().click(function(event) {
						GEPPETTO.calculateSceneCenter();
						GEPPETTO.updateCamera();
					});

				$("#zo").click(function(event) {
					VARS.controls.incrementZoomEnd(+0.01);

				}).mouseup(function(event) {
						VARS.controls.resetSTATE();
					});

				$("#zi").click(function(event) {
					VARS.controls.incrementZoomEnd(-0.01);
				}).mouseup(function(event) {
						VARS.controls.resetSTATE();
					});

				document.addEventListener("keydown", GEPPETTO.Vanilla.checkKeyboard, false);
			});
		};

		GEPPETTO.Init = {
			initialize: function(containerp) {
				VARS.container = containerp;
				setupScene();
				setupCamera();
				setupRenderer();
				setupLights();
				setupControls();
				setupListeners();
				setupApplicationLogic();
				return VARS;
			}
		};
	};
});