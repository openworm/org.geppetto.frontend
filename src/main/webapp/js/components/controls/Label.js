define(function(require, exports, module) {

	var CreateClass = require('create-react-classes');

    var Label = CreateClass({
	    render: function(){
	        return (
                <label htmlFor={this.props.sync_value}>{this.props.name}</label>
			);
	    }
    });

    return Label;
});
