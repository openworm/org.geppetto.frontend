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
		
		module("Project 1 - SingleComponentHH");
		asyncTest("Test switching active experiment", function() {
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					switchExperiment : false,
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
							//if project 1 doesn't have more than one experiment, it isn't
							//loaded from persistence
							if(window.Project.getExperiments().length>1){
								if(!this.switchExperiment){
									equal(window.Project.getActiveExperiment().getId(),1,"Active experiment id of loaded project checked");
									window.Project.getExperiments()[1].setActive();
									this.switchExperiment = true;
								}else{
									equal(window.Project.getActiveExperiment().getId(),2,"New Active experiment id of loaded project checked");
									launch();
								}
							}else{
								ok(false,"Failed to load project from persistence");
								launch();
							}
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
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1", "1");
			initializationTime = new Date();	
		});

		asyncTest("Test uploading simulation results", function() {
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					switchExperiment : false,
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
							equal(window.Project.getActiveExperiment().getId(),2,"Active experiment id of loaded project checked");
							hhcell.electrical.uploadResults("GEPPETTO_RECORDING");
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.RESULTS_UPLOADED:
							ok("Results Uploaded", "Results Uploaded Okay!");
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
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1", "2");
			initializationTime = new Date();	
		});
		
		asyncTest("Test uploading simulation model", function() {
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					switchExperiment : false,
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
							equal(window.Project.getActiveExperiment().getId(),2,"Active experiment id of loaded project checked");
							hhcell.electrical.uploadModel();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.MODEL_UPLOADED:
							ok("Model Uploaded", "Model Uploaded Okay!");
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
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1", "2");
			initializationTime = new Date();	
		});
		
		asyncTest("Test downloading simulation results", function() {
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					switchExperiment : false,
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
							equal(window.Project.getActiveExperiment().getId(),2,"Active experiment id of loaded project checked");
							Project.getExperiments()[1].downloadResults('hhcell.electrical','GEPPETTO_RECORDING');
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.ERROR_DOWNLOADING_RESULTS:
							ok("Model Not Downloaded", "Results Not Donwloaded Okay!");
							start();
							GEPPETTO.MessageSocket.close();
							GEPPETTO.MessageSocket.clearHandlers();
							GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/'+ window.BUNDLE_CONTEXT_PATH +'/GeppettoServlet');
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.ERROR:
							ok("Model Not Downloaded", "Results Not Donwloaded Okay!");
							start();
							GEPPETTO.MessageSocket.close();
							GEPPETTO.MessageSocket.clearHandlers();
							GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/'+ window.BUNDLE_CONTEXT_PATH +'/GeppettoServlet');
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.DOWNLOAD_RESULTS:
							ok("Model Downloaded", "Results Donwloaded Okay!");
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
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1", "2");
			initializationTime = new Date();	
		});
		
		asyncTest("Test downloading simulation model", function() {
			var initializationTime;
			var handler = {
					checkUpdate2 : false,
					startRequestID : null,
					switchExperiment : false,
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
							hhcell.electrical.downloadModel();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.DOWNLOAD_MODEL:
							ok("Model Downloaded", "Model Donwloaded Okay!");
							launch();
							break;
						case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
							var payload = JSON.parse(parsedServerMessage.data);
							var message = JSON.parse(payload.message);
				            ok(false,"Failed to load project from persistence");
							launch();
							break;
						case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
							var payload = JSON.parse(parsedServerMessage.data);
							var message = JSON.parse(payload.message).message;
							ok(false,"Failed to load project from persistence");
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
		
		asyncTest("Test Persist Project", function() {
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
				            window.Project.persist();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_PERSISTED:
							var time = (new Date() - initializationTime)/1000;
				            ok(true, "Project persisted");
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
						}
					}
			};
			GEPPETTO.MessageSocket.addHandler(handler);
			Project.loadFromURL("https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/LEMS/SingleComponentHH/GEPPETTO.json");
			initializationTime = new Date();	
		});
		
		asyncTest("Test Save Project Properties", function() {
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
							equal(window.Project.getId(),1, "Project loaded ID checked");
				            window.Project.saveProjectProperties();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_PROPS_SAVED:
							var payload = JSON.parse(parsedServerMessage.data);
				            ok(true, "Project saved");
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
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1");
			initializationTime = new Date();	
		});
		
		asyncTest("Test Delete experiment", function() {
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
							equal(window.Project.getId(),1, "Project loaded ID checked");
							var length = window.Project.getExperiments().length-1;
							window.Project.getExperiments()[length].deleteExperiment();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_DELETED:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							var newLength = window.Project.getExperiments().length;
				            GEPPETTO.SimulationHandler.deleteExperiment(payload);
				            newLength--;
				            equal(window.Project.getExperiments().length, newLength, "New experiment ID checked");
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
							var message = JSON.parse(payload.message).msg;
							ok(false,message);
							launch();
							break;
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1");
			initializationTime = new Date();	
		});

		asyncTest("Test Create New experiment", function() {
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
							equal(window.Project.getId(),1, "Project loaded ID checked");
							window.Project.newExperiment();
							break;
						case GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_CREATED:
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							var newLength = window.Project.getExperiments().length;
				            GEPPETTO.SimulationHandler.createExperiment(payload);
				            newLength++;
				            equal(window.Project.getExperiments().length, newLength, "New experiment ID checked");
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
							var message = JSON.parse(payload.message).msg;
							ok(false,message);
							launch();
							break;
						}
					}
			};
			GEPPETTO.MessageSocket.clearHandlers();
			GEPPETTO.MessageSocket.addHandler(handler);
			window.Project.loadFromID("1");
			initializationTime = new Date();	
		});
	};
	return {run: run};
});
