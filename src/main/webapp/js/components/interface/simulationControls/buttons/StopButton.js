define(function (require) {

    var CreateClass = require('create-react-class'),
        GEPPETTO = require('geppetto');

    return CreateClass({
        mixins: [require('../../../controls/mixins/Button')],

        componentDidMount: function() {

        },

        getDefaultProps: function() {
            return {
                label: 'Stop',
                className: 'pull-right',
                icon:'fa fa-stop',
                onClick: function(){ GEPPETTO.CommandController.execute("Project.getActiveExperiment().stop()", true); }
            }
        }

    });
});
