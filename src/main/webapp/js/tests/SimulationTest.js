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
							equal(window.Project.getActiveExperiment().getId(),1,"Active experiment id of loaded project checked");
							start();
							break;
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1", "1");
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
								"Experiment id of loaded project checked");
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
							}

							equal(jQuery.isEmptyObject(purkinje.electrical.ModelTree),false,"Test Model Tree Command");
							notEqual(purkinje.electrical.ModelTree.getInstancePath(),null,"Testing Model Tree has Instance Path");
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
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							var project = JSON.parse(payload.project_loaded);
							window.Project = GEPPETTO.NodeFactory.createProjectNode(project);          
							GEPPETTO.trigger(Events.Project_loaded);
							equal(window.Project.getExperiments().length,1, "Initial amount of experimetns checked");
							equal(window.Project.getId(),6, "Project loaded ID checked");
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

							equal(passTimeTest,true, "Simulation loaded within time limit: " + time);
							notEqual(c302,null,"Entities checked");
							equal(c302.getChildren().length,300, "C302 Children checked");
							equal(c302.getAspects().length,1, "Aspects checked");
							equal(jQuery.isEmptyObject(c302.electrical.VisualizationTree),false, "Test Visualization at load");
							equal(jQuery.isEmptyObject(c302.electrical.ModelTree),false, "Test Model tree at load");
							equal(jQuery.isEmptyObject(c302.electrical.SimulationTree),false, "Test Simulation tree at load");							
							equal(c302.ADAL_0.getConnections().length,31, "ADAL_0 connections check");
							start();
							break;
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("6");
			initializationTime = new Date();	
		});

		module("Test Primary Auditory Cortex Network (ACNET2)");
		asyncTest("Tests Primary Auditory Cortex Network [Medium Net] with Model Tree call and Visual Groups", function() {
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
							notEqual(net, null,"Entities checked");
							equal(net.getAspects().length, 1, "Aspects checked");
							equal(jQuery.isEmptyObject(net.electrical.VisualizationTree),false,"Test Visualization at load");
							equal(net.electrical.VisualizationTree.getChildren().length, 1, "Test Visual Groups amount")
							equal(jQuery.isEmptyObject(net.electrical.ModelTree),false,"Test Model tree at load");
							equal(jQuery.isEmptyObject(net.electrical.SimulationTree),false,"Test Simulation tree at load");							
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
		
		asyncTest("Tests CElegansNeuroML [Adal Cell] with Model Tree call and Visual Groups", function() {
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
							equal(window.Project.getId(),4, "Project loaded ID checked");
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
							if(time < 4){
								passTimeTest = true;
							}

							equal(passTimeTest,true,  "Testing Simulation load time: " + time + " ms");
							notEqual(net, null,"Entities checked");
							equal(net.getAspects().length, 1, "Aspects checked");
							equal(net.getConnections().length, 0, "Connections checked");
							equal(jQuery.isEmptyObject(net.electrical.VisualizationTree),false,"Test Visualization at load");
							equal(net.electrical.VisualizationTree.getChildren().length, 2, "Test Visual Groups amount")
							equal(jQuery.isEmptyObject(net.electrical.ModelTree),false,"Test Model tree at load");
							equal(jQuery.isEmptyObject(net.electrical.SimulationTree),false,"Test Simulation tree at load");							
							net.electrical.getModelTree();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_MODEL_TREE:
							var payload = JSON.parse(parsedServerMessage.data);
							var update = JSON.parse(payload.get_model_tree);      
							for (var updateIndex in update){
								var aspectInstancePath = update[updateIndex].aspectInstancePath;
								var modelTree = update[updateIndex].ModelTree;

								//create client side model tree
								GEPPETTO.RuntimeTreeController.populateAspectModelTree(aspectInstancePath, modelTree);
							}

							equal(jQuery.isEmptyObject(net.electrical.ModelTree),false,"Test Model Tree Command");
							notEqual(net.electrical.ModelTree.getInstancePath(),null,"Testing Model Tree has Instance Path");
							start();
							break;
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("4");
			initializationTime = new Date();	
		});
};
	return {run: run};
});
