define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('../../../controls/mixins/Button')],

        componentDidMount: function() {
        },

        getDefaultProps: function() {
            return {
                label: 'Run',
                className: 'pull-right',
                icon: 'fa fa-cogs',
                onClick: function(){ GEPPETTO.Flows.onRun("Project.getActiveExperiment().run();"); }
            };
        }

    });
});
