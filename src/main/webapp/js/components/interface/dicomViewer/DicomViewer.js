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
			if (this.state.files != undefined) {

				if (this.isWidget()){
					this.showOverlay(<div className="spinner-container">
			            			<div className={"gpt-gpt_logo fa-spin"}></div>
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
							// render
							_this.r0.controls.update();
							_this.r1.controls.update();
							_this.r2.controls.update();
							_this.r3.controls.update();

							_this.r0.light.position.copy(_this.r0.camera.position);
							_this.r0.renderer.render(_this.r0.scene, _this.r0.camera);

							// r1
							_this.r1.renderer.clear();
							_this.r1.renderer.render(_this.r1.scene, _this.r1.camera);
							// localizer
							_this.r1.renderer.clearDepth();
							_this.r1.renderer.render(_this.r1.localizerScene, _this.r1.camera);

							// r2
							_this.r2.renderer.clear();
							_this.r2.renderer.render(_this.r2.scene, _this.r2.camera);
							// localizer
							_this.r2.renderer.clearDepth();
							_this.r2.renderer.render(_this.r2.localizerScene, _this.r2.camera);

							// r3
							_this.r3.renderer.clear();
							_this.r3.renderer.render(_this.r3.scene, _this.r3.camera);
							// localizer
							_this.r3.renderer.clearDepth();
							_this.r3.renderer.render(_this.r3.localizerScene, _this.r3.camera);
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
						if (_this.isWidget()){
							_this.hideOverlay();
						}

					})
					.catch(function (error) {
						window.console.log('oops... something went wrong...');
						window.console.log(error);
					});
			}

		}

		componentDidMount() {
			this.loadModel();
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

			function onClick(event) {

				if (event.ctrlKey) {
					goToSingleView(event);
				}
				else {
					goToPoint(event);
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

			// event listeners
			// _this.r0.domElement.addEventListener('dblclick', onDoubleClick);
			// _this.r1.domElement.addEventListener('dblclick', onDoubleClick);
			// _this.r2.domElement.addEventListener('dblclick', onDoubleClick);
			// _this.r3.domElement.addEventListener('dblclick', onDoubleClick);

			// event listeners
			this.r0.domElement.addEventListener('click', onClick);
			this.r1.domElement.addEventListener('click', onClick);
			this.r2.domElement.addEventListener('click', onClick);
			this.r3.domElement.addEventListener('click', onClick);

			// event listeners
			this.r1.controls.addEventListener('OnScroll', onScroll);
			this.r2.controls.addEventListener('OnScroll', onScroll);
			this.r3.controls.addEventListener('OnScroll', onScroll);


			window.addEventListener('resize', function () { _this.setLayout(); }, false);

			$(this.getContainer()).parent().on("resizeEnd", function (event, ui) {
				_this.setLayout()
			});
		}

		setQuadLayout() {
			// update 3D
			this.r0.camera.aspect = this.r0.domElement.clientWidth / this.r0.domElement.clientHeight;
			this.r0.camera.updateProjectionMatrix();
			this.r0.renderer.setSize(
				this.r0.domElement.clientWidth, this.r0.domElement.clientHeight);

			// update 2d
			DicomViewerUtils.windowResize2D(this.r1);
			DicomViewerUtils.windowResize2D(this.r2);
			DicomViewerUtils.windowResize2D(this.r3);
		}

		setSingleLayout() {
			var rendererObj;
			switch (this.state.orientation) {
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


			var container = this.getContainer();
			rendererObj.camera.canvas = {
				width: container.offsetWidth,
				height: container.offsetHeight,
			};
			rendererObj.stackHelper.slice.canvasWidth =
				container.offsetWidth;
			rendererObj.stackHelper.slice.canvasHeight =
				container.offsetHeight + 20;
			rendererObj.camera.fitBox(2);
			rendererObj.renderer.setSize(container.offsetWidth, container.offsetHeight);
		}

		setLayout() {
			if (this.state.mode == 'single_view') {
				this.setSingleLayout();
			}
			else {
				this.setQuadLayout();
			}
		}

		componentDidUpdate(prevProps, prevState) {
			if (prevState.files != this.state.files) {
				this.loadModel();
			}
			else {
				this.setLayout();
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
			var newOrientation;
			if (this.state.orientation == "coronal") {
				newOrientation = "sagittal";
			}
			else if (this.state.orientation == "sagittal") {
				newOrientation = "axial";
			}
			else if (this.state.orientation == "axial") {
				newOrientation = "coronal";
			}

			this.setState({ orientation: newOrientation });
		}

		download() {
			GEPPETTO.Utility.createZipFromRemoteFiles(this.state.files, "data.zip");
		}

		render() {

			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} style={{ width: '100%', height: '100%' }}>
					<WidgetButtonBar>
						<button className={this.state.mode == 'single_view' ? 'btn fa fa-th-large' : 'btn fa fa-square'} onClick={this.changeMode} title={'Change Mode'} />
						{(this.state.mode == "single_view") ? (<button className="btn fa fa-repeat" onClick={this.changeOrientation} title={'Change Orientation'} />) : null}
					</WidgetButtonBar>

					<div className="dicomViewer">
						<div data-id="r0" className="renderer r0" style={{ display: this.state.mode == 'single_view' ? 'none' : '' }}></div>
						<div data-id="r1" className="renderer r1" style={{ display: this.state.mode == 'single_view' && this.state.orientation != 'sagittal' ? 'none' : '' }}></div>
						<div data-id="r2" className="renderer r2" style={{ display: this.state.mode == 'single_view' && this.state.orientation != 'axial' ? 'none' : '' }}></div>
						<div data-id="r3" className="renderer r3" style={{ display: this.state.mode == 'single_view' && this.state.orientation != 'coronal' ? 'none' : '' }}></div>
					</div>

				</div>
			)
		}
	};

});