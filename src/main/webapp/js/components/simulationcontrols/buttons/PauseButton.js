define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('mixins/TutorialMixin'), require('mixins/Button')],

        onClick: function() {
            GEPPETTO.Simulation.pause();
        },

        componentDidMount: function() {
            if(GEPPETTO.tutorialEnabled) {
                GEPPETTO.once('simulation:started', this.showPopover);
            }
        },

        getDefaultProps: function() {
            return {
                label: 'Pause',
                className: 'pull-right',
                icon: 'icon-pause',
                onClick: this.onClick
            }
        }

    });
});