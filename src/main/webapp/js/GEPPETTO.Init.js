/**
 * @class GEPPETTO.Init
 */
define(function(require) {
	return function(GEPPETTO) {
		var $ = require('jquery');

		var setupScene = function() {
			GEPPETTO.getVARS().scene = new THREE.Scene();
			GEPPETTO.getVARS().visualModelMap = {};
			GEPPETTO.getVARS().meshes = {};
			GEPPETTO.getVARS().splitMeshes = {};
			GEPPETTO.getVARS().connectionLines = {};
		};

		/**
		 * Sets up the camera that is used to view the objects in the 3D Scene.
		 */
		var setupCamera = function() {
			// Camera
			var SCREEN_WIDTH = $(GEPPETTO.getVARS().container).width(), SCREEN_HEIGHT = $(
					GEPPETTO.getVARS().container).height();
			var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 500000;
			GEPPETTO.getVARS().camera = new THREE.PerspectiveCamera(VIEW_ANGLE,
					ASPECT, NEAR, FAR);
			GEPPETTO.getVARS().scene.add(GEPPETTO.getVARS().camera);
			GEPPETTO.getVARS().camera.position.set(
					GEPPETTO.getVARS().cameraPosition.x,
					GEPPETTO.getVARS().cameraPosition.y,
					GEPPETTO.getVARS().cameraPosition.z);
			GEPPETTO.getVARS().camera.lookAt(GEPPETTO.getVARS().sceneCenter);
		};

		/**
		 * Set up the WebGL Renderer
		 */
		var setupRenderer = function() {
			// Reuse a single WebGL renderer.
			// NOTE: Recreating the renderer causes camera displacement on
			// Chrome OSX.
			if (!GEPPETTO.getVARS().canvasCreated) {
				GEPPETTO.getVARS().renderer = new THREE.WebGLRenderer({
					antialias : true
				});

			}

			configureRenderer();

			GEPPETTO.getVARS().canvasCreated = true;
		};

		var configureRenderer = function() {
			var color = new THREE.Color(GEPPETTO.getVARS().backgroundColor);
			GEPPETTO.getVARS().renderer.setClearColor(color, 1);
			var width = $(GEPPETTO.getVARS().container).width();
			var height = $(GEPPETTO.getVARS().container).height();
			GEPPETTO.getVARS().renderer.setSize(width, height);
			GEPPETTO.getVARS().renderer.autoClear = true;
			GEPPETTO.getVARS().container.appendChild(GEPPETTO.getVARS().renderer.domElement);
		}

		/**
		 * Light up the scene
		 */
		var setupLights = function() {
			// Lights

			GEPPETTO.getVARS().scene.add(new THREE.AmbientLight(0x111111));

			GEPPETTO.getVARS().scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 1.1));

			var directionalLight = new THREE.DirectionalLight(0xffffff, 0.09);
			directionalLight.position.set(0, 1, 0);
			directionalLight.castShadow = true;
			GEPPETTO.getVARS().scene.add(directionalLight);

			var spotLight1 = new THREE.SpotLight(0xffffff, 0.1);
			spotLight1.position.set(100, 1000, 100);
			spotLight1.castShadow = true;
			spotLight1.shadowDarkness = 0.2;
			GEPPETTO.getVARS().scene.add(spotLight1);

			var spotLight2 = new THREE.SpotLight(0xffffff, 0.22);
			spotLight2.position.set(100, 1000, 100);
			spotLight2.castShadow = true;
			spotLight2.shadowDarkness = 0.2;
			GEPPETTO.getVARS().scene.add(spotLight2);

		};

		/**
		 * Sets up the controls used by the camera to make it able to zoom and
		 * pan.
		 */
		var setupControls = function() {
			// Controls
			GEPPETTO.getVARS().controls = new THREE.TrackballControls(GEPPETTO
					.getVARS().camera, GEPPETTO.getVARS().renderer.domElement);
			GEPPETTO.getVARS().controls.noZoom = false;
			GEPPETTO.getVARS().controls.noPan = false;
		};

		/**
		 * Set up the listeners use to detect mouse movement and windoe resizing
		 */
		var setupListeners = function() {
			if(!GEPPETTO.getVARS().listenersCreated){
				// when the mouse moves, call the given function
				GEPPETTO.getVARS().renderer.domElement.addEventListener('mousedown', function(event) {
					if(GEPPETTO.getVARS().pickingEnabled){
					var intersects = GEPPETTO.getIntersectedObjects();

					if ( intersects.length > 0 ) {
						var selected = "";
						
						// sort intersects
						var compare = function(a,b) {
						  if (a.distance < b.distance)
						    return -1;
						  if (a.distance > b.distance)
						    return 1;
						  return 0;
						}
						
						intersects.sort(compare);
						
						// Iterate and get the first visible item (they are now ordered by proximity)
						for(var i = 0; i<intersects.length; i++){
							// figure out if the entity is visible
							var instancePath = intersects[ i ].object.name;
							var visible = eval(instancePath + '.visible');
							if(visible){
								selected = instancePath;
								break;
							}
						}

						if(selected == ""){
							selected = intersects[ 0 ].object.parent.name;
						}
						if (GEPPETTO.getVARS().meshes.hasOwnProperty(selected) || GEPPETTO.getVARS().splitMeshes.hasOwnProperty(selected)) {
							GEPPETTO.G.unSelectAll();
							GEPPETTO.Console.executeCommand(selected + '.select()');
						}
					}
					}
				}, false);

				GEPPETTO.getVARS().renderer.domElement
						.addEventListener(
								'mousemove',
								function(event) {
									GEPPETTO.getVARS().mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
									GEPPETTO.getVARS().mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
								}, false);

				window
						.addEventListener(
								'resize',
								function() {
									var container = $(GEPPETTO.getVARS().container), width = container
											.width(), height = container
											.height();

									GEPPETTO.getVARS().camera.aspect = (width)
											/ (height);
									GEPPETTO.getVARS().camera
											.updateProjectionMatrix();
									GEPPETTO.getVARS().renderer.setSize(width,
											height);
								}, false);

				document.addEventListener("keydown",
						GEPPETTO.Vanilla.checkKeyboard, false);
				GEPPETTO.getVARS().listenersCreated = true;
			}
		};

		// ============================================================================
		// Application logic.
		// ============================================================================
		GEPPETTO.Init = {
			initEventListeners : function(){
				// setup listeners for geppetto events that can be triggered
				if (!GEPPETTO.Events.listening) {
					GEPPETTO.Events.listen();
					GEPPETTO.Events.listening = true;
				}
			},
			initialize : function(containerp) {
				GEPPETTO.getVARS().container = containerp;
				setupScene();
				setupCamera();
				setupRenderer();
				setupLights();
				setupControls();
				setupListeners();
				return GEPPETTO.getVARS();
			}
		};
	};
});
