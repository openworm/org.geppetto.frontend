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
				fullPageButton: "full-page",
				showZoomControl: !this.isWidget(),
				showHomeControl: !this.isWidget(),
				showFullPageControl: !this.isWidget()
			};

			this.state = {
				settings: $.extend(settings, this.props.settings),
				file: this.extractFilePath(this.props.data)
			};

			//this.download = this.download.bind(this);

			this.goHome = this.goHome.bind(this);
			this.zoomIn = this.zoomIn.bind(this);
			this.zoomOut = this.zoomOut.bind(this);
			this.fullPage = this.fullPage.bind(this);
		}

		loadViewer() {
			if (this.state.file != undefined) {
				if (this.viewer != undefined) {
					this.viewer.destroy();
				}
				this.state.settings.tileSources = this.state.file;
				this.viewer = OpenSeaDragon(this.state.settings);
			}
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
			if (this.isWidget()) {
				this.setCustomButtons(this.getCustomButtons());
			}
		}

		componentDidMount() {
			this.loadViewer();

			//If it is a widget -> set buttons in the toolbar
			if (this.isWidget()) {
				this.setCustomButtons(this.getCustomButtons());
				$(this.getContainer()).parent().parent().find('.ui-dialog-titlebar').css({
					"top": "2px",
					"position": "absolute",
					"z-index": "2",
					"width": "100%"
				});
			}
		}

		// These four methods are not exposed by OpenSeaDragon
		goHome() {
			this.viewer.viewport.goHome()
		}

		zoomIn() {
			this.viewer.viewport.zoomBy(
				this.viewer.zoomPerClick / 1.0
			);
			this.viewer.viewport.applyConstraints();

		}

		zoomOut() {
			this.viewer.viewport.zoomBy(
				1.0 / this.viewer.zoomPerClick
			);
			this.viewer.viewport.applyConstraints();
		}

		fullPage() {
			this.viewer.setFullScreen(true);
			this.viewer.fullPageButton.element.focus();
			this.viewer.viewport.applyConstraints();
		}

		getCustomButtons() {
			var customButtons = [];
			customButtons.push({ 'icon': 'fa-search-minus', 'id': 'zoom-out', 'title': 'Zoom Out', 'action': this.zoomOut });
			customButtons.push({ 'icon': 'fa-search-plus', 'id': 'zoom-in', 'title': 'Zoom In', 'action': this.zoomIn });
			customButtons.push({ 'icon': 'fa-home', 'id': 'home', 'title': 'Center Image', 'action': this.goHome });
			//customButtons.push({ 'icon': 'fa-expand', 'id': 'full-page', 'title': 'Full Page', 'action': this.fullPage });
			return customButtons;
		}

		render() {
			// Add the button bar if it is a component, otherwise add buttons in widget tool bar
			if (!this.isWidget()) {
				var widgetButtonBar = <WidgetButtonBar>
					{this.getCustomButtons().map((customButton) =>
						<button className={'btn fa ' + customButton.icon} id={customButton.id} title={customButton.title} />
					)}
				</WidgetButtonBar>
			}

			return (
				<div className="bigImageViewer">
					{widgetButtonBar}
					<div id={this.props.id + "_component"} className="bigImageViewer" />
				</div>
			)
		}
	};
});
