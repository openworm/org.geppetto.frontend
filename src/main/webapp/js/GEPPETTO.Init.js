/**
 * @class GEPPETTO.Init
 */
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
			meshes : {},
			splitMeshes : {},
			connectionLines : {},
			renderer: null,
			customRendererClass : null,
			clock: new THREE.Clock(),
			stats: null,
			gui: null,
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
			listenersCreated : false,
			selected : [],
		};

		var setupScene = function() {
			VARS.scene = new THREE.Scene();
			VARS.visualModelMap = {};
			VARS.meshes = {};
			VARS.splitMeshes = {};
			VARS.connectionLines = {};
		};

		/**
		 * Sets up the camera that is used to view the objects in the 3D Scene.
		 */
		var setupCamera = function() {
			// Camera
			var SCREEN_WIDTH = $(VARS.container).width(), SCREEN_HEIGHT = $(
					VARS.container).height();
			var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 500000;
			VARS.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR,
					FAR);
			VARS.scene.add(VARS.camera);
			VARS.camera.position.set(VARS.cameraPosition.x,
					VARS.cameraPosition.y, VARS.cameraPosition.z);
			VARS.camera.lookAt(VARS.sceneCenter);
			VARS.projector = new THREE.Projector();
		};

		/**
		 * Set up the WebGL Renderer
		 */
		var setupRenderer = function() {
			// Reuse a single WebGL renderer. Recreating the renderer causes
			// camera displacement on Chrome OSX.
			if (!VARS.canvasCreated) {
				if (VARS.customRendererClass == null) {
					VARS.renderer = new THREE.WebGLRenderer({
						antialias: true
					});
			}
				else {
					console.log("CUSTOM RENDERER");
					var customRenderer = VARS.customRendererClass;
					VARS.renderer = new customRenderer();
				}
				VARS.renderer.setClearColor(0x000000, 1);
				var width = $(VARS.container).width();
				var height = $(VARS.container).height();
				VARS.renderer.setSize(width, height);
				VARS.renderer.autoClear = true;
				VARS.container.appendChild(VARS.renderer.domElement);

				VARS.canvasCreated = true;
			}
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
			
			VARS.scene.add(new THREE.AmbientLight(0x111111));

			
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
		 * Sets up the controls used by the camera to make it able to zoom and
		 * pan.
		 */
		var setupControls = function() {
			// Controls
			VARS.controls = new THREE.TrackballControls(VARS.camera,
					VARS.renderer.domElement);
			VARS.controls.noZoom = false;
			VARS.controls.noPan = false;
			VARS.controls.addEventListener('change', GEPPETTO.render);			
		};

		/**
		 * Set up the listeners use to detect mouse movement and windoe resizing
		 */
		var setupListeners = function() {
			if(!VARS.listenersCreated){
				// when the mouse moves, call the given function
				VARS.renderer.domElement
						.addEventListener(
								'mousedown',
								function(event) {
									var intersects = GEPPETTO
											.getIntersectedObjects();

					if ( intersects.length > 0 ) {
						var selected = intersects[ 0 ].object.name;

						if(selected == ""){
							selected = intersects[ 0 ].object.parent.name;
						}
										if (VARS.meshes
												.hasOwnProperty(selected)
												|| VARS.splitMeshes
														.hasOwnProperty(selected)) {
							GEPPETTO.Simulation.unSelectAll();
											GEPPETTO.Console
													.executeCommand(selected
															+ '.select()');
						}
					}

				}, false);

				VARS.renderer.domElement
						.addEventListener(
								'mousemove',
								function(event) {
					VARS.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
					VARS.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

				}, false);

				window.addEventListener('resize', function() {
					var container = $(VARS.container), width = container
							.width(), height = container.height();

					VARS.camera.aspect = (width) / (height);
					VARS.camera.updateProjectionMatrix();
					VARS.renderer.setSize(width, height);
				}, false);

				document.addEventListener("keydown",
						GEPPETTO.Vanilla.checkKeyboard, false);
				VARS.listenersCreated = true;
			}
		};
//	============================================================================
//	Application logic.
//	============================================================================
		GEPPETTO.Init = {
			initialize: function(containerp) {
				VARS.container = containerp;
				setupScene();
				setupCamera();
				setupRenderer();
				setupLights();
				setupControls();
				setupListeners();
	        	//setup listeners for geppetto events that can be triggered
				if(!GEPPETTO.Events.listening){
					GEPPETTO.Events.listen();
					GEPPETTO.Events.listening = true;
				}
				return VARS;
			}
		};
	};
});
