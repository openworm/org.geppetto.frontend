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
/**
 * 
 */
define(function(require) {

	/**
	 * Calls "start()" from QUnit to start qunit tests, closes socket and clears
	 * handlers. Method is called from each test.
	 */
	function launch(){
		//start qunit tests
		start();
		//close socket
		GEPPETTO.MessageSocket.close();
		//clear message handlers, all tests within module should have performed by time method it's called
		GEPPETTO.MessageSocket.clearHandlers();
		//connect to socket again for next test
		GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/'+ window.BUNDLE_CONTEXT_PATH +'/GeppettoServlet');
	}
	var run = function() {		

		module("Test SPH Simulation");
		asyncTest("Test Runtime Tree at Load and SimulationTree with variables for SPH + ModelTree", function() {
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					onMessage: function(parsedServerMessage) {
						// Switch based on parsed incoming message type
						switch(parsedServerMessage.type) {
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
							var time = (new Date() - initializationTime)/1000;
							GEPPETTO.SimulationHandler.loadProject(JSON.parse(parsedServerMessage.data));
							equal(window.Project.getExperiments().length,1, "Initial amount of experimetns checked");
							equal(window.Project.getId(),10, "Project loaded ID checked");
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							GEPPETTO.SimulationHandler.loadExperiment(payload);
							equal(window.Project.getActiveExperiment().getId(),1,
							"Experiment id of loaded project chekced");

							var passTimeTest = false;
							if(time < 10){
								passTimeTest = true;
							}
							equal(passTimeTest,true,  "Testing Simulation load time: " + time + " ms");
							notEqual(sample,null,"Entities checked");
							equal(sample.getAspects().length,1,"Aspects checked");
							equal(jQuery.isEmptyObject(sample.fluid.VisualizationTree),false,"Test Visualization at load");
							equal(jQuery.isEmptyObject(sample.fluid.ModelTree),false,"Test Model tree at load");
							equal(jQuery.isEmptyObject(sample.fluid.SimulationTree),false, "Test Simulation tree at load");
							launch();
							break;
						case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
							var payload = JSON.parse(parsedServerMessage.data);
							var message = JSON.parse(payload.message);
				            ok(false,message);
							launch();
							break;
						case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
							var payload = JSON.parse(parsedServerMessage.data);
							var message = JSON.parse(payload.message).message;
							ok(false,message);
							launch();
							break;
						case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR_LOADING_PROJECT:
							var payload = JSON.parse(parsedServerMessage.data);
							var message = payload.message;
							ok(false,message);
							launch();
							break;
						}
					}
			};
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("10","1");		
			initializationTime = new Date();	
		});
};
	return {run: run};
});
