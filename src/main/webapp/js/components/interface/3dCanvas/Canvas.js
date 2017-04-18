define(function (require) {

	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = "geppetto/js/components/interface/3dCanvas/Canvas.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react');

	var THREE = require('three');
	var canvasComponent = React.createClass({

		shouldComponentUpdate() {
			return false;
		},

		componentDidMount: function () {
			//Dialog id = this.props.id 
			// Component id = this.props.id + "_component"
			$("#"+this.props.id + "_component").text('Matteo pon tus cositas aqui');
		},

		render: function () {
			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} className="canvas">
				</div>
			)
		}
	});
	return canvasComponent;
});
