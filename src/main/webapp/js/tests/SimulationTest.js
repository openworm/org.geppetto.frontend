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
define(function(require) {

	var run = function() {		
		
		module("Test C302 Simulation");
		asyncTest("Test C302 Network", function() {
			GEPPETTO.MessageSocket.clearHandlers();
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					onMessage: function(parsedServerMessage) {
						// Switch based on parsed incoming message type
						switch(parsedServerMessage.type) {
						//Simulation has been loaded and model need to be loaded
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							var scene = JSON.parse(payload.update).scene;

							GEPPETTO.RuntimeTreeController.createRuntimeTree(scene);

							var passTimeTest = false;
							if(time < 10){
								passTimeTest = true;
							}

							equal(passTimeTest,true, "Simulation loaded within time limit: " + time);
							notEqual(c302,null,"Entities checked");
							equal(c302.getChildren().length,300, "C302 Children checked");
							equal(c302.getAspects().length,1, "Aspects checked");
							equal(jQuery.isEmptyObject(c302.electrical.VisualizationTree),false, "Test Visualization at load");
							equal(jQuery.isEmptyObject(c302.electrical.ModelTree),false, "Test Model tree at load");
							equal(jQuery.isEmptyObject(c302.electrical.SimulationTree),false, "Test Simulation tree at load");							
							equal(c302.ADAL_0.getConnections().length,31, "ADAL_0 connections check");
							Simulation.setSimulationLoaded();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.FIRE_SIM_SCRIPTS:
							var payload = JSON.parse(parsedServerMessage.data);

							//Reads scripts received for the simulation
							var scripts = JSON.parse(payload.get_scripts).scripts;

							//make sure object isn't empty
							if(!jQuery.isEmptyObject(scripts)) {
								//run the received scripts
								GEPPETTO.ScriptRunner.fireScripts(scripts);
							}
							break;
							
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_STARTED:
							 this.startRequestID = parsedServerMessage.requestID;
							 break;
						case GEPPETTO.GlobalHandler.MESSAGE_TYPE.RUN_SCRIPT:
							var payload = JSON.parse(parsedServerMessage.data);
							GEPPETTO.ScriptRunner.runScript(payload.run_script);
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SCENE_UPDATE:
							if(parsedServerMessage.requestID == this.startRequestID){
								if(!this.checkUpdate2){
									this.checkUpdate2 = true;

									var payload = JSON.parse(parsedServerMessage.data);
									var scene = JSON.parse(payload.update).scene;

									GEPPETTO.RuntimeTreeController.updateRuntimeTree(scene);
									
									notEqual(c302.ADAL_0.electrical.SimulationTree.getChildren(),null, "ADAL_0 Simulation tree check after udpate");
									notEqual(c302.ADAR_0.electrical.SimulationTree.getChildren(),null, "ADAR_0 Simulation tree check after udpate");
									notEqual(c302.BDUR_0.electrical.SimulationTree.getChildren(),null, "BDUR_0 Simulation tree check after udpate");
									notEqual(c302.I1R_0.electrical.SimulationTree.getChildren(),null, "I1R_0 Simulation tree check after udpate");
									notEqual(c302.I2L_0.electrical.SimulationTree.getChildren(),null, "I2L_0 Simulation tree check after udpate");
									notEqual(c302.PVDR_0.electrical.SimulationTree.getChildren(),null, "PVDR_0 Simulation tree check after udpate");
									start();
								}
							}
							break;
						}
					}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load('https://raw.githubusercontent.com/openworm/org.geppetto.samples/master/LEMS/C302/GEPPETTO.xml');
			initializationTime = new Date();	
		});
	return {run: run};
});
