define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
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
