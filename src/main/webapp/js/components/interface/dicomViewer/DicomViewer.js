define(function (require) {

	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = "geppetto/js/components/interface/dicomViewer/DicomViewer.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react');
	window.THREE = require('three');
	var AMI = require('ami.js');
	var dat = require('dat-gui');

	var dicomViewerComponent = React.createClass({

		shouldComponentUpdate() {
			return false;
		},

		componentDidMount: function () {

			// VJS classes we will be using in this lesson
			var LoadersVolume = AMI.default.Loaders.Volume;
			var CamerasOrthographic = AMI.default.Cameras.Orthographic;
			var ControlsOrthographic = AMI.default.Controls.TrackballOrtho;
			var HelpersStack = AMI.default.Helpers.Stack;

			// Setup renderer
			var container = document.getElementById(this.props.id).getElementsByClassName('dicomViewer')[0];
			container.style.height = "300px";
			container.style.width = "350px";
			var renderer = new THREE.WebGLRenderer({
				antialias: true,
			});
			renderer.setSize(container.offsetWidth, container.offsetHeight);
			renderer.setClearColor(0x353535, 1);
			renderer.setPixelRatio(window.devicePixelRatio);
			container.appendChild(renderer.domElement);

			// Setup scene
			var scene = new THREE.Scene();

			// Setup camera
			var camera = new CamerasOrthographic(
				container.clientWidth / -2, container.clientWidth / 2,
				container.clientHeight / 2, container.clientHeight / -2,
				0.1, 10000);

			// Setup controls
			var controls = new ControlsOrthographic(camera, container);
			controls.staticMoving = true;
			controls.noRotate = true;
			camera.controls = controls;

			/**
			 * Handle window resize
			 */
			function onWindowResize() {
				camera.canvas = {
					width: container.offsetWidth,
					height: container.offsetHeight,
				};
				camera.fitBox(2, 2);

				renderer.setSize(container.offsetWidth, container.offsetHeight);
			}
			window.addEventListener('resize', onWindowResize, false);

			$("#" + this.props.id).on("dialogresizestop", function (event, ui) {
				camera.canvas = {
					width: ui.size.width - 260 - 30,
					height: ui.size.height - 30,
				};
				camera.fitBox(2, 2);

				renderer.setSize(ui.size.width - 260 - 30, ui.size.height - 30);

			});

			/**
			 * Start animation loop
			 */
			function animate() {
				controls.update();
				renderer.render(scene, camera);

				// request new frame
				requestAnimationFrame(function () {
					animate();
				});
			}
			animate();

			function gui(stackHelper, containerId) {
				var gui = new dat.GUI({
					autoPlace: false,
				});

				var customContainer = document.getElementById(containerId).getElementsByClassName('controlsContainer')[0];
				customContainer.appendChild(gui.domElement);
				// only reason to use this object is to satusfy data.GUI
				var camUtils = {
					invertRows: false,
					invertColumns: false,
					rotate45: false,
					rotate: 0,
					orientation: 'default',
					convention: 'radio',
				};

				// camera
				var cameraFolder = gui.addFolder('Camera');
				var invertRows = cameraFolder.add(camUtils, 'invertRows');
				invertRows.onChange(function () {
					camera.invertRows();
				});

				var invertColumns = cameraFolder.add(camUtils, 'invertColumns');
				invertColumns.onChange(function () {
					camera.invertColumns();
				});

				var rotate45 = cameraFolder.add(camUtils, 'rotate45');
				rotate45.onChange(function () {
					camera.rotate();
				});

				cameraFolder.add(camera, 'angle', 0, 360).step(1).listen();

				let orientationUpdate = cameraFolder.add(
					camUtils, 'orientation', ['default', 'axial', 'coronal', 'sagittal']);
				orientationUpdate.onChange(function (value) {
					camera.orientation = value;
					camera.update();
					camera.fitBox(2);
					stackHelper.orientation = camera.stackOrientation;
				});

				let conventionUpdate = cameraFolder.add(
					camUtils, 'convention', ['radio', 'neuro']);
				conventionUpdate.onChange(function (value) {
					camera.convention = value;
					camera.update();
					camera.fitBox(2);
				});

				cameraFolder.open();

				// of course we can do everything from lesson 01!
				var stackFolder = gui.addFolder('Stack');
				stackFolder.add(
					stackHelper, 'index', 0, stackHelper.stack.dimensionsIJK.z - 1)
					.step(1).listen();
				stackFolder.add(stackHelper.slice, 'interpolation', 0, 1).step(1).listen();
				stackFolder.open();
			}

			// Setup loader
			var _this = this;
			var loader = new LoadersVolume(container);
			loader.load(this.props.files)
				.then(function () {
					// merge files into clean series/stack/frame structure
					var series = loader.data[0].mergeSeries(loader.data);
					var stack = series[0].stack[0];
					loader.free();
					loader = null;
					// be carefull that series and target stack exist!
					var stackHelper = new HelpersStack(stack);
					// stackHelper.orientation = 2;
					// stackHelper.index = 56;

					// tune bounding box
					stackHelper.bbox.visible = false;

					// tune slice border
					stackHelper.border.color = 0xFF9800;
					// stackHelper.border.visible = false;

					scene.add(stackHelper);

					// build the gui
    				gui(stackHelper, _this.props.id);

					// hook up callbacks
					controls.addEventListener('OnScroll', function (e) {
						console.log("scrolling");
						if (e.delta > 0) {
							if (stackHelper.index >= stack.dimensionsIJK.z - 1) {
								return false;
							}
							stackHelper.index += 1;
						} else {
							if (stackHelper.index <= 0) {
								return false;
							}
							stackHelper.index -= 1;
						}

					});

					// center camera and interactor to center of bouding box
					// for nicer experience
					// set camera
					var worldbb = stack.worldBoundingBox();
					var lpsDims = new THREE.Vector3(
						worldbb[1] - worldbb[0],
						worldbb[3] - worldbb[2],
						worldbb[5] - worldbb[4]
					);

					// box: {halfDimensions, center}
					var box = {
						center: stack.worldCenter().clone(),
						halfDimensions:
						new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10),
					};

					// init and zoom
					var canvas = {
						width: container.clientWidth,
						height: container.clientHeight,
					};

					camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
					camera.box = box;
					camera.canvas = canvas;
					camera.update();

					// Not working properly. See issue: https://github.com/FNNDSC/ami/issues/120
					camera.fitBox(2, 2);
				})
				.catch(function (error) {
					window.console.log('oops... something went wrong...');
					window.console.log(error);
				});
		},

		render: function () {
			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"}>
					<div className="dicomViewer" style={{float:'left'}}>
					</div>
					<div className="controlsContainer" style={{float:'right'}}>
					</div>
				</div>
			)
		}
	});
	return dicomViewerComponent;
});