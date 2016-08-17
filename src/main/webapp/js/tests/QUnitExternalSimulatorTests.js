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
    function resetConnection() {
        //close socket
        GEPPETTO.MessageSocket.close();
        //clear message handlers, all tests within module should have performed by time method it's called
        GEPPETTO.MessageSocket.clearHandlers();
        //connect to socket again for next test
        GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/' + window.BUNDLE_CONTEXT_PATH + '/GeppettoServlet');
    }

    var run = function () {

        QUnit.module("Project 1 - SingleComponentHH");
        QUnit.test("Tests Neuron Experiment", function ( assert ) {

            var done = assert.async();

            var initializationTime;
            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            var time = (new Date() - initializationTime) / 1000;
                            GEPPETTO.SimulationHandler.loadProject(JSON.parse(parsedServerMessage.data));
                            assert.equal(window.Project.getId(), 1, "Project loaded ID checked");
                            break;
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
                            var time = (new Date() - initializationTime) / 1000;
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newExperiment = GEPPETTO.SimulationHandler.loadExperiment(payload);

                            assert.equal(window.Project.getActiveExperiment().getId(), 1, "Experiment id of loaded project checked");

                            window.Project.getActiveExperiment().run();
                            break;
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_STATUS:
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
        });
    };
    return {run: run};
});
