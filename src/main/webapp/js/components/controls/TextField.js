define(function (require, exports, module) {

	var React = require('react');

	var TextField = React.createClass({
		getInitialState: function () {
			return { value: this.props.sync_value };
		},
		handleChange: function (event) {
			this.setState({ value: event.target.value });
			this.props.handleChange(event.target.value);
		},
		handleBlur: function (event) {
			//this.setState({value: event.target.value});
			this.props.handleBlur(event.target.value);
		},
		componentWillReceiveProps: function (nextProps) {
			this.setState({
				value: nextProps.sync_value
			});
		},

		render: function () {
			var readOnly = this.props.readOnly === true;
			return (
				<input readOnly={readOnly} type="text" id={this.props.id} value={this.state.value} onChange={this.handleChange} onBlur={this.handleBlur} />
			);
		}
	});

	return TextField;
});
