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
 * Handles incoming messages associated with Simulation
 */
define(function(require) {	
	return function(GEPPETTO) {

        var messageTypes = {
            /*
             * Messages handle by SimulatorHandler
             */
            EXPERIMENT_UPDATE: "experiment_update",
            SIMULATION_CONFIGURATION: "project_configuration",
            PROJECT_LOADED: "project_loaded",
            EXPERIMENT_CREATED: "experiment_created",
            EXPERIMENT_LOADING: "experiment_loading",
            EXPERIMENT_LOADED: "experiment_loaded",
            PLAY_EXPERIMENT : "play_experiment",
            SET_WATCHED_VARIABLES: "set_watched_variables",
            WATCHED_VARIABLES_SET:"watched_variables_set",
            CLEAR_WATCH: "clear_watch",
            EXPERIMENT_OVER : "experiment_over",
            GET_MODEL_TREE : "get_model_tree",
            GET_SIMULATION_TREE : "get_simulation_tree",
            SET_PARAMETERS : "set_parameters",
            NO_FEATURE : "no_feature",
            EXPERIMENT_STATUS : "experiment_status",
            GET_SUPPORTED_OUTPUTS : "get_supported_outputs",
            EXPERIMENT_DELETED : "experiment_deleted",
            PROJECT_PERSISTED : "project_persisted",
            DROPBOX_LINKED : "dropbox_linked",
            DROPBOX_UNLINKED : "dropbox_unlinked",
            RESULTS_UPLOADED : "results_uploaded",
            MODEL_UPLOADED : "model_uploaded",
            UPDATE_MODEL_TREE : "update_model_tree"
        };

        var messageHandler = {};

        messageHandler[messageTypes.PROJECT_LOADED] = function(payload) {        	
            var project = JSON.parse(payload.project_loaded);

            window.Project = GEPPETTO.NodeFactory.createProjectNode(project);         
            if(window.location.search.indexOf("load_project_from_url")!=-1)
            {	
            	window.Project.persisted=false;
            }
            GEPPETTO.trigger(Events.Project_loaded);            
            GEPPETTO.Console.log(GEPPETTO.Resources.PROJECT_LOADED);
        };
        
        messageHandler[messageTypes.EXPERIMENT_CREATED] = function(payload) {        	
            var experiment = JSON.parse(payload.experiment_created);

            var newExperiment = GEPPETTO.NodeFactory.createExperimentNode(experiment);
            window.Project.getExperiments().push(newExperiment);
            newExperiment.setParent(window.Project);
            GEPPETTO.Console.log(GEPPETTO.Resources.EXPERIMENT_CREATED);
            
            GEPPETTO.FE.newExperiment(newExperiment);
        };
        
        messageHandler[messageTypes.EXPERIMENT_LOADING] = function(payload) { 
        	//Updates the simulation controls visibility
			var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
			//update ui based on success of webgl
			GEPPETTO.FE.update(webGLStarted);
			//Keep going with load of simulation only if webgl container was created

			//we call it only the first time
			GEPPETTO.SceneController.animate();
        	GEPPETTO.trigger('project:show_spinner');
        }

        messageHandler[messageTypes.EXPERIMENT_LOADED] = function(payload) {        	
        	var message=JSON.parse(payload.experiment_loaded);
        	var jsonRuntimeTree = message.scene;
        	var experimentId=message.experimentId;
        	//Updates the simulation controls visibility
			var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
			//update ui based on success of webgl
			GEPPETTO.FE.update(webGLStarted);
			//Keep going with load of simulation only if webgl container was created
			if(webGLStarted) {
				//we call it only the first time
				GEPPETTO.SceneController.animate();
				for(var experiment in window.Project.getExperiments())
				{
					if(window.Project.getExperiments()[experiment].getId()==experimentId)
					{
						window.Project.setActiveExperiment(window.Project.getExperiments()[experiment]);
						break;
					}
				}
				
			}
            

            var startCreation = new Date();
            GEPPETTO.RuntimeTreeController.createRuntimeTree(jsonRuntimeTree);
            var endCreation = new Date() - startCreation;
            GEPPETTO.Console.debugLog("It took " + endCreation + " ms to create runtime tree");
            GEPPETTO.Console.debugLog(GEPPETTO.NodeFactory.nodes + " total nodes created, from which: "+
            						  GEPPETTO.NodeFactory.entities + " were entities and "+
            						  GEPPETTO.NodeFactory.connections + " were connections");
            
            //Populate scene
            GEPPETTO.SceneController.populateScene(window["Project"].runTimeTree); 
            
            GEPPETTO.trigger(Events.Experiment_loaded);
            
            if(window.Project.getActiveExperiment().getScript()!=undefined)
        	{
        		G.runScript(window.Project.getActiveExperiment().getScript());
        	}
        };
        messageHandler[messageTypes.PLAY_EXPERIMENT] = function(payload) {
            var updatedRunTime = JSON.parse(payload.update);
                        
            GEPPETTO.RuntimeTreeController.updateRuntimeTree(updatedRunTime);
        	GEPPETTO.SceneController.updateScene(window.Project.runTimeTree);

        	var experiment = window.Project.getActiveExperiment();
        	//we loop through variables of experiment to find node with 
        	//max number of time series values, this will be used for knowing
        	//when to stop updating experiment
        	var variables = experiment.getVariables();
        	var maxSteps = 0;
        	for(var key in variables){
        		var node = eval(variables[key]);
        		if(node!=null || node != undefined){
        			if(node.getTimeSeries().length>maxSteps){
        				maxSteps = node.getTimeSeries().length;
        			}
        		}
        	}
        	experiment.maxSteps = maxSteps;
        	
        	if(!experiment.played){
        		experiment.experimentUpdateWorker();
        	}
        	experiment.played = true;
        };
        messageHandler[messageTypes.EXPERIMENT_UPDATE] = function(payload) {
            var updatedRunTime = JSON.parse(payload.update);
            updateTime(updatedRunTime.time);

            GEPPETTO.RuntimeTreeController.updateRuntimeTree(updatedRunTime);
            GEPPETTO.SceneController.updateScene(window.Project.runTimeTree);            
        };
        
        messageHandler[messageTypes.EXPERIMENT_STATUS] = function(payload) {
            var experimentStatus = JSON.parse(payload.update);

            var experiments = window.Project.getExperiments();
            for(var key in experimentStatus){
            	var projectID = experimentStatus[key].projectID;
            	var status = experimentStatus[key].status;
            	var experimentID = experimentStatus[key].experimentID;
            	
            	//changing status in matched experiment
            	for(var e in experiments){
            		if(experiments[e].getId()==experimentID){
            			if(experiments[e].getStatus()!=status){
            				if(window.Project.getActiveExperiment()!=null || undefined){
            					if(window.Project.getActiveExperiment().getId()==experimentID){
            						if(experiments[e].getStatus()==GEPPETTO.Resources.ExperimentStatus.RUNNING&&
            								status == GEPPETTO.Resources.ExperimentStatus.COMPLETED){
            							GEPPETTO.trigger(Events.Experiment_completed);
            						}
            					}
            				}
            				experiments[e].setStatus(status);
            			}
            		}
            	}
            }            
            GEPPETTO.trigger(Events.Experiment_status_check);
        };
        
        messageHandler[messageTypes.PROJECT_PERSISTED] = function(payload) {
            var message = JSON.parse(payload.update);
            var projectID = message.projectID;
            
            window.Project.id=parseInt(projectID);
            window.Project.persisted=true;
            GEPPETTO.trigger(Events.Project_persisted);
            GEPPETTO.Console.log("The project has been persisted  [id="+ projectID + "].");        
        };

        messageHandler[messageTypes.PROJECT_CONFIGURATION] = function(payload) {            
            GEPPETTO.trigger('project:configloaded', payload.configuration);

        };

       
        messageHandler[messageTypes.EXPERIMENT_DELETED] = function(payload) {
            var data = JSON.parse(payload.update);

            var experiments = window.Project.getExperiments();
            for(var e in experiments){
            	var experiment = experiments[e];
            	if(experiment.getId() == data.id){
            		var index = window.Project.getExperiments().indexOf(experiment);
            		window.Project.getExperiments().splice(index,1);
            	}
            }
        	var parameters = {name : data.name, id : data.id};
            GEPPETTO.trigger(Events.Experiment_deleted, parameters);
        };

        messageHandler[messageTypes.WATCHED_VARIABLES_SET] = function(payload) {
            GEPPETTO.Console.log("The list of variables to watch was successfully updated.");
        };
        
        
      //handles the case where service doesn't support feature and shows message
        messageHandler[messageTypes.NO_FEATURE] = function() {
            //Updates the simulation controls visibility
        	GEPPETTO.FE.infoDialog(GEPPETTO.Resources.NO_FEATURE, payload.message);
        };
        
        //received model tree from server
        messageHandler[messageTypes.GET_MODEL_TREE] = function(payload) {
        	var initTime = new Date();
        	
        	GEPPETTO.Console.debugLog(GEPPETTO.Resources.LOADING_MODEL + " took: " + initTime + "ms.");
        	
        	var update = JSON.parse(payload.get_model_tree);      
        	for (var updateIndex in update){
	        	var aspectInstancePath = update[updateIndex].aspectInstancePath;
	        	var modelTree = update[updateIndex].ModelTree;
	        	
	        	//create client side model tree
	        	GEPPETTO.RuntimeTreeController.populateAspectModelTree(aspectInstancePath, modelTree);
        	}
        	
        	GEPPETTO.trigger(Events.ModelTree_populated);
        	
        	var endCreation = new Date() - initTime;
            GEPPETTO.Console.debugLog("It took " + endCreation + "ms to create model tree");
        };
        
      //received model tree from server
        messageHandler[messageTypes.UPDATE_MODEL_TREE] = function(payload) {        	
       	 	GEPPETTO.Console.log("The model parameters were successfully updated.");
        	
        	/*Matteo: This is not needed, the value in the nodes is changed right when calling setValue on them.
        	 * This would be needed in case setParameter was used directly
        	 * var update = JSON.parse(payload.update_model_tree);      
        	for (var updateIndex in update){
        		//retrieve aspect path and modeltree
	        	var aspectInstancePath = update[updateIndex].aspectInstancePath;
	        	var modelTree = update[updateIndex].ModelTree;
	        	//get parameters sent for active experiment
	        	var parameters = Project.getActiveExperiment().parameters;
	        	for(var key in parameters){;
	        		//find client node for parameter
	        		var node = eval(parameters[key]);
	        		//get name of node
	        		var name = node.getId();
	        		//get new server node from model tree
	        		var newNode = eval("modelTree."+name);
	        		//apply to client node new value
	        		node.setValue(newNode.value);
	        	}
        	}*/
        	
        };
        
        //received supported outputs from server
        messageHandler[messageTypes.GET_SUPPORTED_OUTPUTS] = function(payload) {
        	var supportedOutputs = JSON.parse(payload.get_supported_outputs);
        	GEPPETTO.Console.log(supportedOutputs);
        };
        
        messageHandler[messageTypes.GET_SIMULATION_TREE] = function(payload) {
        	var initTime = new Date();
        	
            GEPPETTO.Console.debugLog(GEPPETTO.Resources.LOADING_MODEL + " took: " + initTime + " ms.");
           
        	var update = JSON.parse(payload.get_simulation_tree);      
        	for (var updateIndex in update){
	        	var aspectInstancePath = update[updateIndex].aspectInstancePath;
	        	var simulationTree = update[updateIndex].SimulationTree;
	        	
	        	//create client side simulation tree
	        	GEPPETTO.RuntimeTreeController.populateAspectSimulationTree(aspectInstancePath, simulationTree);
        	}
        	
			GEPPETTO.Console.log(GEPPETTO.Resources.SIMULATION_TREE_RECEIVED);
        	GEPPETTO.trigger(Events.SimulationTree_populated);
        	var endCreation = new Date() - initTime;
            GEPPETTO.Console.debugLog("It took " + endCreation + "ms to create simulation tree");
        };
        
        messageHandler[messageTypes.DROPBOX_LINKED] = function(payload) {
        	GEPPETTO.Console.log("Dropbox linked successfully");
        };
        
        messageHandler[messageTypes.DROPBOX_UNLINKED] = function(payload) {
        	GEPPETTO.Console.log("Dropbox unlinked succesfully");
        };
        
        messageHandler[messageTypes.RESULTS_UPLOADED] = function(payload) {
        	GEPPETTO.Console.log("Results uploaded succesfully");
        };
        messageHandler[messageTypes.MODEL_UPLOADED] = function(payload) {
        	GEPPETTO.Console.log("Model uploaded succesfully");
        };
		GEPPETTO.SimulationHandler = {
			onMessage: function(parsedServerMessage) {
				// parsed message has a type and data fields - data contains the payload of the message
				// Switch based on parsed incoming message type
                if(messageHandler.hasOwnProperty(parsedServerMessage.type)) {
                    messageHandler[parsedServerMessage.type](JSON.parse(parsedServerMessage.data));
                }
			}
		};

		GEPPETTO.SimulationHandler.MESSAGE_TYPE = messageTypes;
	};

	/**
	 * Utility function for formatting output of list variable operations
	 * NOTE: move from here under wherever it makes sense
	 *
	 * @param vars - array of variables
	 */
	function formatListVariableOutput(vars, indent)
	{
		var formattedNode = null;

		// vars is always an array of variables
		for(var i = 0; i < vars.length; i++) {
			var name = vars[i].name;

			if(vars[i].aspect != "aspect") {
				var size = null;
				if(typeof(vars[i].size) != "undefined") {
					// we know it's an array
					size = vars[i].size;
				}

				// print node
				var arrayPart = (size != null) ? "[" + size + "]" : "";
				var indentation = "   ���";
				for(var j = 0; j < indent; j++) {
					indentation = indentation.replace("���", " ") + "   ��� ";
				}
				formattedNode = indentation + name + arrayPart;

				// is type simple variable? print type
				if(typeof(vars[i].type.variables) == "undefined") {
					// we know it's a simple type
					var type = vars[i].type.type;
					formattedNode += ":" + type;
				}

				// print current node
				GEPPETTO.Console.log(formattedNode);

				// recursion check
				if(typeof(vars[i].type.variables) != "undefined") {
					// we know it's a complex type - recurse! recurse!
					formatListVariableOutput(vars[i].type.variables, indent + 1);
				}
			}
			else {
				formattedNode = name;
				// print current node
				GEPPETTO.Console.log(formattedNode);
			}
		}
	}
});
