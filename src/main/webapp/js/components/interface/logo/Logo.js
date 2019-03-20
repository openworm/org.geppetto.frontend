define(function (require) {

    require('./Logo.less');

    var React = require('react');
    var CreateClass = require('create-react-class');
    var GEPPETTO = require('geppetto');

    var Logo = React.createClass({
        componentDidMount: function () {
            GEPPETTO.on('spin_logo', function (label) {
            	//TODO Fix this to use state instead and not touching the dom element with jQuery
                $("#geppettologo").addClass("fa-spin").attr('title', 'Loading data');
            }.bind($("." + this.props.logo)));

            GEPPETTO.on('stop_spin_logo', function (label) {
            	$("#geppettologo").removeClass("fa-spin").attr('title', '');
            }.bind($("." + this.props.logo)));
        },

        render: function () {
            return (
                <div id={this.props.id} className={this.props.logo} style={this.props.propStyle}></div>
            );
        }
    });

    return Logo;
});
