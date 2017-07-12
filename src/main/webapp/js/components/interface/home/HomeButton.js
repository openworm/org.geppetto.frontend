define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('../../controls/mixins/Button')],

        componentDidMount: function() {
        },

        getDefaultProps: function() {
            return {
            	label : '',
                className: 'HomeButton pull-right',
                icon: 'fa fa-home',
                onClick: function() {
                    var targetWindow = '_blank';
                    if(GEPPETTO_CONFIGURATION.embedded) {
                        targetWindow = '_self';
                    }
                    var win = window.open("./", targetWindow);
                    win.focus();
                }
            };
        }

    });
});
