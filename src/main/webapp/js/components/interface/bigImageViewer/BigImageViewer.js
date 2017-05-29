define(function (require) {

	require("./BigImageViewer.less")

	var React = require('react');
	var OpenSeaDragon = require('openseadragon');
	var WidgetButtonBar = require('../../controls/widgetButtonBar/WidgetButtonBar');
	var AbstractComponent = require('../../AComponent');

	return class BigImageViewer extends AbstractComponent {

		constructor(props) {
			super(props);

			var settings = {
				id: this.props.id + "_component",
				zoomInButton: "zoom-in",
				zoomOutButton: "zoom-out",
				homeButton: "home",
				fullPageButton: "full-page"
			};

			this.state = {
				settings: $.extend(settings, this.props.settings),
				file: this.extractFilePath(this.props.data)
			};

			this.download = this.download.bind(this);
		}

		loadViewer() {
			this.state.settings.tileSources = this.state.file;
			this.viewer = OpenSeadragon(this.state.settings);
		}

		download() {
			//What do we do here?
			console.log("Downloading data...");
		}

		extractFilePath(data) {
			var file;
			if (data != undefined){
				if (data.getMetaType == undefined) {
					file = data;
				}
				else if (data.getMetaType() == "Instance" && data.getVariable().getInitialValues()[0].value.format == "DZI") {
						file = data.getVariable().getInitialValues()[0].value.data;
				}
			}
			return file;
		}

		setData(data) {
			this.setState({ file: this.extractFilePath(data) });
		}

		componentDidUpdate() {
			this.loadViewer();
		}

		componentDidMount() {
			this.loadViewer();
		}

		render() {
			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} className="bigImageViewer">
					<WidgetButtonBar>
						<button className='btn fa fa-home' id='home' title={'Center Stack'} />
						<button className='btn fa fa-search-plus' id='zoom-in' title={'Zoom In'} />
						<button className='btn fa fa-search-minus' id='zoom-out' title={'Zoom Out'} />
						<button className='btn fa fa-arrows-alt' id='full-page' title={'Full Page'} />
					</WidgetButtonBar>
				</div>
			)
		}
	};
});
