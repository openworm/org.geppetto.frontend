define(function(require, exports, module) {

	var React = require('react');

    var Label = React.createClass({
	    render: function(){
	        return (
                <label htmlFor={this.props.sync_value}>{this.props.name}</label>
			);
	    }
    });

    return Label;
});
