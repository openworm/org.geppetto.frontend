define(function (require) {

	require("./BigImageViewer.less")

	var React = require('react');
	var OpenSeaDragon = require('openseadragon');
	var AbstractComponent = require('../../AComponent');

	return class BigImageViewer extends AbstractComponent {

		constructor(props) {
			super(props);

			var settings = {
				id: this.props.id + "_component",
				// FIXME: I have copied the images inside the images component folder. More info https://github.com/openseadragon/openseadragon/issues/792
				prefixUrl: "geppetto/js/components/interface/bigImageViewer/images/",
				toolbar: "toolbarDiv",
			};

			this.state = {
				settings: $.extend(settings, this.props.settings),
				showNavigator: this.props.showNavigator,
				file: this.props.file
			};

			this.download = this.download.bind(this);
		}

		loadViewer() {
			this.state.settings.tileSources = this.state.file;
			this.state.settings.showNavigator = this.state.showNavigator;

			this.viewer = OpenSeadragon(this.state.settings);
		}
		
		download() {
			//What do we do here?
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
					<div id="toolbarDiv" style={{ position: 'absolute', top: -1, left: -1, zIndex: 999 }}>
					</div>
				</div>
			)
		}
	};
});
