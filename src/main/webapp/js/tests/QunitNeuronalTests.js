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

		module("Test Project 1 - SingleCompononetHH");
		asyncTest("Test Project 1 - SingleComponentHH", function() {
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
							GEPPETTO.SimulationHandler.loadProject(JSON.parse(parsedServerMessage.data));
							equal(window.Project.getId(),1, "Project ID checked");
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							GEPPETTO.SimulationHandler.loadExperiment(payload);
							equal(window.Project.getActiveExperiment().getId(),1,"Active experiment id of loaded project checked");
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
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1", "1");
			initializationTime = new Date();	
		});
		
		module("Test Play Experiment");
		asyncTest("Load Project 1 - SingleComponentHH", function() {
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					onMessage: function(parsedServerMessage) {
						// Switch based on parsed incoming message type
						switch(parsedServerMessage.type) {
						//Simulation has been loaded and model need to be loaded
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
							//delete hhcell;
							var time = (new Date() - initializationTime)/1000;
							GEPPETTO.SimulationHandler.loadProject(JSON.parse(parsedServerMessage.data));
							equal(window.Project.getId(),1, "Project ID checked");
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							GEPPETTO.SimulationHandler.loadExperiment(payload);
							//if experiment isn't completed don't play
							if (Project.getActiveExperiment().getStatus()!= GEPPETTO.Resources.ExperimentStatus.COMPLETED){
								ok(false,"Unable to play experiment for project");
								launch();
							}else{
								Project.getActiveExperiment().play({step:1});
							}
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PLAY_EXPERIMENT:
							var payload = JSON.parse(parsedServerMessage.data);
							var timeSeries = 
								hhcell.electrical.SimulationTree.hhpop[0].bioPhys1.membraneProperties.naChans.na.h.q.getTimeSeries();
							equal(timeSeries.length,0, "Checking updated time series in variable");
							GEPPETTO.SimulationHandler.playExperiment(payload);
							timeSeries = 
								hhcell.electrical.SimulationTree.hhpop[0].bioPhys1.membraneProperties.naChans.na.h.q.getTimeSeries();
							equal(timeSeries.length,6001, "Checking updated time series in variable");
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
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1", "1");
			initializationTime = new Date();	
		});

		module("Test Muscle cell NEURON simulation");
		asyncTest("Tests PMuscle cell NEURON simulation", function() {
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
							equal(window.Project.getId(),4, "Project loaded ID checked");
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
							notEqual(net1, null,"Entities checked");
							equal(net1.getAspects().length, 1, "Aspects checked");
							equal(net1.getConnections().length, 0, "Connections checked");
							equal(jQuery.isEmptyObject(net1.neuron_0.electrical.VisualizationTree),false,"Test Visualization at load");
							equal(net1.neuron_0.electrical.VisualizationTree.getChildren().length, 1, "Test Visual Groups amount")
							equal(jQuery.isEmptyObject(net1.neuron_0.electrical.ModelTree),false,"Test Model tree at load");
							equal(jQuery.isEmptyObject(net1.neuron_0.electrical.SimulationTree),false,"Test Simulation tree at load");							
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
			window.Project.loadFromID("4","1");
			initializationTime = new Date();	
		});
		
		module("Test C.elegans PVDR Neuron morphology");
		asyncTest("Tests C.elegans PVDR Neuron morphology", function() {
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
							equal(window.Project.getId(),8, "Project loaded ID checked");
							window.Project.getExperiments()[0].setActive();
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
							notEqual(pvdr, null,"Entities checked");
							equal(pvdr.getAspects().length, 1, "Aspects checked");
							equal(pvdr.getConnections().length, 0, "Connections checked");
							equal(jQuery.isEmptyObject(pvdr.electrical.VisualizationTree),false,"Test Visualization at load");
							equal(pvdr.electrical.VisualizationTree.getChildren().length, 1, "Test Visual Groups amount")
							equal(jQuery.isEmptyObject(pvdr.electrical.ModelTree),false,"Test Model tree at load");
							equal(jQuery.isEmptyObject(pvdr.electrical.SimulationTree),false,"Test Simulation tree at load");							
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
			initializationTime = new Date();
			window.Project.loadFromID("8","1");
		});
		
		module("Test Purkinje Cell");
		asyncTest("Tests Purkinje cell with Model Tree call and Visual Groups", function() {
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
							equal(window.Project.getId(),7, "Project loaded ID checked");
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
							notEqual(purkinje, null,"Entities checked");
							equal(purkinje.getAspects().length, 1, "Aspects checked");
							equal(purkinje.getConnections().length, 0, "Connections checked");
							equal(jQuery.isEmptyObject(purkinje.electrical.VisualizationTree),false,"Test Visualization at load");
							equal(purkinje.electrical.VisualizationTree.getChildren().length, 2, "Test Visual Groups amount")
							equal(jQuery.isEmptyObject(purkinje.electrical.ModelTree),false,"Test Model tree at load");
							equal(jQuery.isEmptyObject(purkinje.electrical.SimulationTree),false,"Test Simulation tree at load");							
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
			initializationTime = new Date();	
			window.Project.loadFromID("7","1");
		});
		
		module("Test Get Model Tree");
		asyncTest("Tests Get Model Tree call with Purkinje Experiment", function() {
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
							equal(window.Project.getId(),7, "Project loaded ID checked");
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
							notEqual(purkinje, null,"Entities checked");
							equal(purkinje.getAspects().length, 1, "Aspects checked");
							equal(jQuery.isEmptyObject(purkinje.electrical.ModelTree),false,"Test Model tree at load");
							purkinje.electrical.getModelTree();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_MODEL_TREE:
							var payload = JSON.parse(parsedServerMessage.data);
							GEPPETTO.SimulationHandler.getModelTree(payload);

							equal(jQuery.isEmptyObject(purkinje.electrical.ModelTree),false,"Test Model Tree Command");
							notEqual(purkinje.electrical.ModelTree.getInstancePath(),null,"Testing Model Tree has Instance Path");
							equal(window.Project.getActiveExperiment().getId(),1,"Active experiment id  chekced");  	        	
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
			initializationTime = new Date();	
			window.Project.loadFromID("7","1");
		});

		module("Test C302 Simulation");
		asyncTest("Test C302 Network", function() {
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
							equal(window.Project.getId(),6, "Project loaded ID checked");
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

							equal(passTimeTest,true, "Simulation loaded within time limit: " + time);
							notEqual(c302,null,"Entities checked");
							equal(c302.getChildren().length,300, "C302 Children checked");
							equal(c302.getAspects().length,1, "Aspects checked");
							equal(jQuery.isEmptyObject(c302.electrical.VisualizationTree),false, "Test Visualization at load");
							equal(jQuery.isEmptyObject(c302.electrical.ModelTree),false, "Test Model tree at load");
							equal(jQuery.isEmptyObject(c302.electrical.SimulationTree),false, "Test Simulation tree at load");							
							equal(c302.ADAL_0.getConnections().length,31, "ADAL_0 connections check");
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
			initializationTime = new Date();	
			window.Project.loadFromID("6", "1");
		});

		module("Test Primary Auditory Cortex Network (ACNET2)");
		asyncTest("Tests Primary Auditory Cortex Network [Medium Net] with Model Tree call and Visual Groups", function() {
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
							equal(window.Project.getId(),5, "Project loaded ID checked");
							window.Project.getExperiments()[0].setActive();
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
							notEqual(acnet2, null,"Entities checked");
							equal(acnet2.getAspects().length, 1, "Aspects checked");
							equal(acnet2.baskets_12_9.getConnections().length, 60, "Connections checked");
							equal(jQuery.isEmptyObject(acnet2.electrical.VisualizationTree),false,"Test Visualization at load");
							equal(acnet2.electrical.VisualizationTree.getChildren().length, 1, "Test Visual Groups amount")
							equal(jQuery.isEmptyObject(acnet2.electrical.ModelTree),false,"Test Model tree at load");
							equal(jQuery.isEmptyObject(acnet2.electrical.SimulationTree),false,"Test Simulation tree at load");							
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
			window.Project.loadFromID("5","1");		
			initializationTime = new Date();	
		});
};
	return {run: run};
});
