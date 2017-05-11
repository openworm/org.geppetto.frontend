define(function (require) {

	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = "geppetto/js/components/interface/bigImageViewer/BigImageViewer.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react');

	var OpenSeaDragon = require('openseadragon');
	var bigImageViewerComponent = React.createClass({

		shouldComponentUpdate() {
			return false;
		},

		componentDidMount: function () {
			var viewer = OpenSeadragon({
				id: this.props.id + "_component",
				// FIXME: I have copied the images inside the images component folder. More info https://github.com/openseadragon/openseadragon/issues/792
				prefixUrl: "geppetto/js/components/interface/bigImageViewer/images/",
				tileSources: this.props.file,
				toolbar: "toolbarDiv",
				showNavigator: this.props.showNavigator
			})
		},

		render: function () {
			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} className="bigImageViewer">
					<div id="toolbarDiv" style={{position: 'absolute', top: -1, left: -1, zIndex: 999}}>
					</div>
				</div>
			)
		}
	});
	return bigImageViewerComponent;
});
