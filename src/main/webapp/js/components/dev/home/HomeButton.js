define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('mixins/TutorialMixin'), require('mixins/Button')],

        componentDidMount: function() {
        },

        getDefaultProps: function() {
            return {
            	label : '',
                className: 'HomeButton pull-right',
                icon: 'fa fa-home',
                onClick: function() {
                    var targetWindow = '_blank';
                    if(window.EMBEDDED) {
                        targetWindow = '_self';
                    }
                    var win = window.open("./", targetWindow);
                    win.focus();
                }
            };
        }

    });
});