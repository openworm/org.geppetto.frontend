define(function (require) {

	require("./BigImageViewer.less");

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
			if (this.state.file != undefined) {
				if (this.viewer != undefined) {
					this.viewer.destroy();
				}
				this.state.settings.tileSources = this.state.file;
				this.viewer = OpenSeadragon(this.state.settings);
			}
		}

		download() {
			//What do we do here?
			console.log("Downloading data...");
		}

		extractFilePath(data) {
			var file;
			if (data != undefined) {
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

			//If it is a widget -> set buttons in the toolbar
			// if (this.isWidget()) {
			// 	this.setCustomButtons(this.getCustomButtons());
			// }
		}

		componentDidMount() {
			this.loadViewer();

			//If it is a widget -> set buttons in the toolbar
			// if (this.isWidget()) {
			// 	this.setCustomButtons(this.getCustomButtons());
			// }
		}

		getCustomButtons() {
			var customButtons = [];
			customButtons.push({ 'icon': 'fa-home', 'id':'home', 'title': 'Center Image'});
			customButtons.push({ 'icon': 'fa-search-plus', 'id':'zoom-in', 'title': 'Zoom In'});
			customButtons.push({ 'icon': 'fa-search-minus', 'id':'zoom-out', 'title': 'Zoom Out'});
			customButtons.push({ 'icon': 'fa-expand', 'id':'full-page', 'title': 'Full Page'});
			return customButtons;
		}

		render() {
			// Add the button bar if it is a component, otherwise add buttons in widget tool bar
			// if (!this.isWidget()) {
				var widgetButtonBar = <WidgetButtonBar>
					{this.getCustomButtons().map((customButton) =>
						<button className={'btn fa ' + customButton.icon} id={customButton.id} title={customButton.title} />
					)}
				</WidgetButtonBar>
			// }

			return (
				<div className="bigImageViewer">
					{widgetButtonBar}
					<div id={this.props.id + "_component"} className="bigImageViewer"/>
				</div>
			)
		}
	};
});
