define(function (require) {

	require("./HTMLViewer.less");

	var React = require('react');

	var AbstractComponent = require('../../AComponent');

	return class HTMLViewer extends AbstractComponent {

		constructor(props) {
			super(props);

			this.state = {
				content: this.props.content,
			};
		}

		setContent(content) {
			this.setState({ content });
		}

		render() {
			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} className="htmlViewer">
					<div dangerouslySetInnerHTML={{__html: this.state.content}}></div>
				</div>
			)
		}
	};
});
