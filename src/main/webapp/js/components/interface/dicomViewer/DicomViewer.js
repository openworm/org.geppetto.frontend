define(function (require) {

	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = "geppetto/js/components/interface/dicomViewer/DicomViewer.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react');
	window.THREE = require('three');
	var AMI = require('ami.js');

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
			var container = document.getElementById('dicomViewer');
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
				camera.fitBox(2,2);

				renderer.setSize(container.offsetWidth, container.offsetHeight);
			}
			window.addEventListener('resize', onWindowResize, false);

			 $("#" + this.props.containerid ).on("dialogresizestop", function (event, ui) {
				camera.canvas = {
					width:  ui.size.width-30,
					height: ui.size.height-30,
				};
				camera.fitBox(2,2);

				renderer.setSize( ui.size.width-30, ui.size.height-30);
				
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

			// Setup loader
			// var loader = new LoadersVolume(container);
			// var file =
			// 	'https://cdn.rawgit.com/FNNDSC/data/master/nifti/adi_brain/adi_brain.nii.gz';

			// instantiate the loader
			// it loads and parses the dicom image
			var loader = new LoadersVolume(container);

			var t2 = [
				'00010001.dcm', '00010019.dcm', '00010037.dcm', '00010055.dcm', '00010073.dcm', '00010091.dcm', '00010109.dcm', '00010127.dcm',
				'00010002.dcm', '00010020.dcm', '00010038.dcm', '00010056.dcm', '00010074.dcm', '00010092.dcm', '00010110.dcm', '00010128.dcm',
				'00010003.dcm', '00010021.dcm', '00010039.dcm', '00010057.dcm', '00010075.dcm', '00010093.dcm', '00010111.dcm', '00010129.dcm',
				'00010004.dcm', '00010022.dcm', '00010040.dcm', '00010058.dcm', '00010076.dcm', '00010094.dcm', '00010112.dcm', '00010130.dcm',
				'00010005.dcm', '00010023.dcm', '00010041.dcm', '00010059.dcm', '00010077.dcm', '00010095.dcm', '00010113.dcm', '00010131.dcm',
				'00010006.dcm', '00010024.dcm', '00010042.dcm', '00010060.dcm', '00010078.dcm', '00010096.dcm', '00010114.dcm', '00010132.dcm',
				'00010007.dcm', '00010025.dcm', '00010043.dcm', '00010061.dcm', '00010079.dcm', '00010097.dcm', '00010115.dcm', '00010133.dcm',
				'00010008.dcm', '00010026.dcm', '00010044.dcm', '00010062.dcm', '00010080.dcm', '00010098.dcm', '00010116.dcm', '00010134.dcm',
				'00010009.dcm', '00010027.dcm', '00010045.dcm', '00010063.dcm', '00010081.dcm', '00010099.dcm', '00010117.dcm', '00010135.dcm',
				'00010010.dcm', '00010028.dcm', '00010046.dcm', '00010064.dcm', '00010082.dcm', '00010100.dcm', '00010118.dcm', '00010136.dcm',
				'00010011.dcm', '00010029.dcm', '00010047.dcm', '00010065.dcm', '00010083.dcm', '00010101.dcm', '00010119.dcm', '00010137.dcm',
				'00010012.dcm', '00010030.dcm', '00010048.dcm', '00010066.dcm', '00010084.dcm', '00010102.dcm', '00010120.dcm', '00010138.dcm',
				'00010013.dcm', '00010031.dcm', '00010049.dcm', '00010067.dcm', '00010085.dcm', '00010103.dcm', '00010121.dcm',
				'00010014.dcm', '00010032.dcm', '00010050.dcm', '00010068.dcm', '00010086.dcm', '00010104.dcm', '00010122.dcm',
				'00010015.dcm', '00010033.dcm', '00010051.dcm', '00010069.dcm', '00010087.dcm', '00010105.dcm', '00010123.dcm',
				'00010016.dcm', '00010034.dcm', '00010052.dcm', '00010070.dcm', '00010088.dcm', '00010106.dcm', '00010124.dcm',
				'00010017.dcm', '00010035.dcm', '00010053.dcm', '00010071.dcm', '00010089.dcm', '00010107.dcm', '00010125.dcm',
				'00010018.dcm', '00010036.dcm', '00010054.dcm', '00010072.dcm', '00010090.dcm', '00010108.dcm', '00010126.dcm',
			];

			var files = t2.map(function(v) {
				return 'geppetto/extensions/geppetto-hm/samples/lowResPACStypical/' + v;
			});

			loader.load(files)
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
					camera.fitBox(2,2);
				})
				.catch(function (error) {
					window.console.log('oops... something went wrong...');
					window.console.log(error);
				});




		},

		render: function () {
			return (
				<div>
					<div id="dicomViewer">
					</div>
				</div>
			)
		}
	});
	return dicomViewerComponent;
});