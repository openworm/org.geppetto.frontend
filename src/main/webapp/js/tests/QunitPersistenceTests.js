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

		module("Test Project 1 - SingleCompononetHH", {setup: function() {
			GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/'+ window.BUNDLE_CONTEXT_PATH +'/GeppettoServlet');
		}});
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

		module("New experiment",{setup: function() {
			GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/'+ window.BUNDLE_CONTEXT_PATH +'/GeppettoServlet');
		  }});
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
							var time = (new Date() - initializationTime)/1000;
							var payload = JSON.parse(parsedServerMessage.data);
							var experiment = JSON.parse(payload.experiment_created);
							var newExperiment = GEPPETTO.NodeFactory.createExperimentNode(experiment);
							window.Project.getExperiments().push(newExperiment); 
							newExperiment.setParent(window.Project);
							equal(window.Project.getExperiments()[2].getId(), 0, "New experiment ID checked");
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
};
	return {run: run};
});
