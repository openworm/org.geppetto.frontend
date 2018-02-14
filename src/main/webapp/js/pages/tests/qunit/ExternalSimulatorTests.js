
define(function (require) {
    var QUnit = require("qunitjs");
    require('../../../components/ComponentFactory')(GEPPETTO);
    global.GEPPETTO_CONFIGURATION = require('../../../../GeppettoConfiguration.json');
    /**
     * Calls "start()" from QUnit to start qunit tests, closes socket and clears
     * handlers. Method is called from each test.
     */
    function resetConnection() {
        //close socket
        GEPPETTO.MessageSocket.close();
        //clear message handlers, all tests within module should have performed by time method it's called
        GEPPETTO.MessageSocket.clearHandlers();
        //connect to socket again for next test
        GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/' + GEPPETTO_CONFIGURATION.contextPath + '/GeppettoServlet');
    }

    var run = function () {

        QUnit.module("Project 1 - SingleComponentHH - Not testing anything");
        QUnit.test("Tests Neuron Experiment - Not testing anything", function ( assert ) {

            assert.ok(true, "Empty test");
            /*
            var initializationTime;
            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            var time = (new Date() - initializationTime) / 1000;
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));
                            assert.equal(window.Project.getId(), 1, "Project loaded ID checked");
                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.MODEL_LOADED:
                            GEPPETTO.Manager.loadModel(payload);
                            break
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
                            var time = (new Date() - initializationTime) / 1000;
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newExperiment = GEPPETTO.Manager.loadExperiment(payload);

                            assert.equal(window.Project.getActiveExperiment().getId(), 1, "Experiment id of loaded project checked");

                            window.Project.getActiveExperiment().run();
                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_STATUS:
                            var time = (new Date() - initializationTime) / 1000;
                            var payload = JSON.parse(parsedServerMessage.data);
                            var experimentStatus = JSON.parse(payload.update);

                            var experiments = window.Project.getExperiments();
                            for (var key in experimentStatus) {
                                var projectID = experimentStatus[key].projectID;
                                var status = experimentStatus[key].status;
                                var experimentID = experimentStatus[key].experimentID;

                                //changing status in matched experiment
                                for (var e in experiments) {
                                    if (experiments[e].getId() == experimentID) {
                                        if (experiments[e].getStatus() != status) {
                                            if (window.Project.getActiveExperiment() != null || undefined) {
                                                if (window.Project.getActiveExperiment().getId() == experimentID) {
                                                    if (experiments[e].getStatus() == GEPPETTO.Resources.ExperimentStatus.RUNNING &&
                                                        status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                                                    	assert.ok(true, "project loaded");
                                                        done();
                                                        resetConnection();
                                                    }
                                                }
                                            }
                                            experiments[e].setStatus(status);
                                        }
                                    }
                                }
                            }
                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);
                            assert.ok(false, message);

                            done();
                            resetConnection();
                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;
                            assert.ok(false, message);

                            done();
                            resetConnection();
                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR_LOADING_PROJECT:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = payload.message;
                            assert.ok(false, message);

                            done();
                            resetConnection();
                            break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1", "1");
            initializationTime = new Date();
            */
        });
    };
    return {run: run};
});
