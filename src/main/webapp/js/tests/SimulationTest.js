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
		
		module("Test Project 1 - SingleCompononetHH");
		asyncTest("Test Project 1 - SingleComponentHH", function() {
			GEPPETTO.MessageSocket.clearHandlers();
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					onMessage: function(parsedServerMessage) {
						// Switch based on parsed incoming message type
						switch(parsedServerMessage.type) {
						//Simulation has been loaded and model need to be loaded
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							 var project = JSON.parse(payload.project_loaded);
							window.Project = GEPPETTO.NodeFactory.createProjectNode(project);          
					        GEPPETTO.trigger(Events.Project_loaded);
							equal(window.Project.getId(),1, "Project ID checked");
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							var message=JSON.parse(payload.experiment_loaded);
				        	var jsonRuntimeTree = message.scene;
				        	var experimentId=message.experimentId;
				        	for(var experiment in window.Project.getExperiments())
							{
								if(window.Project.getExperiments()[experiment].getId()==experimentId)
								{
									window.Project.setActiveExperiment(window.Project.getExperiments()[experiment]);
									break;
								}
							}
				        	GEPPETTO.RuntimeTreeController.createRuntimeTree(jsonRuntimeTree);
				        	equal(window.Project.getActiveExperiment().getId(),1,
				        		"Experiment id of loaded project chekced");
							start();
				        	break;
					}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1");
			initializationTime = new Date();	
		});

		module("New experiment");
		asyncTest("New experiment", function() {
			GEPPETTO.MessageSocket.clearHandlers();
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					onMessage: function(parsedServerMessage) {
						// Switch based on parsed incoming message type
						switch(parsedServerMessage.type) {
						//Simulation has been loaded and model need to be loaded
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							var project = JSON.parse(payload.project_loaded);
							window.Project = GEPPETTO.NodeFactory.createProjectNode(project);          
							GEPPETTO.trigger(Events.Project_loaded);
							equal(window.Project.getExperiments().length,1, "Initial amount of experimetns checked");
							equal(window.Project.getId(),1, "Project loaded ID checked");
							window.Project.newExperiment();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_CREATED:
							var payload = JSON.parse(parsedServerMessage.data);
							var experiment = JSON.parse(payload.experiment_created);
							var newExperiment = GEPPETTO.NodeFactory.createExperimentNode(experiment);
							window.Project.getExperiments().push(newExperiment); 
							newExperiment.setParent(window.Project);
							equal(window.Project.getExperiments()[1].getId(),2, "New experiment ID checked");
							window.Project.getExperiments()[1].setActive();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
							if(window.Project.getExperiments().length > 1){
								var time = (new Date() - initializationTime)/1000;
								var payload = JSON.parse(parsedServerMessage.data);
								var message=JSON.parse(payload.experiment_loaded);
								var jsonRuntimeTree = message.scene;
								var experimentId=message.experimentId;
								for(var experiment in window.Project.getExperiments())
								{
									if(window.Project.getExperiments()[experiment].getId()==experimentId)
									{
										window.Project.setActiveExperiment(window.Project.getExperiments()[experiment]);
										break;
									}
								}
								GEPPETTO.RuntimeTreeController.createRuntimeTree(jsonRuntimeTree);
								equal(window.Project.getActiveExperiment().getId(),2,
								"Experiment id of loaded project chekced");
								start();
							}
							break;
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1");
			initializationTime = new Date();	
		});
		
		module("Set parameters");
		asyncTest("Set Parameters", function() {
			GEPPETTO.MessageSocket.clearHandlers();
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					onMessage: function(parsedServerMessage) {
						// Switch based on parsed incoming message type
						switch(parsedServerMessage.type) {
						//Simulation has been loaded and model need to be loaded
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							 var project = JSON.parse(payload.project_loaded);
							window.Project = GEPPETTO.NodeFactory.createProjectNode(project);          
					        GEPPETTO.trigger(Events.Project_loaded);
							equal(window.Project.getId(),1, "Project ID checked");
							window.Project.getExperiments()[1].setActive();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_CREATED:
							hhcell.electrical.getModelTree();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
							if(window.Project.getExperiments().length > 1){
								var time = (new Date() - initializationTime)/1000;
								var payload = JSON.parse(parsedServerMessage.data);
								var message=JSON.parse(payload.experiment_loaded);
								var jsonRuntimeTree = message.scene;
								var experimentId=message.experimentId;
								for(var experiment in window.Project.getExperiments())
								{
									if(window.Project.getExperiments()[experiment].getId()==experimentId)
									{
										window.Project.setActiveExperiment(window.Project.getExperiments()[experiment]);
										break;
									}
								}
								GEPPETTO.RuntimeTreeController.createRuntimeTree(jsonRuntimeTree);
								equal(window.Project.getActiveExperiment().getId(),2,
								"Experiment id of loaded project chekced");
								hhcell.electrical.getModelTree();
							}
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_MODEL_TREE:
							var payload = JSON.parse(parsedServerMessage.data);
							var update = JSON.parse(payload.get_model_tree);      
							for (var updateIndex in update){
								var aspectInstancePath = update[updateIndex].aspectInstancePath;
								var modelTree = update[updateIndex].ModelTree;

								//create client side model tree
								GEPPETTO.RuntimeTreeController.populateAspectModelTree(aspectInstancePath, modelTree);
								equal(hhcell.electrical.ModelTree.Network.hhpop.Cell.bioPhys1.MembraneProperties.naChans.PassiveConductanceDensity.getValue(),
									120, "Testing original parameter value");
								hhcell.electrical.ModelTree.Network.hhpop.Cell.bioPhys1.MembraneProperties.naChans.PassiveConductanceDensity.setValue(13);
							}
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.UPDATE_MODEL_TREE:
							start();
							break;
						}
					}
			};

			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1");
			initializationTime = new Date();	
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
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
						var time = (new Date() - initializationTime)/1000;
						var payload = JSON.parse(parsedServerMessage.data);
						var project = JSON.parse(payload.project_loaded);
						window.Project = GEPPETTO.NodeFactory.createProjectNode(project);          
						GEPPETTO.trigger(Events.Project_loaded);
						equal(window.Project.getExperiments().length,1, "Initial amount of experimetns checked");
						equal(window.Project.getId(),7, "Project loaded ID checked");
						window.Project.getExperiments()[0].setActive();
						break;
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
						var time = (new Date() - initializationTime)/1000;
						var payload = JSON.parse(parsedServerMessage.data);
						var message=JSON.parse(payload.experiment_loaded);
			        	var jsonRuntimeTree = message.scene;
			        	var experimentId=message.experimentId;
			        	for(var experiment in window.Project.getExperiments())
						{
							if(window.Project.getExperiments()[experiment].getId()==experimentId)
							{
								window.Project.setActiveExperiment(window.Project.getExperiments()[experiment]);
								break;
							}
						}
			        	GEPPETTO.RuntimeTreeController.createRuntimeTree(jsonRuntimeTree);
			        	equal(window.Project.getActiveExperiment().getId(),1,
			        		"Experiment id of loaded project chekced");
			        	
						
						var passTimeTest = false;
						if(time < 10){
							passTimeTest = true;
						}
						
						equal(passTimeTest,true,  "Testing Simulation load time: " + time + " ms");
						notEqual(purkinje, null,"Entities checked");
						equal(purkinje.getAspects().length, 1, "Aspects checked");
						equal(purkinje.getConnections().length, 0, "Connections checked");
						equal(jQuery.isEmptyObject(purkinje.electrical.VisualizationTree),false,"Test Visualization at load");
						equal(purkinje.electrical.VisualizationTree.getChildren().length, 2, "Test Visual Groups amount")
						equal(jQuery.isEmptyObject(purkinje.electrical.ModelTree),false,"Test Model tree at load");
						equal(jQuery.isEmptyObject(purkinje.electrical.SimulationTree),false,"Test Simulation tree at load");							
						purkinje.electrical.getModelTree();
			        	break;
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_MODEL_TREE:
						var payload = JSON.parse(parsedServerMessage.data);
						var update = JSON.parse(payload.get_model_tree);      
						for (var updateIndex in update){
							var aspectInstancePath = update[updateIndex].aspectInstancePath;
							var modelTree = update[updateIndex].ModelTree;

							//create client side model tree
							GEPPETTO.RuntimeTreeController.populateAspectModelTree(aspectInstancePath, modelTree);
							equal(jQuery.isEmptyObject(purkinje.electrical.ModelTree),false,"Test Model Tree Command");
							notEqual(purkinje.electrical.ModelTree.getInstancePath(),null,"Testing Model Tree has Instance Path");
						}

						equal(window.Project.getActiveExperiment().getId(),1,"Active experiment id  chekced");  	        	
						start();
						break;
					}
				}
		};
		GEPPETTO.MessageSocket.clearHandlers();
		GEPPETTO.MessageSocket.addHandler(handler);
		window.Project.loadFromID("7");
		initializationTime = new Date();	
	});
	
//	module("Test Primary Auditory Cortex Network (ACNET2)");
//	asyncTest("Tests Primary Auditory Cortex Network [Medium Net] with Model Tree call and Visual Groups", function() {
//		GEPPETTO.MessageSocket.clearHandlers();
//		var initializationTime;
//		var handler = {
//				checkUpdate2 : false,
//				startRequestID : null,
//				onMessage: function(parsedServerMessage) {
//					// Switch based on parsed incoming message type
//					switch(parsedServerMessage.type) {
//					//Simulation has been loaded and model need to be loaded
//					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
//						var time = (new Date() - initializationTime)/1000;
//						var payload = JSON.parse(parsedServerMessage.data);
//						var scene = JSON.parse(payload.update).scene;
//
//						GEPPETTO.RuntimeTreeController.createRuntimeTree(scene);
//
//						var passTimeTest = false;
//						if(time < 10){
//							passTimeTest = true;
//						}
//
//						equal(passTimeTest,true,  "Testing Simulation load time: " + time + " ms");
//						notEqual(acnet2, null,"Entities checked");
//						equal(acnet2.getAspects().length, 1, "Aspects checked");
//						equal(acnet2.baskets_12_9.getConnections().length, 60, "Connections checked");
//						equal(jQuery.isEmptyObject(acnet2.electrical.VisualizationTree),false,"Test Visualization at load");
//						equal(acnet2.electrical.VisualizationTree.getChildren().length, 1, "Test Visual Groups amount")
//						equal(jQuery.isEmptyObject(acnet2.electrical.ModelTree),false,"Test Model tree at load");
//						equal(jQuery.isEmptyObject(acnet2.electrical.SimulationTree),false,"Test Simulation tree at load");							
//						acnet2.electrical.getModelTree();
//						Simulation.setSimulationLoaded();
//						break;
//					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_MODEL_TREE:
//						var payload = JSON.parse(parsedServerMessage.data);
//						var update = JSON.parse(payload.get_model_tree);
//
//						for (var updateIndex in update){
//				        	var aspectInstancePath = update[updateIndex].aspectInstancePath;
//				        	var modelTree = update[updateIndex].modelTree;
//				        	
//				        	//create client side model tree
//				        	GEPPETTO.RuntimeTreeController.populateAspectModelTree(aspectInstancePath, modelTree.ModelTree);				        	
//							equal(jQuery.isEmptyObject(acnet2.electrical.ModelTree),false,"Test Model Tree Command");
//							notEqual(acnet2.electrical.ModelTree.getInstancePath(),null,"Testing Model Tree has Instance Path");
//						}     	        	
//						start();
//
//						break;
//					}
//				}
//		};
//
//		GEPPETTO.MessageSocket.addHandler(handler);
//		Simulation.loadFromContent('<?xml version="1.0" encoding="UTF-8"?> <tns:simulation xmlns:tns="http://www.openworm.org/simulationSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="../../main/resources/schema/simulationSchema.xsd"> <tns:entity> <tns:id>acnet2</tns:id> <tns:aspect> <tns:id>electrical</tns:id> <tns:simulator> <tns:simulatorId>neuroMLSimulator</tns:simulatorId> </tns:simulator> <tns:model> <tns:modelInterpreterId>neuroMLModelInterpreter</tns:modelInterpreterId> <tns:modelURL>https://raw.githubusercontent.com/OpenSourceBrain/ACnet2/master/neuroConstruct/generatedNeuroML2/MediumNet.net.nml</tns:modelURL> </tns:model> </tns:aspect> </tns:entity> </tns:simulation>')
//		
//		initializationTime = new Date();	
//	});
//	
//	module("Test Primary Auditory Cortex Network (Two Cells)");
//	asyncTest("Tests Primary Auditory Cortex Network [Two Cells] with Model Tree call and Visual Groups", function() {
//		GEPPETTO.MessageSocket.clearHandlers();
//		var initializationTime;
//		var handler = {
//				checkUpdate2 : false,
//				startRequestID : null,
//				onMessage: function(parsedServerMessage) {
//					// Switch based on parsed incoming message type
//					switch(parsedServerMessage.type) {
//					//Simulation has been loaded and model need to be loaded
//					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
//						var time = (new Date() - initializationTime)/1000;
//						var payload = JSON.parse(parsedServerMessage.data);
//						var scene = JSON.parse(payload.update).scene;
//
//						GEPPETTO.RuntimeTreeController.createRuntimeTree(scene);
//
//						var passTimeTest = false;
//						if(time < 10){
//							passTimeTest = true;
//						}
//
//						equal(passTimeTest,true,  "Testing Simulation load time: " + time + " ms");
//						notEqual(acnet22Cells, null,"Entities checked");
//						equal(acnet22Cells.getAspects().length, 1, "Aspects checked");
//						equal(acnet22Cells.baskets_0.getConnections().length, 0, "Connections checked");
//						equal(jQuery.isEmptyObject(acnet22Cells.electrical.VisualizationTree),false,"Test Visualization at load");
//						equal(acnet22Cells.electrical.VisualizationTree.getChildren().length, 0, "Test Visual Groups amount")
//						equal(jQuery.isEmptyObject(acnet22Cells.electrical.ModelTree),false,"Test Model tree at load");
//						equal(jQuery.isEmptyObject(acnet22Cells.electrical.SimulationTree),false,"Test Simulation tree at load");							
//						acnet22Cells.electrical.getModelTree();
//						Simulation.setSimulationLoaded();
//						break;
//					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_MODEL_TREE:
//						var payload = JSON.parse(parsedServerMessage.data);
//						var update = JSON.parse(payload.get_model_tree);
//
//						for (var updateIndex in update){
//				        	var aspectInstancePath = update[updateIndex].aspectInstancePath;
//				        	var modelTree = update[updateIndex].modelTree;
//				        	
//				        	//create client side model tree
//				        	GEPPETTO.RuntimeTreeController.populateAspectModelTree(aspectInstancePath, modelTree.ModelTree);				        	
//							equal(jQuery.isEmptyObject(acnet22Cells.electrical.ModelTree),false,"Test Model Tree Command");
//							notEqual(acnet22Cells.electrical.ModelTree.getInstancePath(),null,"Testing Model Tree has Instance Path");
//						}     	        	
//						start();
//
//						break;
//					}
//				}
//		};
//
//		GEPPETTO.MessageSocket.addHandler(handler);
//		Simulation.loadFromContent('<?xml version="1.0" encoding="UTF-8"?> <tns:simulation xmlns:tns="http://www.openworm.org/simulationSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="../../main/resources/schema/simulationSchema.xsd"> <tns:entity> <tns:id>acnet22Cells</tns:id> <tns:aspect> <tns:id>electrical</tns:id> <tns:simulator> <tns:simulatorId>jLemsSimulator</tns:simulatorId> </tns:simulator> <tns:model> <tns:modelInterpreterId>lemsModelInterpreter</tns:modelInterpreterId> <tns:modelURL>https://raw.githubusercontent.com/OpenSourceBrain/ACnet2/master/neuroConstruct/generatedNeuroML2/LEMS_TwoCell.xml</tns:modelURL> </tns:model> </tns:aspect> </tns:entity>  </tns:simulation>')
//		
//		initializationTime = new Date();	
//	});
//	
//	module("Test SPH Simulation");
//	asyncTest("Test Runtime Tree at Load and SimulationTree with variables for SPH + ModelTree", function() {
//		GEPPETTO.MessageSocket.clearHandlers();
//		var handler = {
//				checkUpdate : false,
//				startRequestID : null,
//				onMessage: function(parsedServerMessage) {
//					// Switch based on parsed incoming message type
//					switch(parsedServerMessage.type) {
//						//Simulation has been loaded and model need to be loaded
//						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
//							var payload = JSON.parse(parsedServerMessage.data);
//							var scene = JSON.parse(payload.update).scene;
//							
//				            GEPPETTO.RuntimeTreeController.createRuntimeTree(scene);
//
//							notEqual(sample,null,"Entities checked");
//							equal(sample.getAspects().length,1,"Aspects checked");
//							equal(jQuery.isEmptyObject(sample.fluid.VisualizationTree),false,"Test Visualization at load");
//							equal(jQuery.isEmptyObject(sample.fluid.ModelTree),false,"Test Model tree at load");
//							equal(jQuery.isEmptyObject(sample.fluid.SimulationTree),false, "Test Simulation tree at load");
//							Simulation.setSimulationLoaded();
//							break;
//						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.FIRE_SIM_SCRIPTS:
//							var payload = JSON.parse(parsedServerMessage.data);
//
//							//Reads scripts received for the simulation
//							var scripts = JSON.parse(payload.get_scripts).scripts;
//
//							//make sure object isn't empty
//							if(!jQuery.isEmptyObject(scripts)) {
//								//run the received scripts
//								GEPPETTO.ScriptRunner.fireScripts(scripts);
//							}
//							break;
//							
//						case GEPPETTO.GlobalHandler.MESSAGE_TYPE.RUN_SCRIPT:
//							 var payload = JSON.parse(parsedServerMessage.data);
//							 GEPPETTO.ScriptRunner.runScript(payload.run_script);
//							 break;
//						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_STARTED:
//							 this.startRequestID = parsedServerMessage.requestID;
//							 
//							 var payload = JSON.parse(parsedServerMessage.data);
//							
//							 var updatedRunTime = JSON.parse(payload.update).scene;
//					            
//							 GEPPETTO.RuntimeTreeController.updateRuntimeTree(updatedRunTime);
//							 break;
//						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SCENE_UPDATE:
//							if(parsedServerMessage.requestID == this.startRequestID){
//								if(!this.checkUpdate){
//									this.checkUpdate = true;
//
//									var payload = JSON.parse(parsedServerMessage.data);
//									var scene = JSON.parse(payload.update).scene;
//
//									GEPPETTO.RuntimeTreeController.updateRuntimeTree(scene);
//
//									notEqual(sample.fluid.SimulationTree.getChildren(),null,"Simulation tree check");
//									start();
//								}
//							}
//							break;
//					}
//				}
//			};
//
//		GEPPETTO.MessageSocket.addHandler(handler);
//		Simulation.load('https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/SPH/LiquidSmall/GEPPETTO.xml');
//	});
//	
//	asyncTest("Test Simulation Selection", function() {
//		//wait half a second before testing, allows for socket connection to be established
//		GEPPETTO.MessageSocket.clearHandlers();
//
//		var handler = {
//			onMessage: function(parsedServerMessage) {
//
//				// Switch based on parsed incoming message type
//				switch(parsedServerMessage.type) {
//					//Simulation has been started successfully
//					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
//						Simulation.setSimulationLoaded();
//						var payload = JSON.parse(parsedServerMessage.data);
//						var scene = JSON.parse(payload.update).scene;
//
//						GEPPETTO.RuntimeTreeController.createRuntimeTree(scene);
//						
//						Simulation.setOnSelectionOptions({draw_connection_lines:false});
//						ok(true, "Simulation loaded, passed");
//						notEqual(sample,null,"Entities checked");
//						sample.select();
//						equal(sample.selected,true,"Sample entity selected succesfully ");
//						sample.unselect();
//						equal(sample.selected,false,"Sample entity unselected succesfully ");
//						Simulation.selectEntity(sample);
//						var id = sample.getId();
//						var selection = Simulation.getSelection();
//						equal(selection[0].getId(),id, "Testing selectEntity Command");
//						
//						start();
//						break;
//				}
//
//			}
//		};
//
//		GEPPETTO.MessageSocket.addHandler(handler);
//		Simulation.load("https://raw.githubusercontent.com/openworm/org.geppetto.samples/master/SPH/ElasticSmall/GEPPETTO.xml");
//	});
//
//	module("Watch variables test 1");
//	asyncTest("Test add / get watchlists no crash - SPH", function() {
//		expect(1);
//		GEPPETTO.MessageSocket.clearHandlers();
//
//		var handler = {
//			onMessage: function(parsedServerMessage) {
//
//				// Switch based on parsed incoming message type
//				switch(parsedServerMessage.type) {
//					//Simulation has been loaded successfully
//					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_LOADED:
//						ok(true, "Simulation loaded, passed");
//						start();
//						break;
//				}
//
//			}
//		};
//		GEPPETTO.MessageSocket.addHandler(handler);
//		Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");
//	});
//
//	module("Watch variables test 2");
//	asyncTest("Test watch Simulation variables", function() {
//		expect(1);
//
//		GEPPETTO.MessageSocket.clearHandlers();
//		var handler = {
//			onMessage: function(parsedServerMessage) {
//
//				// Switch based on parsed incoming message type
//				switch(parsedServerMessage.type) {
//					//Simulation has been loaded successfully
//					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_LOADED:
//						ok(true, "Simulation loaded, passed");
//						start();
//						break;
//				}
//			}
//		};
//
//		GEPPETTO.MessageSocket.addHandler(handler);
//		Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");
//
//	});
};
	return {run: run};
});
