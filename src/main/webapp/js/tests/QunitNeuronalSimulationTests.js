/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/
define(function (require) {

    /**
     * Calls "start()" from QUnit to start qunit tests, closes socket and clears
     * handlers. Method is called from each test.
     */
    function launch() {
        //start qunit tests
        start();
        //close socket
        GEPPETTO.MessageSocket.close();
        //clear message handlers, all tests within module should have performed by time method it's called
        GEPPETTO.MessageSocket.clearHandlers();
        //connect to socket again for next test
        GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/' + window.BUNDLE_CONTEXT_PATH + '/GeppettoServlet');
    }

    var run = function () {

        module("Test Project 1 - Neuronal External", {
            setup: function () {
                GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/' + window.BUNDLE_CONTEXT_PATH + '/GeppettoServlet');
            }
        });
        asyncTest("Test Project 1 - SingleComponentHH", function () {
            GEPPETTO.MessageSocket.clearHandlers();
            var initializationTime;
            var handler = {
                //flag use to keep track of when to check status
                checkStatus: true,
                startRequestID: null,
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            var time = (new Date() - initializationTime) / 1000;
                            GEPPETTO.SimulationHandler.loadProject(JSON.parse(parsedServerMessage.data));
                            equal(window.Project.getId(), 1, "Project ID checked");
                            break;
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            GEPPETTO.SimulationHandler.loadExperiment(payload);
                            equal(window.Project.getActiveExperiment().getId(), 1, "Active experiment id of loaded project checked");
                            if (Project.getActiveExperiment().getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                                ok(false, "Experiment already completed, can't test run");
                                launch();
                            }
                            else if (Project.getActiveExperiment().getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN) {
                                Project.getActiveExperiment().run();
                                this.checkStatus = false;
                            }
                            else {
                                ok(false,
                                    "Can't run Experiment and test it due to status being: " + Project.getActiveExperiment().getStatus());
                                launch();
                            }
                            break;
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_STATUS:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var experimentStatus = JSON.parse(payload.update);

                            var experiments = window.Project.getExperiments();
                            for (var key in experimentStatus) {
                                var projectID = experimentStatus[key].projectID;
                                var status = experimentStatus[key].status;
                                var experimentID = experimentStatus[key].experimentID;

                                if (!this.checkStatus) {
                                    if (status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                                        if (experimentID == 1) {
                                            equal(experimentID, 1, "Running active experiment completed succesfully.");
                                            window.Project.getActiveExperiment().setStatus(status);
                                            this.checkStatus = true;
                                            Project.getActiveExperiment().play({step: 1});
                                        }
                                    }
                                }
                            }
                            break;
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PLAY_EXPERIMENT:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var timeSeries =
                                hhcell.electrical.SimulationTree.hhpop[0].bioPhys1.membraneProperties.naChans.na.h.q.getTimeSeries();
                            GEPPETTO.SimulationHandler.playExperiment(payload);
                            timeSeries =
                                hhcell.electrical.SimulationTree.hhpop[0].bioPhys1.membraneProperties.naChans.na.h.q.getTimeSeries();
                            equal(timeSeries.length, 6001, "Checking time series after running and playing of experiment");
                            launch();
                            break;
                    }
                }
            };
            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1", "1");
            initializationTime = new Date();
        });
    };
    return {run: run};
});
