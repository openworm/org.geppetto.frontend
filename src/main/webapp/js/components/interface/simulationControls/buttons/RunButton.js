define(function (require) {

    var CreateClass = require('create-react-class'),
        GEPPETTO = require('geppetto');

    return CreateClass({
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
