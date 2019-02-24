define(function (require) {

    var CreateClass = require('create-react-class'),
        GEPPETTO = require('geppetto');

    return CreateClass({
        mixins: [require('../../../controls/mixins/Button')],

        componentDidMount: function() {

        },

        getDefaultProps: function() {
            return {
                label: 'Pause',
                className: 'pull-right',
                icon: 'fa fa-pause',
                onClick: function(){ GEPPETTO.CommandController.execute("Project.getActiveExperiment().pause()", true); }
            }
        }

    });
});
