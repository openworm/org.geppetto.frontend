define(function (require) {

    var CreateClass = require('create-react-class'),
        GEPPETTO = require('geppetto');

    return CreateClass({
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
                        if (GEPPETTO.isKeyPressed("shift")) {
                            GEPPETTO.Flows.onPlay("Project.getActiveExperiment().play();");
                        }
                        else {
                            GEPPETTO.Flows.onPlay("Project.getActiveExperiment().playAll();");
                        }
                    }

                }
            };
        }

    });
});
