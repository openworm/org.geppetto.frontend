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
				files: this.extractFilesPath(this.props.files),
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
			if (data === undefined){
				return undefined;
			}
			else if (data.getMetaType == undefined) {
				return data;
			}
			else if (data.getMetaType() == "Instance") {
				if (data.getVariable().getInitialValues()[0].value.format == "NIFTI") {
					return data.getVariable().getInitialValues()[0].value.data;
				}
				else if (data.getVariable().getInitialValues()[0].value.format == "DCM") {
					// WHAT do we do here?
				}
			}
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
						<div className="renderer r0"></div>
						<div className="renderer r1"></div>
						<div className="renderer r2"></div>
						<div className="renderer r3"></div>
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