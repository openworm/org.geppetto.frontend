define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('mixins/TutorialMixin'), require('mixins/Button')],

        componentDidMount: function() {
            if(GEPPETTO.tutorialEnabled) {
                GEPPETTO.once('simulation:paused', this.showPopover);
            }
        },

        getDefaultProps: function() {
            return {
                label: 'Stop',
                className: 'pull-right',
                icon:'fa fa-stop',
                onClick: function(){ GEPPETTO.Console.executeCommand("Project.getActiveExperiment().stop()"); }
            }
        }

    });
});