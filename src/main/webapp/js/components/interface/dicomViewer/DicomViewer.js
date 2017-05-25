define(function (require) {

	var React = require('react');
	window.THREE = require('three');

	require('./DicomViewer.less');
	var DicomViewerEngine = require('./DicomViewerEngine');

	var AbstractComponent = require('../../AComponent');

	return class DicomViewer extends AbstractComponent {

		constructor(props) {
			super(props);

			if (this.props.mode === undefined) {
				this.props.mode = "quad_view";
			}

			this.state = {
				files: this.extractFilesPath(this.props.data),
				mode: this.props.mode
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
			if (data != undefined){
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

		loadView() {
			if (this.state.mode == "single_view") {
				DicomViewerEngine.loadSingleView(this);
			}
			else if (this.state.mode == "quad_view") {
				DicomViewerEngine.loadQuadView(this);
			}
		}

		componentDidMount() {
			this.loadView();
		}

		componentDidUpdate() {
			this.loadView();
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
			if (this.camera.orientation == "coronal") {
				this.camera.orientation = "sagittal";
			}
			else if (this.camera.orientation == "sagittal") {
				this.camera.orientation = "axial";
			}
			else if (this.camera.orientation == "axial") {
				this.camera.orientation = "coronal";
			}
			this.camera.update()
			this.camera.fitBox(2)
			this.stackHelper.orientation = this.camera.stackOrientation;
			this.stackHelper.index = Math.floor(this.stackHelper.orientationMaxIndex / 2);
		}

		download() {
			GEPPETTO.Utility.createZipFromRemoteFiles(this.state.files, "data.zip");
		}

				/**
         *
         * @returns {{widgetType, isWidget}|{size: {height: *, width: *}, position: {left: *, top: *}}}
         */
        getView() {
            // add data-type and data field + any other custom fields in the component-specific attribute
            var baseView = super.getView();
            baseView.data = this.props.data;
            return baseView;
        }

		/**
         *
         * @param view
         */
        setView(view) {
            // set base properties
            super.setView(view)
			if (view.data != undefined){
				this.setData(view.data);
			}
		}

		render() {
			var dicomViewerContent;
			if (this.state.mode == "single_view") {
				dicomViewerContent = (
					<div className="dicomViewer">
					</div>
				)
			}
			else if (this.state.mode == "quad_view") {
				dicomViewerContent = (
					<div className="dicomViewer">
						<div data-id="r0" className="renderer r0"></div>
						<div data-id="r1" className="renderer r1"></div>
						<div data-id="r2" className="renderer r2"></div>
						<div data-id="r3" className="renderer r3"></div>
					</div>
				)
			}
			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} style={{ width: '100%', height: '100%' }}>
					<button style={{
						position: 'absolute',
						right: -2.5,
						top: 2.5,
						padding: 0,
						border: 0,
						background: 'transparent'
					}} className="btn fa fa-home" onClick={this.changeMode} title={'Change Mode'} />

					{(this.state.mode == "single_view") ? (
						<button style={{
							position: 'absolute',
							right: -2.5,
							top: 22.5,
							padding: 0,
							border: 0,
							background: 'transparent'
						}} className="btn fa fa-chevron-down" onClick={this.changeOrientation} title={'Change Orientation'} />
					) : null}

					{dicomViewerContent}
				</div>
			)
		}
	};

});