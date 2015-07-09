define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('mixins/TutorialMixin'), require('mixins/Button')],

        onClick: function() {
        	var win = window.open("/org.geppetto.frontend/dashboard/", '_blank');
        	win.focus();
        },

        componentDidMount: function() {
        },

        getDefaultProps: function() {
            return {
            	label : '',
                className: 'HomeButton pull-right',
                icon: 'fa fa-home',
                onClick: this.onClick
            };
        }

    });
});