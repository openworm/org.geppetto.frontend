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
			G.runScript("http://127.0.0.1:8080/org.geppetto.frontend/resources/testscript1.js");
		});

		module("Simulation Load From Content Tests");
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

		module("Simulation Load From Content Tests 2");
		asyncTest("Test Load Simulation", function() {
			expect(1)
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
		
		module("Simulation - SPH Runtime Tree JLems");
		asyncTest("Test Runtime Tree when Loading and Simulating JLems Simulation with variables", function() {
			GEPPETTO.MessageSocket.clearHandlers();
			var handler = {
				checkUpdate : false,
				onMessage: function(parsedServerMessage) {
					// Switch based on parsed incoming message type
					switch(parsedServerMessage.type) {
						//Simulation has been loaded and model need to be loaded
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
							var payload = JSON.parse(parsedServerMessage.data);
							var scene = JSON.parse(payload.update).scene;
							var entities=0, aspects=0, subtrees = 0;
							
				            GEPPETTO.RuntimeTreeFactory.createNodes(scene);

							for(var e in scene){
								if(scene[e]._metaType == "EntityNode"){
									entities++;
									var entity = scene[e];
									for(var a in entity){
										if(entity[a]._metaType == "AspectNode"){
											aspects++;
											var aspect = entity[a];
											for(var as in aspect){
												if(aspect[as]._metaType == "AspectSubTreeNode"){
													subtrees++;
												}
											}
										}
									}
								}
							}
							ok(1, entities, "Entities number, matched");
							ok(1, aspects, "Aspects number, matched");
							ok(3, subtrees, "Subtrees number, matched");
														
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SCENE_UPDATE:
							if(!this.checkUpdate){
								var payload = JSON.parse(parsedServerMessage.data);
								var scene = JSON.parse(payload.update).scene;
								var entities=0, aspects=0, subtrees = 0, simTreePopulated=false, visTreePopulated=false;

								for(var e in scene){
									if(scene[e]._metaType == "EntityNode"){
										entities++;
										var entity = scene[e];
										for(var a in entity){
											if(entity[a]._metaType == "AspectNode"){
												aspects++;
												var aspect = entity[a];
												for(var as in aspect){
													var subtree = aspect[as];
													if(subtree._metaType == "AspectSubTreeNode"){
														if(subtree.type == "SimulationTree"){
															for(var key in subtree){
																if(typeof subtree[key] ==="object"){
																	simTreePopulated = true;
																}										
															}
														}
														else if(subtree.type == "VisualizationTree"){
															for(var key in subtree){
																if(typeof subtree[key] ==="object"){
																	visTreePopulated = true;
																}										
															}
														}
														subtrees++;
													}
												}
											}
										}
									}
								}
								notEqual(false, simTreePopulated, "Simulation Tree has population");
								notEqual(false, visTreePopulated, "Visualization has population");

					            hhcell.electrical.getModelTree();

								this.checkUpdate = true;
							}
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_MODEL_TREE:
							var payload = JSON.parse(parsedServerMessage.data);
				        	var update = JSON.parse(payload.get_model_tree);

				        	var aspectID = update.aspectID;
				        	var modelTree = update.modelTree;
				        	
				        	GEPPETTO.RuntimeTreeFactory.createAspectModelTree(aspectID, modelTree.ModelTree);        	        	

				        	notEqual(null, hhcell.electrical.ModelTree, "Model tree received, not empty");
				        	start();
				        	
							break;
					}
				}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load('https://raw.githubusercontent.com/openworm/org.geppetto.samples/master/LEMS/SingleComponentHH/GEPPETTO.xml');
			Simulation.start();
		});
		
		module("Simulation - Particle Runtime Tree");
		asyncTest("Test Runtime Tree at Load", function() {
			GEPPETTO.MessageSocket.clearHandlers();
			var handler = {
					checkUpdate : false,
					onMessage: function(parsedServerMessage) {
						// Switch based on parsed incoming message type
						switch(parsedServerMessage.type) {
							//Simulation has been loaded and model need to be loaded
							case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
								var payload = JSON.parse(parsedServerMessage.data);
								var scene = JSON.parse(payload.update).scene;
								var entities=0, aspects=0, subtrees = 0;
								
					            GEPPETTO.RuntimeTreeFactory.createNodes(scene);

								for(var e in scene){
									if(scene[e]._metaType == "EntityNode"){
										entities++;
										var entity = scene[e];
										for(var a in entity){
											if(entity[a]._metaType == "AspectNode"){
												aspects++;
												var aspect = entity[a];
												for(var as in aspect){
													if(aspect[as]._metaType == "AspectSubTreeNode"){
														subtrees++;
													}
												}
											}
										}
									}
								}
								ok(1, entities, "Entities number, matched");
								ok(1, aspects, "Aspects number, matched");
								ok(3, subtrees, "Subtrees number, matched");
															
								break;
							case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SCENE_UPDATE:
								if(!this.checkUpdate){
									var payload = JSON.parse(parsedServerMessage.data);
									var scene = JSON.parse(payload.update).scene;
									var entities=0, aspects=0, subtrees = 0, simTreePopulated=false, visTreePopulated=false;

									for(var e in scene){
										if(scene[e]._metaType == "EntityNode"){
											entities++;
											var entity = scene[e];
											for(var a in entity){
												if(entity[a]._metaType == "AspectNode"){
													aspects++;
													var aspect = entity[a];
													for(var as in aspect){
														var subtree = aspect[as];
														if(subtree._metaType == "AspectSubTreeNode"){
															if(subtree.type == "SimulationTree"){
																for(var key in subtree){
																	if(typeof subtree[key] ==="object"){
																		simTreePopulated = true;
																	}										
																}
															}
															else if(subtree.type == "VisualizationTree"){
																for(var key in subtree){
																	if(typeof subtree[key] ==="object"){
																		visTreePopulated = true;
																	}										
																}
															}
															subtrees++;
														}
													}
												}
											}
										}
									}
									notEqual(false, simTreePopulated, "Simulation Tree has population");
									notEqual(false, visTreePopulated, "Visualization has population");

						            sample.fluid.getModelTree();

									this.checkUpdate = true;
								}
								break;
							case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_MODEL_TREE:
								var payload = JSON.parse(parsedServerMessage.data);
					        	var update = JSON.parse(payload.get_model_tree);

					        	var aspectID = update.aspectID;
					        	var modelTree = update.modelTree;
					        	
					        	GEPPETTO.RuntimeTreeFactory.createAspectModelTree(aspectID, modelTree.ModelTree);        	        	

					        	ok(null, sample.fluid.ModelTree, "Model tree received, empty");
					        	start();
					        	
								break;
						}
					}
				};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load('https://raw.githubusercontent.com/openworm/org.geppetto.samples/master/SPH/LiquidSmall/GEPPETTO.xml');
			Simulation.start();
		});
		
		module("Simulation with Scripts");
		asyncTest("Test Simulation with Script", function() {
			GEPPETTO.MessageSocket.clearHandlers();
			var handler = {
				onMessage: function(parsedServerMessage) {
					// Switch based on parsed incoming message type
					switch(parsedServerMessage.type) {
						//Simulation has been loaded and model need to be loaded
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
							ok(true, "Simulation content Loaded, passed");

							//start();
							break;
						//We are not starting simulation from here, must come from associated scrip
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_STARTED:
							ok(true, "Simulation started, script read");
							start();
							break;
					}
				}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load('https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1Script.xml');
			Simulation.start();
		});

		module("Simulation controls Test");
		asyncTest("Test Simulation Controls", function() {
			//wait half a second before testing, allows for socket connection to be established
			GEPPETTO.MessageSocket.clearHandlers();

			var handler = {
				onMessage: function(parsedServerMessage) {

					// Switch based on parsed incoming message type
					switch(parsedServerMessage.type) {
						//Simulation has been started successfully
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
							Simulation.setSimulationLoaded();
							Simulation.start();
							ok(true, "Simulation loaded, passed");
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_STARTED:
							ok(true, "Simulation Started, passed");
							Simulation.pause();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_PAUSED:
							ok(true, "Simulation Paused, passed");
							Simulation.stop();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_STOPPED:
							ok(true, "Simulation Stopped, passed");
							start();
							break;
					}

				}
			};

			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");
		});

		module("Simulation controls Test 2");
		asyncTest("Test Variable Watch in Plot", function() {
			expect(4);

			GEPPETTO.MessageSocket.clearHandlers();
			var handler = {
				onMessage: function(parsedServerMessage) {

					// Switch based on parsed incoming message type
					switch(parsedServerMessage.type) {
						//Simulation has been started successfully
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
							ok(true, "Simulation loaded, passed");
							Simulation.setSimulationLoaded();
							Simulation.start();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_STARTED:
							ok(true, "Simulation Started, passed");
							GEPPETTO.G.addWidget(Widgets.PLOT);
							ok(GEPPETTO.PlotsController.getWidgets().length > 0, "Plot widget created, passed");

							var plot = GEPPETTO.PlotsController.getWidgets()[0];
							plot.hide();

							notEqual(plot.getDataSets(), null, "Plot has variable data, passed");
							start();
							break;
					}

				}
			};
			GEPPETTO.MessageSocket.addHandler(handler);
			Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");
		});

		module("Get simulation variables test");
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

		module("Watch variables test3");
		asyncTest("Test clear watch Simulation variables", function() {
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
