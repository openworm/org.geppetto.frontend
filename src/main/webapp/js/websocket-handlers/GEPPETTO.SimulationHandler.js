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

		var updateTime = function(time) {
			if(time) {
				GEPPETTO.Simulation.time.getTimeSeries()[0].value = time.timeSeries["quantity0"].value;
				GEPPETTO.Simulation.time.getTimeSeries()[0].unit = time.timeSeries["quantity0"].unit;
			}
		};
		
		var createTime = function(time) {
			if(time) {
				var timeNode = GEPPETTO.NodeFactory.createVariableNode(time);
				GEPPETTO.Simulation.time = timeNode;
			}
		};


        var messageTypes = {
            /*
             * Messages handle by SimulatorHandler
             */
            EXPERIMENT_UPDATE: "experiment_update",
            SIMULATION_CONFIGURATION: "project_configuration",
            PROJECT_LOADED: "project_loaded",
            EXPERIMENT_LOADED: "experiment_loaded",
            EXPERIMENT_STARTED: "experiment_started",
            EXPERIMENT_PAUSED: "experiment_paused",
            EXPERIMENT_STOPPED: "experiment_stopped",
            SET_WATCH_VARS: "set_watch_vars",
            CLEAR_WATCH: "clear_watch",
            FIRE_SIM_SCRIPTS: "fire_sim_scripts",
            experiment_OVER : "experiment_over",
            GET_MODEL_TREE : "get_model_tree",
            SET_PARAMETER : "set_parameter",
            NO_FEATURE : "no_feature",
            EXPERIMENTS_STATUS : "experiments_status"
        };

        var messageHandler = {};

        messageHandler[messageTypes.PROJECT_LOADED] = function(payload) {        	
            var project = JSON.parse(payload.project_loaded);

            //get access to root project node
            var projectNode = window["Project"];
            projectNode.name = project.name;
            projectNode.id = project.id;
            for ( var key in project.experiments) {
            	var experiment = project.experiments[key];
            	//create instance path for experiment
            	experiment.instancePath = project.name + "."+experiment.name;
            	var e =GEPPETTO.NodeFactory.createExperimentNode(experiment);

            	// add experiment to project
            	projectNode[e.name] = e;
            	e.setParent(projectNode);
            	// add experiment node to project
            	projectNode.getExperiments().push(e);
            }            
            GEPPETTO.trigger(Events.Project_loaded);            
            GEPPETTO.Console.log(GEPPETTO.Resources.PROJECT_LOADED);
        };

        messageHandler[messageTypes.EXPERIMENT_LOADED] = function(payload) {        	
            var jsonRuntimeTree = JSON.parse(payload.experiment_loaded).scene;

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
            GEPPETTO.trigger("hide:spinner");
        };
        messageHandler[messageTypes.EXPERIMENT_UPDATE] = function(payload) {
            var updatedRunTime = JSON.parse(payload.update);
            updateTime(updatedRunTime.time);

            GEPPETTO.RuntimeTreeController.updateRuntimeTree(updatedRunTime);
            GEPPETTO.SceneController.updateScene(GEPPETTO.Simulation.runTimeTree);
        };

        messageHandler[messageTypes.PROJECT_CONFIGURATION] = function(payload) {            
            GEPPETTO.trigger('project:configloaded', payload.configuration);

        };

        messageHandler[messageTypes.FIRE_SIM_SCRIPTS] = function(payload) {
            //Reads scripts received for the simulation
            var scripts = JSON.parse(payload.get_scripts).scripts;

            //make sure object isn't empty
            if(!jQuery.isEmptyObject(scripts)) {
                //run the received scripts
                GEPPETTO.ScriptRunner.fireScripts(scripts);
            }
        };

        //Simulation has been started, enable pause button
        messageHandler[messageTypes.EXPERIMENT_STARTED] = function(payload) {
        	var updatedRunTime = JSON.parse(payload.update).scene;
            createTime(updatedRunTime.time);

            GEPPETTO.RuntimeTreeController.updateRuntimeTree(updatedRunTime);

            //Update if simulation hasn't been stopped
            if(GEPPETTO.Simulation.status != GEPPETTO.Simulation.StatusEnum.STOPPED && GEPPETTO.isCanvasCreated()) {
                if(!GEPPETTO.isScenePopulated()) {
                    // the first time we need to create the objects
                    GEPPETTO.SceneController.populateScene(GEPPETTO.Simulation.runTimeTree);
                }
                else {
                    // any other time we just update them
                    GEPPETTO.SceneController.updateScene(GEPPETTO.Simulation.runTimeTree);
                }
            }
                       
            GEPPETTO.trigger(Events.Experiment_started);
        };

        messageHandler[messageTypes.EXPERIMENT_STOPPED] = function(payload) {
            GEPPETTO.trigger(Events.Experiment_stopped);
        };

        messageHandler[messageTypes.EXPERIMENT_PAUSED] = function(payload) {
            GEPPETTO.trigger(Events.Experiment_paused);
        };

        messageHandler[messageTypes.SET_WATCH_VARS] = function(payload) {
            //variables watching
            var variables = JSON.parse(payload.set_watch_vars)
            
            for (var index in variables){
            	var variable = eval(variables[index]);
            	variable.watched = !variable.watched;
            	GEPPETTO.Simulation.simulationStates.push(variables[index]);
            }
        };

        //handles the case where simulation is done executing all steps
        messageHandler[messageTypes.SIMULATION_OVER] = function() {
            //Updates the simulation controls visibility
        	GEPPETTO.Console.executeCommand("Simulation.stop()");
        };

      //handles the case where geppetto is done setting parameters
        messageHandler[messageTypes.SET_PARAMETER] = function() {
        	 GEPPETTO.Console.log("Sucessfully updated parameters");
        };
        
      //handles the case where service doesn't support feature and shows message
        messageHandler[messageTypes.NO_FEATURE] = function() {
            //Updates the simulation controls visibility
        	GEPPETTO.FE.infoDialog(GEPPETTO.Resources.NO_FEATURE, payload.message);
        };
        
        //received model tree from server
        messageHandler[messageTypes.GET_MODEL_TREE] = function(payload) {
        	var initTime = new Date();
        	
        	GEPPETTO.Console.debugLog(GEPPETTO.Resources.LOADING_MODEL + " took: " + initTime + " ms.");
        	
        	var update = JSON.parse(payload.get_model_tree);      
        	for (var updateIndex in update){
	        	var aspectInstancePath = update[updateIndex].aspectInstancePath;
	        	var modelTree = update[updateIndex].modelTree;
	        	
	        	//create client side model tree
	        	GEPPETTO.RuntimeTreeController.populateAspectModelTree(aspectInstancePath, modelTree.ModelTree);
        	}
        	
        	GEPPETTO.trigger(Events.ModelTree_populated);
        	
        	var endCreation = new Date() - initTime;
            GEPPETTO.Console.debugLog("It took " + endCreation + " ms to create model tree");
        };
        
        messageHandler[messageTypes.GET_SIMULATION_TREE] = function(payload) {
        	var initTime = new Date();
        	
            GEPPETTO.Console.debugLog(GEPPETTO.Resources.LOADING_MODEL + " took: " + initTime + " ms.");
           
        	var update = JSON.parse(payload.get_simulation_tree);      
        	for (var updateIndex in update){
	        	var aspectInstancePath = update[updateIndex].aspectInstancePath;
	        	var simulationTree = update[updateIndex].simulationTree;
	        	
	        	//create client side simulation tree
	        	GEPPETTO.RuntimeTreeController.populateAspectSimulationTree(aspectInstancePath, simulationTree.SimulationTree);
        	}
        	
			GEPPETTO.Console.log(GEPPETTO.Resources.SIMULATION_TREE_RECEIVED);
        	GEPPETTO.trigger(Events.SimulationTree_populated);
        	var endCreation = new Date() - initTime;
            GEPPETTO.Console.debugLog("It took " + endCreation + " ms to create simulation tree");
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
