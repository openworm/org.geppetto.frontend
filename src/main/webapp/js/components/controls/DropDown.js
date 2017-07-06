define(function (require, exports, module) {

	var React = require('react');

	var DropDown = React.createClass({

		getInitialState: function() {
			return {
            	items: this.props.items,
				value: this.props.sync_value
            };
		},
		componentWillReceiveProps: function(nextProps) {
  		  this.setState({
  			  items: nextProps.items,
			  value: nextProps.sync_value
  		  });
  		},

		handleChange: function (event) {
			this.setState({ value: event.target.value });
			this.props.handleChange(event.target.value);
		},
		handleBlur: function (event) {
			this.props.handleBlur(event.target.value);
		},

		render: function () {
			var itemComponents = this.state.items.map(function (item) {
				return (<option key={item.id} value={item.id}>{item.value}</option>);
			});

			return (
				<select value={this.state.value} id={this.props.id} onChange={this.handleChange}>
					{itemComponents}
				</select>

			);
		}
	});

	return DropDown;
});
