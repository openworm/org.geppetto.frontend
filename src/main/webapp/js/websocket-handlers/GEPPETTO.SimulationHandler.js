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
		var $ = require('jquery');

		var updateTime = function(t) {
				GEPPETTO.Simulation.time = t.TIME_STEP.time.value + t.TIME_STEP.time.unit;
				GEPPETTO.Simulation.step = t.TIME_STEP.step.value + t.TIME_STEP.step.unit;
		};

		GEPPETTO.SimulationHandler = {
			onMessage: function(parsedServerMessage) {

				// parsed message has a type and data fields - data contains the payload of the message
				var payload = JSON.parse(parsedServerMessage.data);

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type) {
					//Simulation has been loaded and model need to be loaded
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_MODEL:
						GEPPETTO.Console.debugLog(GEPPETTO.Resources.LOADING_MODEL);
						var entities = JSON.parse(payload.update).entities;

						GEPPETTO.Simulation.setSimulationLoaded();
						//Reset the simulation states
						GEPPETTO.Simulation.simulationStates={};

						//Populate scene
						GEPPETTO.populateScene(entities);
						break;
					//Event received to update the simulation
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SCENE_UPDATE:
						var starttime = (new Date()).getTime();

						var entities = JSON.parse(payload.update).entities;
						var variables = JSON.parse(payload.update).variable_watch;

						if(variables != null) {
							GEPPETTO.Simulation.updateSimulationWatchTree(variables);
						}
						var time = JSON.parse(payload.update).time;

						if(time != null) {
							updateTime(time);
						}
						//Update if simulation hasn't been stopped
						if(GEPPETTO.Simulation.status != GEPPETTO.Simulation.StatusEnum.STOPPED && GEPPETTO.isCanvasCreated()) {
							if(!GEPPETTO.isScenePopulated()) {
								// the first time we need to create the object.s
								GEPPETTO.populateScene(entities);
							}
							else {
								// any other time we just update them
								GEPPETTO.updateJSONScene(entities);
							}
						}

						var endtime = (new Date()).getTime();
						//console.log("took " + (endtime-starttime) + " to UPDATE SCENE");

						// TODO: store variable-watch tree
						break;
					//Simulation server became available
					//Simulation configuration retrieved from server
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_CONFIGURATION:
						//Load simulation file into display area
						GEPPETTO.SimulationContentEditor.loadSimulationInfo(payload.configuration);
						//Auto Format Simulation FIle display
						GEPPETTO.SimulationContentEditor.autoFormat();
						break;
					//Simulation has been loaded, enable start button and remove loading panel
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_LOADED:
						$('#start').removeAttr('disabled');
						$('#loadingmodal').modal('hide');
						break;
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.FIRE_SIM_SCRIPTS:
						//Reads scripts received for the simulation
						var scripts = JSON.parse(payload.get_scripts).scripts;

						//make sure object isn't empty
						if(!jQuery.isEmptyObject(scripts)) {
							//run the received scripts
							GEPPETTO.ScriptRunner.fireScripts(scripts);
						}
						else {
							//hide loading modal, no scripts associated with simulation
							$('#loadingmodal').modal('hide');
						}
						break;
					//Simulation has been started, enable pause button
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_STARTED:
						GEPPETTO.FE.updateStartEvent();
						break;
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_STOPPED:
						//Updates the simulation controls visibility
						GEPPETTO.FE.updateStopEvent();
						break;
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATION_PAUSED:
						//Updates the simulation controls visibility
						GEPPETTO.FE.updatePauseEvent();
						break;
					//Simulation has been started, enable pause button
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LIST_WATCH_VARS:
						GEPPETTO.Console.debugLog(GEPPETTO.Resources.LISTING_WATCH_VARS);
						// TODO: format output
						formatListVariableOutput(JSON.parse(payload.list_watch_vars).variables, 0);
						//GEPPETTO.Console.log(JSON.stringify(payload));
						break;
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.LIST_FORCE_VARS:
						GEPPETTO.Console.debugLog(GEPPETTO.Resources.LISTING_FORCE_VARS);
						// TODO: format output
						formatListVariableOutput(JSON.parse(payload.list_force_vars).variables, 0);
						//GEPPETTO.Console.log(JSON.stringify(payload));
						break;
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.GET_WATCH_LISTS:
						GEPPETTO.Console.debugLog(GEPPETTO.Resources.LISTING_FORCE_VARS);
						GEPPETTO.Console.log(payload.get_watch_lists);
						break;
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SIMULATOR_FULL:
						var simulatorInfo = JSON.parse(payload.simulatorFull);

						var simulatorName = simulatorInfo.simulatorName;
						var queuePosition = simulatorInfo.queuePosition;

						GEPPETTO.FE.disableSimulationControls();
						GEPPETTO.FE.fullSimulatorNotification(simulatorName, queuePosition);
						break;
					//Starts the watch of requested variables
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.START_WATCH:
						//variables watching
						var variables = JSON.parse(payload.get_watch_lists)[0].variablePaths;

						//create objects for the variables to watch
						for(var v in variables) {
							GEPPETTO.Serializer.stringToObject(variables[v]);
							var splitVariableName = variables[v].split(".");

							var name = variables[v].replace(splitVariableName[0] + ".", "");

							GEPPETTO.Simulation.simulationStates[name] = new GEPPETTO.SimState.State(name,0);


						}
						break;
					case GEPPETTO.SimulationHandler.MESSAGE_TYPE.SET_WATCH_VARS:
						//variables watching
						var variables = JSON.parse(payload.get_watch_lists)[0].variablePaths;

						//create objects for the variables to watch
						for(var v in variables) {
							GEPPETTO.Serializer.stringToObject(variables[v]);

							var splitVariableName = variables[v].split(".");

							var name = variables[v].replace(splitVariableName[0] + ".", "");

							GEPPETTO.Simulation.simulationStates[name] = new GEPPETTO.SimState.State(name,0);

						}
						break;
					default:
						break;
				}
			}
		};

		GEPPETTO.SimulationHandler.MESSAGE_TYPE = {
			/*
			 * Messages handle by SimulatorHandle
			 */
			LOAD_MODEL: "load_model",
			SCENE_UPDATE: "scene_update",
			SIMULATION_CONFIGURATION: "simulation_configuration",
			SIMULATION_LOADED: "simulation_loaded",
			SIMULATION_STARTED: "simulation_started",
			SIMULATION_PAUSED: "simulation_paused",
			SIMULATION_STOPPED: "simulation_stopped",
			LIST_WATCH_VARS: "list_watch_vars",
			LIST_FORCE_VARS: "list_force_vars",
			GET_WATCH_LISTS: "get_watch_lists",
			SIMULATOR_FULL: "simulator_full",
			SET_WATCH_VARS: "set_watch_vars",
			START_WATCH: "start_watch",
			STOP_WATCH: "stop_watch",
			CLEAR_WATCH: "clear_watch",
			FIRE_SIM_SCRIPTS: "fire_sim_scripts",
			SIMULATION_OVER : "simulation_over"
		};
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
				var indentation = "   ↪";
				for(var j = 0; j < indent; j++) {
					indentation = indentation.replace("↪", " ") + "   ↪ ";
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