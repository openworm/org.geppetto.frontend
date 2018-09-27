define(function(require, exports, module) {

	var createClass = require('create-react-classes');

    var RaisedButton = createClass({
    	render: function(){
            return (
            		<input type="button" className={"waves-effect waves-light bttn"} onClick={this.props.handleClick} value={this.props.name} />
            );
        }
    });

    return RaisedButton;
});
