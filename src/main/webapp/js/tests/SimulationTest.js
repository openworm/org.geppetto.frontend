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
		
		module("Run Script Test");
		asyncTest("Run Script Test 1", function() {
			expect(1);
			GEPPETTO.MessageSocket.clearHandlers();
			var handler = {
				onMessage: function(parsedServerMessage) {
					// Switch based on parsed incoming message type
					if(parsedServerMessage.type === GEPPETTO.GlobalHandler.MESSAGE_TYPE.RUN_SCRIPT) {
						//Simulation has been loaded and model need to be loaded
						ok(true, "Script parsed, passed");
						start();
					}
				}
			};
			GEPPETTO.MessageSocket.addHandler(handler);
			G.runScript("http://127.0.0.1:8080/" + window.BUNDLE_CONTEXT_PATH + "/assets/resources/testscript1.js");
		});

		module("Simulation Load From Content Test");
		asyncTest("Test Load Simulation from content", function() {
			expect(1);
			GEPPETTO.MessageSocket.clearHandlers();

			var handler = {
				onMessage: function(parsedServerMessage) {
					// Switch based on parsed incoming message type
					switch(parsedServerMessage.type) {
						//Simulation has been loaded and model need to be loaded
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
							ok(true, "Simulation content Loaded, passed");
							start();
							break;
					}

				}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.loadFromContent('<?xml version="1.0" encoding="UTF-8"?> <tns:simulation xmlns:tns="http://www.openworm.org/simulationSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openworm.org/simulationSchema ../../src/main/resources/schema/simulationSchema.xsd "> <tns:configuration> <tns:outputFormat>RAW</tns:outputFormat> </tns:configuration> <tns:aspects> <tns:modelInterpreter>sphModelInterpreter</tns:modelInterpreter> <tns:modelURL>https://raw.github.com/openworm/org.geppetto.samples/development/SPH/LiquidSmall/sphModel_liquid_780.xml</tns:modelURL> <tns:simulator>sphSimulator</tns:simulator> <tns:id>sph</tns:id> </tns:aspects> <tns:name>sph</tns:name> </tns:simulation>');
		});

		module("Simulation Load From URL");
		asyncTest("Test Load Simulation", function() {
			expect(1);
			GEPPETTO.MessageSocket.clearHandlers();

			var handler = {
				onMessage: function(parsedServerMessage) {

					// Switch based on parsed incoming message type
					switch(parsedServerMessage.type) {
						//Simulation has been loaded and model need to be loaded
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
							ok(true, "Simulation Loaded, passed");
							start();
							break;
					}

				}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");

		});
		
		module("Test Purkinje Cell");
		asyncTest("Tests Purkinje cell with Model Tree call and Visual Groups", function() {
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

							GEPPETTO.RuntimeTreeFactory.createRuntimeTree(scene);

							var passTimeTest = false;
							if(time < 10){
								passTimeTest = true;
							}

							equal(passTimeTest,true,  "Testing Simulation load time: " + time + " ms");
							notEqual(purkinje, null,"Entities checked");
							equal(purkinje.get('aspects').length, 1, "Aspects checked");
							equal(purkinje.get('connections').length, 0, "Connections checked");
							equal(jQuery.isEmptyObject(purkinje.electrical.VisualizationTree),false,"Test Visualization at load");
							equal(purkinje.electrical.VisualizationTree.getChildren().length, 2, "Test Visual Groups amount")
							equal(jQuery.isEmptyObject(purkinje.electrical.ModelTree),false,"Test Model tree at load");
							equal(jQuery.isEmptyObject(purkinje.electrical.SimulationTree),true,"Test Simulation tree at load");							
							purkinje.electrical.getModelTree();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_MODEL_TREE:
							var payload = JSON.parse(parsedServerMessage.data);
							var update = JSON.parse(payload.get_model_tree);

							for (var updateIndex in update){
					        	var aspectInstancePath = update[updateIndex].aspectInstancePath;
					        	var modelTree = update[updateIndex].modelTree;
					        	
					        	//create client side model tree
					        	GEPPETTO.RuntimeTreeFactory.populateAspectModelTree(aspectInstancePath, modelTree.ModelTree);				        	
								equal(jQuery.isEmptyObject(purkinje.electrical.ModelTree),false,"Test Model Tree Command");
								notEqual(purkinje.electrical.ModelTree.getInstancePath(),null,"Testing Model Tree has Instance Path");
							}     	        	
							start();

							break;
						}
					}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load('https://raw.githubusercontent.com/openworm/org.geppetto.samples/master/NeuroML/Purkinje/GEPPETTO.xml');
			initializationTime = new Date();	
		});
		
		module("Test JLems Simulation with Model Tree");
		asyncTest("Test Runtime Tree when Loading and Simulating JLems Simulation with variables", function() {
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

							GEPPETTO.RuntimeTreeFactory.createRuntimeTree(scene);

							var passTimeTest = false;
							if(time < 4){
								passTimeTest = true;
							}

							equal(passTimeTest,true,  "Testing Simulation load time: " + time + " ms");
							notEqual(hhcell, null,"Entities checked");
							equal(hhcell.get('aspects').length, 1, "Aspects checked");
							equal(jQuery.isEmptyObject(hhcell.electrical.VisualizationTree),false,"Test Visualization at load");
							equal(jQuery.isEmptyObject(hhcell.electrical.ModelTree),false,"Test Model tree at load");
							equal(jQuery.isEmptyObject(hhcell.electrical.SimulationTree),true,"Test Simulation tree at load");							

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

						case GEPPETTO.GlobalHandler.MESSAGE_TYPE.RUN_SCRIPT:
							var payload = JSON.parse(parsedServerMessage.data);
							GEPPETTO.ScriptRunner.runScript(payload.run_script);
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_STARTED:
							 this.startRequestID = parsedServerMessage.requestID;
							 break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SCENE_UPDATE:
							if(parsedServerMessage.requestID == this.startRequestID){
								if(!this.checkUpdate2){
									this.checkUpdate2 = true;

									var payload = JSON.parse(parsedServerMessage.data);
									var scene = JSON.parse(payload.update).scene;

									GEPPETTO.RuntimeTreeFactory.updateRuntimeTree(scene);
									notEqual(hhcell.electrical.SimulationTree.getChildren(), null,"Simulation tree check after udpate");
									hhcell.electrical.getModelTree();
								}
							}
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_MODEL_TREE:
							var payload = JSON.parse(parsedServerMessage.data);
							var update = JSON.parse(payload.get_model_tree);

							for (var updateIndex in update){
					        	var aspectInstancePath = update[updateIndex].aspectInstancePath;
					        	var modelTree = update[updateIndex].modelTree;
					        	
					        	//create client side model tree
					        	GEPPETTO.RuntimeTreeFactory.populateAspectModelTree(aspectInstancePath, modelTree.ModelTree);				        	
								equal(jQuery.isEmptyObject(hhcell.electrical.ModelTree),false,"Test Model Tree Command");
								notEqual(hhcell.electrical.ModelTree.getInstancePath(),null,"Testing Model Tree has Instance Path");
							}     	        	
							start();

							break;
						}
					}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load('https://raw.githubusercontent.com/openworm/org.geppetto.samples/referencing_variables/LEMS/SingleComponentHH/GEPPETTO.xml');
			initializationTime = new Date();	
		});
		
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

							GEPPETTO.RuntimeTreeFactory.createRuntimeTree(scene);

							var passTimeTest = false;
							if(time < 10){
								passTimeTest = true;
							}

							equal(passTimeTest,true, "Simulation loaded within time limit: " + time);
							notEqual(c302,null,"Entities checked");
							equal(c302.getChildren().length,300, "C302 Children checked");
							equal(c302.get('aspects').length,1, "Aspects checked");
							equal(jQuery.isEmptyObject(c302.electrical.VisualizationTree),false, "Test Visualization at load");
							equal(jQuery.isEmptyObject(c302.electrical.ModelTree),false, "Test Model tree at load");
							equal(jQuery.isEmptyObject(c302.electrical.SimulationTree),true, "Test Simulation tree at load");							
							equal(c302.ADAL_0.getConnections().length,31, "ADAL_0 connections check");
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

									GEPPETTO.RuntimeTreeFactory.updateRuntimeTree(scene);
									
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
		
		module("Test Recording Simulation");
		asyncTest("Test Recordings in Simulation Tree", function() {
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

							GEPPETTO.RuntimeTreeFactory.createRuntimeTree(scene);
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
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SET_WATCH_VARS:
							break;
						case GEPPETTO.GlobalHandler.MESSAGE_TYPE.RUN_SCRIPT:
							var payload = JSON.parse(parsedServerMessage.data);
							GEPPETTO.ScriptRunner.runScript(payload.run_script);
							break;
						case GEPPETTO.GlobalHandler.MESSAGE_TYPE.SIMULATION_OVER:
							
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SCENE_UPDATE:
							if(parsedServerMessage.requestID == this.startRequestID){
								if(!this.checkUpdate2){
									this.checkUpdate2 = true;

									var payload = JSON.parse(parsedServerMessage.data);
									var scene = JSON.parse(payload.update).scene;

									GEPPETTO.RuntimeTreeFactory.updateRuntimeTree(scene);
									
									notEqual(purkinje.electrical.SimulationTree.P.neuron0.ge,null, "Recording variable ge present");
									notEqual(purkinje.electrical.SimulationTree.P.neuron0.gi,null, "Recroding variable gi present");
									start();
								}
							}
							break;
						}
					}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load('https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/Recording/GEPPETTO.xml');
			initializationTime = new Date();	
		});
		
		module("Test SPH Simulation");
		asyncTest("Test Runtime Tree at Load and SimulationTree with variables for SPH + ModelTree", function() {
			GEPPETTO.MessageSocket.clearHandlers();
			var handler = {
					checkUpdate : false,
					startRequestID : null,
					onMessage: function(parsedServerMessage) {
						// Switch based on parsed incoming message type
						switch(parsedServerMessage.type) {
							//Simulation has been loaded and model need to be loaded
							case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
								var payload = JSON.parse(parsedServerMessage.data);
								var scene = JSON.parse(payload.update).scene;
								
					            GEPPETTO.RuntimeTreeFactory.createRuntimeTree(scene);

								notEqual(sample,null,"Entities checked");
								equal(sample.get('aspects').length,1,"Aspects checked");
								equal(jQuery.isEmptyObject(sample.fluid.VisualizationTree),false,"Test Visualization at load");
								equal(jQuery.isEmptyObject(sample.fluid.ModelTree),false,"Test Model tree at load");
								equal(jQuery.isEmptyObject(sample.fluid.SimulationTree),true, "Test Visualization tree at load");

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
								
							case GEPPETTO.GlobalHandler.MESSAGE_TYPE.RUN_SCRIPT:
								 var payload = JSON.parse(parsedServerMessage.data);
								 GEPPETTO.ScriptRunner.runScript(payload.run_script);
								 break;
							case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_STARTED:
								 this.startRequestID = parsedServerMessage.requestID;
								 
								 var payload = JSON.parse(parsedServerMessage.data);
								
								 var updatedRunTime = JSON.parse(payload.update).scene;
						            
								 GEPPETTO.RuntimeTreeFactory.updateRuntimeTree(updatedRunTime);
								 break;
							case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SCENE_UPDATE:
								if(parsedServerMessage.requestID == this.startRequestID){
									if(!this.checkUpdate){
										this.checkUpdate = true;

										var payload = JSON.parse(parsedServerMessage.data);
										var scene = JSON.parse(payload.update).scene;

										GEPPETTO.RuntimeTreeFactory.updateRuntimeTree(scene);

										notEqual(sample.fluid.SimulationTree.getChildren(),null,"Simulation tree check");
										start();
									}
								}
								break;
						}
					}
				};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load('https://raw.githubusercontent.com/openworm/org.geppetto.samples/referencing_variables/SPH/LiquidSmall/GEPPETTO.xml');
		});
		
		asyncTest("Test Simulation Selection", function() {
			//wait half a second before testing, allows for socket connection to be established
			GEPPETTO.MessageSocket.clearHandlers();

			var handler = {
				onMessage: function(parsedServerMessage) {

					// Switch based on parsed incoming message type
					switch(parsedServerMessage.type) {
						//Simulation has been started successfully
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
							Simulation.setSimulationLoaded();
							var payload = JSON.parse(parsedServerMessage.data);
							var scene = JSON.parse(payload.update).scene;

							GEPPETTO.RuntimeTreeFactory.createRuntimeTree(scene);
							
							Simulation.setOnSelectionOptions({draw_connection_lines:false});
							ok(true, "Simulation loaded, passed");
							notEqual(sample,null,"Entities checked");
							sample.select();
							equal(sample.selected,true,"Sample entity selected succesfully ");
							sample.unselect();
							equal(sample.selected,false,"Sample entity unselected succesfully ");
							Simulation.selectEntity(sample);
							var id = sample.getId();
							var selection = Simulation.getSelection();
							equal(selection[0].getId(),id, "Testing selectEntity Command");
							
							start();
							break;
					}

				}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load("https://raw.githubusercontent.com/openworm/org.geppetto.samples/master/SPH/ElasticSmall/GEPPETTO.xml");
		});

		asyncTest("Test list simulation variables no crash - SPH", function() {
			expect(2);

			GEPPETTO.MessageSocket.clearHandlers();

			var handler = {
				onMessage: function(parsedServerMessage) {

					// Switch based on parsed incoming message type
					switch(parsedServerMessage.type) {
						//Simulation has been loaded successfully
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_LOADED:
							ok(true, "Simulation loaded, passed");
							Simulation.setSimulationLoaded();
							Simulation.start();
							Simulation.listWatchableVariables();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LIST_WATCH_VARS:
							ok(true, "Variables received");
							start();
							break;
					}

				}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");
		});

		module("Watch variables test 1");
		asyncTest("Test add / get watchlists no crash - SPH", function() {
			expect(1);
			GEPPETTO.MessageSocket.clearHandlers();

			var handler = {
				onMessage: function(parsedServerMessage) {

					// Switch based on parsed incoming message type
					switch(parsedServerMessage.type) {
						//Simulation has been loaded successfully
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_LOADED:
							ok(true, "Simulation loaded, passed");
							start();
							break;
					}

				}
			};
			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");
		});

		module("Watch variables test 2");
		asyncTest("Test watch Simulation variables", function() {
			expect(1);

			GEPPETTO.MessageSocket.clearHandlers();
			var handler = {
				onMessage: function(parsedServerMessage) {

					// Switch based on parsed incoming message type
					switch(parsedServerMessage.type) {
						//Simulation has been loaded successfully
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_LOADED:
							ok(true, "Simulation loaded, passed");
							start();
							break;
					}
				}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");

		});
	};

	return {run: run};
});
