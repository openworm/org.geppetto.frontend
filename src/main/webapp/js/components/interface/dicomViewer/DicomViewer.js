define(function (require) {

	var React = require('react');
	window.THREE = require('three');
	var AMI = require('./ami.min.js');
	var LoadersVolume = AMI.default.Loaders.Volume;
	var HelpersStack = AMI.default.Helpers.Stack;
	var HelpersBoundingBox = AMI.default.Helpers.BoundingBox;
	var ModelsStack = AMI.default.Models.Stack;
	var HelpersLocalizer = AMI.default.Helpers.Localizer;

	require('./DicomViewer.less');
	var DicomViewerUtils = require('./DicomViewerUtils');
	var WidgetButtonBar = require('../../controls/widgetButtonBar/WidgetButtonBar');
	var AbstractComponent = require('../../AComponent');

	return class DicomViewer extends AbstractComponent {

		constructor(props) {
			super(props);

			this.state = {
				files: this.extractFilesPath(this.props.data),
				mode: (this.props.mode === undefined) ? "quad_view" : this.props.mode,
				orientation: (this.props.orientation === undefined) ? "coronal" : this.props.orientation
			};

			// 3d renderer
			this.r0 = {
				domClass: 'r0',
				domElement: null,
				renderer: null,
				color: 0x212121,
				targetID: 0,
				camera: null,
				controls: null,
				scene: null,
				light: null,
			};

			// 2d axial renderer
			this.r1 = {
				domClass: 'r1',
				domElement: null,
				renderer: null,
				color: 0x121212,
				sliceOrientation: 'axial',
				sliceColor: 0xFF1744,
				targetID: 1,
				camera: null,
				controls: null,
				scene: null,
				light: null,
				stackHelper: null,
				localizerHelper: null,
				localizerScene: null,
			};

			// 2d sagittal renderer
			this.r2 = {
				domClass: 'r2',
				domElement: null,
				renderer: null,
				color: 0x121212,
				sliceOrientation: 'sagittal',
				sliceColor: 0xFFEA00,
				targetID: 2,
				camera: null,
				controls: null,
				scene: null,
				light: null,
				stackHelper: null,
				localizerHelper: null,
				localizerScene: null,
			};

			// 2d coronal renderer
			this.r3 = {
				domClass: 'r3',
				domElement: null,
				renderer: null,
				color: 0x121212,
				sliceOrientation: 'coronal',
				sliceColor: 0x76FF03,
				targetID: 3,
				camera: null,
				controls: null,
				scene: null,
				light: null,
				stackHelper: null,
				localizerHelper: null,
				localizerScene: null,
			};

			this.changeMode = this.changeMode.bind(this);
			this.changeOrientation = this.changeOrientation.bind(this);
			this.download = this.download.bind(this);
		}

		setData(data) {
			this.setState({ files: this.extractFilesPath(data) });
		}

		extractFilesPath(data) {
			var files;
			if (data != undefined) {
				if (data.getMetaType == undefined) {
					files = data;
				}
				else if (data.getMetaType() == "Instance") {
					if (data.getVariable().getInitialValues()[0].value.format == "NIFTI") {
						files = data.getVariable().getInitialValues()[0].value.data;
					}
					else if (data.getVariable().getInitialValues()[0].value.format == "DCM") {
						// WHAT do we do here?
					}
				}
			}
			return files;
		}

		loadModel() {
			if (this.state.files != undefined && this.state.files != null) {

				if (this.isWidget()) {
					this.showOverlay(<div className="spinner-container">
						<div className={"fa fa-circle-o-notch fa-spin"}></div>
						<p id="loadingmodaltext" className="orange">Loading MRI files...</p>
					</div>);
				}

				this.ready = false;
				var _this = this;

				/**
				 * Init the quadview
				 */
				function init() {
					/**
					 * Called on each animation frame
					 */
					function animate() {
						// we are ready when both meshes have been loaded
						if (_this.ready) {
							if ((_this.state.mode == "single_view" && _this.state.orientation == "3d") || _this.state.mode == "quad_view") {
								// render
								_this.r0.controls.update();
								_this.r0.light.position.copy(_this.r0.camera.position);
								_this.r0.renderer.render(_this.r0.scene, _this.r0.camera);
							}


							if ((_this.state.mode == "single_view" && _this.state.orientation == "sagittal") || _this.state.mode == "quad_view") {
								_this.r1.controls.update();
								// r1
								_this.r1.renderer.clear();
								_this.r1.renderer.render(_this.r1.scene, _this.r1.camera);

								// localizer
								_this.r1.renderer.clearDepth();
								_this.r1.renderer.render(_this.r1.localizerScene, _this.r1.camera);

							}


							if ((_this.state.mode == "single_view" && _this.state.orientation == "axial") || _this.state.mode == "quad_view") {
								_this.r2.controls.update();
								// r2
								_this.r2.renderer.clear();
								_this.r2.renderer.render(_this.r2.scene, _this.r2.camera);
								// localizer
								_this.r2.renderer.clearDepth();
								_this.r2.renderer.render(_this.r2.localizerScene, _this.r2.camera);
							}

							if ((_this.state.mode == "single_view" && _this.state.orientation == "coronal") || _this.state.mode == "quad_view") {
								_this.r3.controls.update();
								// r3
								_this.r3.renderer.clear();
								_this.r3.renderer.render(_this.r3.scene, _this.r3.camera);
								// localizer
								_this.r3.renderer.clearDepth();
								_this.r3.renderer.render(_this.r3.localizerScene, _this.r3.camera);
							}
						}

						// request new frame
						requestAnimationFrame(function () {
							animate();
						});
					}

					// renderers
					DicomViewerUtils.initRenderer3D(_this.r0, _this.getContainer());
					DicomViewerUtils.initRenderer2D(_this.r1, _this.getContainer());
					DicomViewerUtils.initRenderer2D(_this.r2, _this.getContainer());
					DicomViewerUtils.initRenderer2D(_this.r3, _this.getContainer());

					// start rendering loop
					animate();
				}

				// init threeJS
				init();

				// load sequence for each file
				// instantiate the loader
				// it loads and parses the dicom image
				let loader = new LoadersVolume();
				loader.load(this.state.files)
					.then(function () {
						let series = loader.data[0].mergeSeries(loader.data)[0];
						loader.free();
						loader = null;
						// get first stack from series
						let stack = series.stack[0];
						stack.prepare();

						// center 3d camera/control on the stack
						let centerLPS = stack.worldCenter();
						_this.r0.camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
						_this.r0.camera.updateProjectionMatrix();
						_this.r0.controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

						// bouding box
						let boxHelper = new HelpersBoundingBox(stack);
						_this.r0.scene.add(boxHelper);

						// red slice
						DicomViewerUtils.initHelpersStack(_this.r1, stack);
						_this.r0.scene.add(_this.r1.scene);

						// yellow slice
						DicomViewerUtils.initHelpersStack(_this.r2, stack);
						_this.r0.scene.add(_this.r2.scene);

						// green slice
						DicomViewerUtils.initHelpersStack(_this.r3, stack);
						_this.r0.scene.add(_this.r3.scene);

						// create new mesh with Localizer shaders
						let plane1 = _this.r1.stackHelper.slice.cartesianEquation();
						let plane2 = _this.r2.stackHelper.slice.cartesianEquation();
						let plane3 = _this.r3.stackHelper.slice.cartesianEquation();

						// localizer red slice
						DicomViewerUtils.initHelpersLocalizer(_this.r1, stack, plane1, [
							{
								plane: plane2,
								color: new THREE.Color(_this.r2.stackHelper.borderColor),
							},
							{
								plane: plane3,
								color: new THREE.Color(_this.r3.stackHelper.borderColor),
							},
						]);

						// localizer yellow slice
						DicomViewerUtils.initHelpersLocalizer(_this.r2, stack, plane2, [
							{
								plane: plane1,
								color: new THREE.Color(_this.r1.stackHelper.borderColor),
							},
							{
								plane: plane3,
								color: new THREE.Color(_this.r3.stackHelper.borderColor),
							},
						]);

						// localizer green slice
						DicomViewerUtils.initHelpersLocalizer(_this.r3, stack, plane3, [
							{
								plane: plane1,
								color: new THREE.Color(_this.r1.stackHelper.borderColor),
							},
							{
								plane: plane2,
								color: new THREE.Color(_this.r2.stackHelper.borderColor),
							},
						]);

						_this.configureEvents();
						_this.ready = true;
						if (_this.isWidget()) {
							_this.hideOverlay();
						}

					})
					.catch(function (error) {
						window.console.log('oops... something went wrong...');
						window.console.log(error);
					});
			}

		}

		configureEvents() {
			var _this = this;
			function goToPoint(event) {
				const canvas = event.srcElement.parentElement;
				const id = event.target.id;
				const mouse = {
					x: ((event.clientX - $(canvas).offset().left) / canvas.clientWidth) * 2 - 1,
					y: - ((event.clientY - $(canvas).offset().top) / canvas.clientHeight) * 2 + 1,
				};


				let camera = null;
				let stackHelper = null;
				let scene = null;
				switch (id) {
					case '0':
						camera = _this.r0.camera;
						stackHelper = _this.r1.stackHelper;
						scene = _this.r0.scene;
						break;
					case '1':
						camera = _this.r1.camera;
						stackHelper = _this.r1.stackHelper;
						scene = _this.r1.scene;
						break;
					case '2':
						camera = _this.r2.camera;
						stackHelper = _this.r2.stackHelper;
						scene = _this.r2.scene;
						break;
					case '3':
						camera = _this.r3.camera;
						stackHelper = _this.r3.stackHelper;
						scene = _this.r3.scene;
						break;
				}

				const raycaster = new THREE.Raycaster();
				raycaster.setFromCamera(mouse, camera);

				const intersects = raycaster.intersectObjects(scene.children, true);
				if (intersects.length > 0) {
					let ijk =
						ModelsStack.worldToData(stackHelper.stack, intersects[0].point);
					_this.r1.stackHelper.index =
						ijk.getComponent((_this.r1.stackHelper.orientation + 2) % 3);
					_this.r2.stackHelper.index =
						ijk.getComponent((_this.r2.stackHelper.orientation + 2) % 3);
					_this.r3.stackHelper.index =
						ijk.getComponent((_this.r3.stackHelper.orientation + 2) % 3);

					DicomViewerUtils.updateLocalizer(_this.r2, [_this.r1.localizerHelper, _this.r3.localizerHelper]);
					DicomViewerUtils.updateLocalizer(_this.r1, [_this.r2.localizerHelper, _this.r3.localizerHelper]);
					DicomViewerUtils.updateLocalizer(_this.r3, [_this.r1.localizerHelper, _this.r2.localizerHelper]);
				}
			}

			function goToSingleView(event) {
				const id = event.target.id;
				let orientation = null;
				switch (id) {
					case '0':
						orientation = "3d";
						break;
					case '1':
						orientation = "sagittal";
						break;
					case '2':
						orientation = "axial";
						break;
					case '3':
						orientation = "coronal";
						break;
				}

				if (orientation != null) {
					_this.setState({ mode: "single_view", orientation: orientation });
				}
			}

			function togglMode(event) {
				if (_this.state.mode == 'single_view') {
					_this.changeMode();
				}
				else {
					goToSingleView(event);
				}
			}

			function onScroll(event) {
				const id = $(event.target.domElement).data("id");
				let stackHelper = null;
				switch (id) {
					case 'r1':
						stackHelper = _this.r1.stackHelper;
						break;
					case 'r2':
						stackHelper = _this.r2.stackHelper;
						break;
					case 'r3':
						stackHelper = _this.r3.stackHelper;
						break;
				}

				if (event.delta > 0) {
					if (stackHelper.index >= stackHelper.orientationMaxIndex - 1) {
						return false;
					}
					stackHelper.index += 1;
				} else {
					if (stackHelper.index <= 0) {
						return false;
					}
					stackHelper.index -= 1;
				}

				DicomViewerUtils.updateLocalizer(_this.r2, [_this.r1.localizerHelper, _this.r3.localizerHelper]);
				DicomViewerUtils.updateLocalizer(_this.r1, [_this.r2.localizerHelper, _this.r3.localizerHelper]);
				DicomViewerUtils.updateLocalizer(_this.r3, [_this.r1.localizerHelper, _this.r2.localizerHelper]);
			}

			function performEventAction(action, event) {
				// Check if it is a already defined action or a external one
				if (action == 'goToPoint' || action == 'goToSingleView' || action == 'togglMode') {
					eval(action + '(event)');
				}
				else {
					action(event, this)
				}
			}

			function eventHandling(event) {
				if (event.type == "click" && _this.props.onClick != undefined) {
					performEventAction(_this.props.onClick, event)
				}
				else if (event.type == "click" && (event.ctrlKey || event.metaKey) && _this.props.onCtrlClick != undefined) {
					performEventAction(_this.props.onCtrlClick, event);
				}
				else if (event.type == "click" && event.shiftKey && _this.props.onShiftClick != undefined) {
					performEventAction(_this.props.onShiftClick, event);
				}
				else if (event.type == "dblclick" && _this.props.onDoubleClick != undefined) {
					performEventAction(_this.props.onDoubleClick, event);
				}
			}

			// event listeners ondoubleclick
			_this.r0.domElement.addEventListener('dblclick', eventHandling);
			_this.r1.domElement.addEventListener('dblclick', eventHandling);
			_this.r2.domElement.addEventListener('dblclick', eventHandling);
			_this.r3.domElement.addEventListener('dblclick', eventHandling);

			// event listeners onclick
			this.r0.domElement.addEventListener('click', eventHandling);
			this.r1.domElement.addEventListener('click', eventHandling);
			this.r2.domElement.addEventListener('click', eventHandling);
			this.r3.domElement.addEventListener('click', eventHandling);

			// event listeners on scrol
			this.r1.controls.addEventListener('OnScroll', onScroll);
			this.r2.controls.addEventListener('OnScroll', onScroll);
			this.r3.controls.addEventListener('OnScroll', onScroll);

			// event listeners on resize
			window.addEventListener('resize', function () { _this.setLayout(); }, false);
			$(this.getContainer()).parent().on("resizeEnd", function (event, ui) {
				_this.setLayout()
			});
		}

		setQuadLayout() {
			// update 3D
			DicomViewerUtils.windowResize3D(this.r0);

			// update 2d
			DicomViewerUtils.windowResize2D(this.r1);
			DicomViewerUtils.windowResize2D(this.r2);
			DicomViewerUtils.windowResize2D(this.r3);
		}

		setSingleLayout() {
			var rendererObj;
			switch (this.state.orientation) {
				case '3d':
					rendererObj = this.r0;
					break;
				case 'sagittal':
					rendererObj = this.r1;
					break;
				case 'axial':
					rendererObj = this.r2;
					break;
				case 'coronal':
					rendererObj = this.r3;
					break;
			}

			if (this.state.orientation == '3d') {
				DicomViewerUtils.windowResize3D(rendererObj);
			}
			else {
				DicomViewerUtils.windowResize2D(rendererObj);
			}
		}

		setLayout() {
			if (this.state.mode == 'single_view') {
				this.setSingleLayout();
			}
			else {
				this.setQuadLayout();
			}
		}

		getCustomButtons() {
			var customButtons = [];
			if (this.state.mode == 'single_view') {
				customButtons.push({'icon': 'fa-th-large', 'title': 'Change Mode', 'action': this.changeMode });
				customButtons.push({'icon': 'fa-square activeColor', 'title': 'Change Mode', 'action': this.changeMode });
				customButtons.push({'icon': 'fa-exchange', 'title': 'Change Orientation', 'action': this.changeOrientation });
			}
			else {
				customButtons.push({'icon': 'fa-th-large activeColor', 'title': 'Change Mode', 'action': this.changeMode });
				customButtons.push({'icon': 'fa-square', 'title': 'Change Mode', 'action': this.changeMode });
			}
			return customButtons;
		}

		componentWillUnmount() {
			DicomViewerUtils.dispose(this.r0);
			DicomViewerUtils.dispose(this.r1);
			DicomViewerUtils.dispose(this.r2);
			DicomViewerUtils.dispose(this.r3);
		}
		
		componentDidMount() {
			this.loadModel();

			//If it is a widget -> set buttons in the toolbar
			if (this.isWidget()) {
				this.setCustomButtons(this.getCustomButtons());
			}
		}

		componentDidUpdate(prevProps, prevState) {
			if (prevState.files != this.state.files) {
				this.loadModel();
			}
			else {
				this.setLayout();
			}

			//If it is a widget -> set buttons in the toolbar
			if (this.isWidget()) {
				this.setCustomButtons(this.getCustomButtons());
			}
		}

		changeMode() {
			if (this.state.mode == "single_view") {
				this.setState({ mode: "quad_view" });
			}
			else {
				this.setState({ mode: "single_view" });
			}
		}

		changeOrientation() {
			switch (this.state.orientation) {
				case "coronal":
					var newOrientation = "sagittal";
					break;
				case "sagittal":
					var newOrientation = "axial";
					break;
				case "axial":
					var newOrientation = "3d";
					break;
				case "3d":
					var newOrientation = "coronal";
					break;
				default:
					break;
			}
			this.setState({ orientation: newOrientation });
		}

		download() {
			GEPPETTO.Utility.createZipFromRemoteFiles(this.state.files, "data.zip");
		}

		render() {
			// Add the button bar if it is a component, otherwise add buttons in widget tool bar
			if (!this.isWidget()) {
				var widgetButtonBar = <WidgetButtonBar>
					{this.getCustomButtons().map((customButton) =>
						<button className={'btn fa ' + customButton.icon} onClick={customButton.action} title={customButton.title} />
					)}
				</WidgetButtonBar>
			}

			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} className="dicomViewerContainer" style={this.props.style}>
					{widgetButtonBar}

					<div className="dicomViewer">
						<div data-id="r0" className="renderer r0" style={{ display: this.state.mode == 'single_view' && this.state.orientation != '3d' ? 'none' : '', width: this.state.mode == 'single_view' && this.state.orientation == '3d' ? '100%' : '50%', height: this.state.mode == 'single_view' && this.state.orientation == '3d' ? '100%' : '50%' }}></div>
						<div data-id="r1" className="renderer r1" style={{ display: this.state.mode == 'single_view' && this.state.orientation != 'sagittal' ? 'none' : '', width: this.state.mode == 'single_view' && this.state.orientation == 'sagittal' ? '100%' : '50%', height: this.state.mode == 'single_view' && this.state.orientation == 'sagittal' ? '100%' : '50%' }}></div>
						<div data-id="r2" className="renderer r2" style={{ display: this.state.mode == 'single_view' && this.state.orientation != 'axial' ? 'none' : '', width: this.state.mode == 'single_view' && this.state.orientation == 'axial' ? '100%' : '50%', height: this.state.mode == 'single_view' && this.state.orientation == 'axial' ? '100%' : '50%' }}></div>
						<div data-id="r3" className="renderer r3" style={{ display: this.state.mode == 'single_view' && this.state.orientation != 'coronal' ? 'none' : '', width: this.state.mode == 'single_view' && this.state.orientation == 'coronal' ? '100%' : '50%', height: this.state.mode == 'single_view' && this.state.orientation == 'coronal' ? '100%' : '50%' }}></div>
					</div>

				</div>
			)
		}
	};

});