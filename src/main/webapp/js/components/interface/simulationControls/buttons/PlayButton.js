define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('../../../controls/mixins/Button')],

        componentDidMount: function () {

        },

        getDefaultProps: function () {
            return {
                label: 'Play',
                className: 'pull-right',
                icon: 'fa fa-play',
                onClick: function () {

                    if (GEPPETTO.ExperimentsController.isPaused()) {
                        GEPPETTO.CommandController.execute("Project.getActiveExperiment().resume();");
                    }
                    else {
                        GEPPETTO.Flows.onPlay("Project.getActiveExperiment().play();");
                    }

                }
            };
        }

    });
});
