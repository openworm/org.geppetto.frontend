define(function(require, exports, module) {

	var React = require('react');

    var RaisedButton = React.createClass({
    	render: function(){
            return (
            		<input type="button" className={"waves-effect waves-light bttn"} onClick={this.props.handleClick} value={this.props.name} />
            );
        }
    });

    return RaisedButton;
});
