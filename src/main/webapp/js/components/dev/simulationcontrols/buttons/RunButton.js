define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('mixins/TutorialMixin'), require('mixins/Button')],

        popoverTitle: 'Run Experiment',

        onClick: function() {
            GEPPETTO.Console.executeCommand("Project.getActiveExperiment().run();");
        },

        componentDidMount: function() {
        },

        getDefaultProps: function() {
            return {
                label: 'Run',
                className: 'pull-right',
                icon: 'fa fa-cogs',
                onClick: this.onClick
            };
        }

    });
});