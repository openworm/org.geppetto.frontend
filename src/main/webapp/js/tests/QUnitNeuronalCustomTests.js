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
	var utils = require('../components/utils');
	var tests = [];
	//http://127.0.0.1:8080/org.geppetto.frontend/GeppettoNeuronalCustomTests.html?urlString=http%3A%2F%2F127.0.0.1%3A3000%2Fgeppetto%2Ftmp%2FtestFile
	
    /**
     * Closes socket and clears handlers. Method is called from each test.
     */
    function resetConnection() {
        //close socket
        GEPPETTO.MessageSocket.close();
        //clear message handlers, all tests within module should have performed by time method it's called
        GEPPETTO.MessageSocket.clearHandlers();
        //connect to socket again for next test
        GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/' + window.BUNDLE_CONTEXT_PATH + '/GeppettoServlet');
       
    }
    
    function readTextFile(file)
    {
    	 var rawFile = new XMLHttpRequest();
    	    rawFile.open("GET", file, false);
    	    rawFile.onreadystatechange = function ()
    	    {
    	        if(rawFile.readyState === 4)
    	        {
    	            if(rawFile.status === 200 || rawFile.status == 0)
    	            {
    	                tests  = JSON.parse(rawFile.responseText);
    	                // once off on the first test to establish connection
    	                resetConnection();
    	                addTests();
    	            }
    	        }
    	    };
    	    rawFile.send(null);
    }
    
    function addTests(){
    	var testModules = tests["testModules"];
    	for (var moduleIndex in testModules){
    		var testModule = testModules[moduleIndex];
    		
    		QUnit.module("Project " + testModule["name"] + " - " + testModule["description"]);
    		
    		var testModels = testModule["testModels"];
    		for (var modelIndex in testModels){
    			
    			var testModel = testModels[modelIndex];
    			QUnit.test("Test Model " + testModel["name"] + " - " + testModel["url"], function ( assert ) {

    	            var done = assert.async();
    	            var handler = {
    	                onMessage: function (parsedServerMessage) {
    	                    // Switch based on parsed incoming message type
    	                    switch (parsedServerMessage.type) {
    	                        //Simulation has been loaded and model need to be loaded
    	                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
    	                            GEPPETTO.SimulationHandler.loadProject(JSON.parse(parsedServerMessage.data));
//    	                            assert.equal(window.Project.getId(), 1, "Project ID checked");
    	                            assert.ok(window.Project.getId() != undefined, "Project id is not undefined"); 
    	                            break;
    	                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.MODEL_LOADED:
    	                            GEPPETTO.SimulationHandler.loadModel(JSON.parse(parsedServerMessage.data));

    	                            // test that geppetto model high level is as expected
    	                            assert.ok(window.Model != undefined, "Model is not undefined");
//    	                            assert.ok(window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
//    	                                      window.Model.getVariables()[0].getId() == 'hhcell' && window.Model.getVariables()[1].getId() == 'time',  "2 Variables as expected");
//    	                            assert.ok(window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2, "2 Libraries as expected");
//    	                            // test that instance tree high level is as expected
//    	                            assert.ok(window.Instances != undefined && window.Instances.length == 1 && window.Instances[0].getId() == 'hhcell', "1 top level instance as expected");

    	                            break;
    	                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
    	                            var payload = JSON.parse(parsedServerMessage.data);
    	                            GEPPETTO.SimulationHandler.loadExperiment(payload);
    	                            assert.equal(window.Project.getActiveExperiment().getId(), 1, "Active experiment id of loaded project checked");

    	                            done();
    	                            resetConnection();
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
    	            window.Project.loadFromURL(testModel["url"]);
    	        });
    		}
    	}
    }

    var run = function () {
    	
    	//"http://127.0.0.1:3000/geppetto/tmp/testFile");
    	readTextFile("geppettotestingprojects?url=" + utils.getQueryStringParameter('url'));
        
    };
    
    return {run: run};
});
