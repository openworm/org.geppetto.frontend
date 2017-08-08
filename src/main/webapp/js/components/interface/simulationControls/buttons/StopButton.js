define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
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
