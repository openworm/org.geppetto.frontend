define(function(require, exports, module) {

	var createClass = require('create-react-class');

    var Label = createClass({
	    render: function(){
	        return (
                <label htmlFor={this.props.sync_value}>{this.props.name}</label>
			);
	    }
    });

    return Label;
});
