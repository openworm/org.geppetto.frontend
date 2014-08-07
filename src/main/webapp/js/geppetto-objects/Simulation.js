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
 *
 * Class for the Simulation Object. Handles user's request to start, stop, pause,
 * and/or load a simulation.
 *
 * @constructor
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {
		var loading = false;

		GEPPETTO.Simulation = {
			simulationStates: [],

			status: 0,
			simulationURL: "",
			watchTree: null,
			time: null,
			timestep: null,
			listeners:[],
			simState : null,
			loading : false,
			loadingTimer : null,
			runTimeTree : {},
			
			StatusEnum: {
				INIT: 0,
				LOADED: 1,
				STARTED: 2,
				PAUSED: 3,
				STOPPED: 4
			},

			getTime: function() {
				return "Current simulation time: " + this.time;
			},

			/**
			 * Start the simulation.
			 *
			 * @name GEPPETTO.Simulation.start()
			 * @returns {String} - Simulation status after starting it.
			 */
			start: function() {
				if(this.isLoaded()) {
					GEPPETTO.MessageSocket.send("start", null);

					this.status = this.StatusEnum.STARTED;
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_START);

					return GEPPETTO.Resources.SIMULATION_STARTED;
				}
				else {
					return GEPPETTO.Resources.UNABLE_TO_START_SIMULATION;
				}
			},

			/**
			 * Pauses the simulation
			 *
			 * @name GEPPETTO.Simulation.pause()
			 * @returns {String} - Status of Simulation after pausing it.
			 *
			 */
			pause: function() {
				if(this.status == this.StatusEnum.STARTED) {

					GEPPETTO.MessageSocket.send("pause", null);

					this.status = this.StatusEnum.PAUSED;
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_PAUSE);

					return GEPPETTO.Resources.SIMULATION_PAUSED;
				}
				else {
					return GEPPETTO.Resources.UNABLE_TO_PAUSE_SIMULATION;
				}
			},

			/**
			 * Stops the simulation.
			 *
			 * @name GEPPETTO.Simulation.stop()
			 * @returns {String} - Status of simulation after stopping it.
			 */
			stop: function() {
				if(this.status == this.StatusEnum.PAUSED || this.status == this.StatusEnum.STARTED) {
					GEPPETTO.MessageSocket.send("stop", null);

					this.status = this.StatusEnum.STOPPED;
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_STOP);

					return GEPPETTO.Resources.SIMULATION_STOP;
				}
				else if(this.status == this.StatusEnum.LOADED) {
					return GEPPETTO.Resources.SIMULATION_NOT_RUNNING;
				}
				else if(this.status == this.StatusEnum.STOPPED) {
					return GEPPETTO.Resources.SIMULATION_ALREADY_STOPPED;
				}
				else {
					return GEPPETTO.Resources.SIMULATION_NOT_LOADED;
				}
			},

			/**
			 * Loads a simulation from a URL.
			 *
			 * @name GEPPETTO.Simulation.load(simulationURL)
			 * @param simulationURL - URL of simulation file to be loaded, use string format as in 
			 *                              Simulation.load("http://url.com")
			 * @returns {String} - Status of attempt to load simulation using url.
			 */
			load: function(simulationURL) {
				if(this.status == this.StatusEnum.STARTED || this.status == this.StatusEnum.PAUSED) {
					this.stop();
				}

				for(var e in this.runTimeTree){
					GEPPETTO.Utility.removeTags(e);
				}
				this.runTimeTree = {};
				this.simulationURL = simulationURL;
				this.listeners=[];
				var loadStatus = GEPPETTO.Resources.LOADING_SIMULATION;

				if(simulationURL != null && simulationURL != "") {
					//Updates the simulation controls visibility
					var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
					//update ui based on success of webgl
					GEPPETTO.FE.update(webGLStarted);
					//Keep going with load of simulation only if webgl container was created
					if(webGLStarted) {
						GEPPETTO.FE.activateLoader("show", GEPPETTO.Resources.LOADING_SIMULATION);
						if(this.status == this.StatusEnum.INIT) {
							//we call it only the first time
							GEPPETTO.animate();
						}
						GEPPETTO.MessageSocket.send("init_url", simulationURL);
						loading = true;
						GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD);
						GEPPETTO.FE.SimulationReloaded();
					}
				}

				else {
					loadStatus = GEPPETTO.Resources.SIMULATION_UNSPECIFIED;
				}

				this.simulationStates = [];
				//time simulation, display appropriate message if taking too long
				this.loadTimer = setInterval(function simulationTakingTooLong(){
					if(Simulation.loading){
						$('#loadingmodaltext').html(GEPPETTO.Resources.LOADING_SIMULATION_SLOW);
					}
				},15000);
				this.loading = true;

				return loadStatus;
			},

			/**
			 * Loads a simulation using the content's from the simulation file editor.
			 *
			 * @name GEPPETTO.Simulation.loadFromContent(content)
			 * @param content - Content of simulation to be loaded.
			 * @returns {String} - Status of attempt to load simulation from content window.
			 */
			loadFromContent: function(content) {
				if(this.status == this.StatusEnum.STARTED || this.status == this.StatusEnum.PAUSED) {
					this.stop();
				}
				
				for(var e in this.runTimeTree){
					GEPPETTO.Utility.removeTags(e);
				}
				this.runTimeTree = {};
				this.listeners=[];
				var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
				//update ui based on success of webgl
				GEPPETTO.FE.update(webGLStarted);
				//Keep going with load of simulation only if webgl container was created
				if(webGLStarted) {
					GEPPETTO.FE.activateLoader("show", GEPPETTO.Resources.LOADING_SIMULATION);
					if(GEPPETTO.Simulation.status == GEPPETTO.Simulation.StatusEnum.INIT) {
						//we call it only the first time
						GEPPETTO.animate();
					}

					GEPPETTO.MessageSocket.send("init_sim", content);
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.LOADING_FROM_CONTENT);
					GEPPETTO.FE.SimulationReloaded();
				}

				//time simulation, display appropriate message if taking too long
				setInterval(function simulationTakingTooLong(){
					if(Simulation.loading){
						$('#loadingmodaltext').html(GEPPETTO.Resources.LOADING_SIMULATION_SLOW);
					}
				},15000);
				this.loading = true;
				
				return GEPPETTO.Resources.LOADING_SIMULATION;
			},

			/**
			 * Checks status of the simulation, whether it has been loaded or not.
			 *
			 * @name GEPPETTO.Simulation.isLoaded()
			 * @returns {Boolean} - True if simulation has been loaded, false if not.
			 */
			isLoaded: function() {
				return this.status != this.StatusEnum.INIT;
			},
			
			isStarted: function() {
				return this.status == this.StatusEnum.STARTED;
			},

			isLoading: function() {
				return loading;
			},

			addTransferFunction: function(targetEntity, targetVar, transferFunction) {
				console.log(this.getWatchTree());
			},

			/**
			 * List watchable variables for the simulation.
			 *
			 * @name GEPPETTO.Simulation.listWatchableVariables()
			 * @returns {String} - status after requesting list of watchable variables.
			 */
			listWatchableVariables: function() {
				if(this.isLoaded()) {
					GEPPETTO.MessageSocket.send("list_watch_vars", null);

					GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_LIST_WATCH);

					return GEPPETTO.Resources.SIMULATION_VARS_LIST;
				}
				else {
					return GEPPETTO.Resources.SIMULATION_NOT_LOADED_ERROR;
				}
			},

			/**
			 * List forceable variables for the simulation.
			 *
			 * @name GEPPETTO.Simulation.listForceableVariables()
			 * @returns {String} - status after requesting list of forceable variables.
			 */
			listForceableVariables: function() {
				if(this.isLoaded()) {
					GEPPETTO.MessageSocket.send("list_force_vars", null);

					GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_LIST_FORCE);

					return GEPPETTO.Resources.SIMULATION_VARS_LIST;
				}
				else {
					return GEPPETTO.Resources.SIMULATION_NOT_LOADED_ERROR;
				}
			},

			/**
			 * Add watchlists to the simulation.
			 *
			 * @name GEPPETTO.Simulation.addWatchLists()
			 * @param watchLists - listing variables to be watched.
			 * @returns {String} - status after request.
			 */
			addWatchLists: function(watchLists) {
				santasLittleHelper("set_watch", GEPPETTO.Resources.SIMULATION_SET_WATCH, GEPPETTO.Resources.MESSAGE_OUTBOUND_SET_WATCH, watchLists);

				return GEPPETTO.Resources.SIMULATION_SET_WATCH;
			},

			/**
			 * Retrieve watchlists available the simulation.
			 *
			 * @name GEPPETTO.Simulation.getWatchLists()
			 * @returns {String} - status after request.
			 */
			getWatchLists: function() {
				santasLittleHelper("get_watch", GEPPETTO.Resources.SIMULATION_GET_WATCH, GEPPETTO.Resources.MESSAGE_OUTBOUND_GET_WATCH, null);

				return GEPPETTO.Resources.SIMULATION_GET_WATCH;
			},

			/**
			 * Start watching variables for the simulation.
			 *
			 * @name GEPPETTO.Simulation.startWatch()
			 * @returns {String} - status after request.
			 */
			startWatch: function() {
				santasLittleHelper("start_watch", GEPPETTO.Resources.SIMULATION_START_WATCH, GEPPETTO.Resources.MESSAGE_OUTBOUND_START_WATCH, null);

				return GEPPETTO.Resources.SIMULATION_START_WATCH;
			},

			/**
			 * Stop watching variables for the simulation.
			 *
			 * @name GEPPETTO.Simulation.stopWatch()
			 * @returns {String} - status after request.
			 */
			stopWatch: function() {
				santasLittleHelper("stop_watch", GEPPETTO.Resources.SIMULATION_STOP_WATCH, GEPPETTO.Resources.MESSAGE_OUTBOUND_STOP_WATCH, null);

				return GEPPETTO.Resources.SIMULATION_STOP_WATCH;
			},

			/**
			 * Clears all watch lists for the given simulation
			 *
			 * @name GEPPETTO.Simulation.clearWatchLists()
			 * @returns {String} - status after request.
			 */
			clearWatchLists: function() {
				santasLittleHelper("clear_watch", GEPPETTO.Resources.SIMULATION_CLEAR_WATCH, GEPPETTO.Resources.MESSAGE_OUTBOUND_CLEAR_WATCH, null);

				GEPPETTO.Simulation.simulationStates = [];

				return GEPPETTO.Resources.SIMULATION_CLEAR_WATCH;
			},

			/**
			 * Gets tree for variables being watched if any.
			 *
			 * @name GEPPETTO.Simulation.getWatchTree()
			 * @returns {String} - status after request.
			 */
			getWatchTree: function() {
				var watched_variables = GEPPETTO.Resources.WATCHED_SIMULATION_STATES + "";

				for(var key in GEPPETTO.Simulation.simulationStates) {
					watched_variables += "\n" + "      -- " + GEPPETTO.Simulation.simulationStates[key] + "\n";
				}

				if(this.watchTree == null) {
					return GEPPETTO.Resources.EMPTY_WATCH_TREE;
				}
				else {
					return watched_variables;
				}
			},

			/**
			 *
			 * Outputs list of commands with descriptions associated with the Simulation object.
			 *
			 * @name GEPPETTO.Simulation.help()
			 * @returns  Returns list of all commands for the Simulation object
			 */
			help: function() {
				return GEPPETTO.Utility.extractCommandsFromFile("js/geppetto-objects/Simulation.js", GEPPETTO.Simulation, "Simulation");
			},

			/**
			 * Return status of simulation
			 */
			getSimulationStatus: function() {
				return this.status;
			},

			setSimulationLoaded: function() {
				this.status = GEPPETTO.Simulation.StatusEnum.LOADED;
				loading = false;
				this.loading = false;
				
				//Reset the simulation states
				this.simulationStates=[];
				
				window.clearInterval(this.loadTimer);
				this.loadTimer = 0;
			},
			
			getEntities : function(){
				var formattedOutput="";
				var indentation = "↪";
				for(var e in this.runTimeTree){
					var entity = this.runTimeTree[e];
					formattedOutput = formattedOutput+indentation + entity.id + " [Entity]\n";
					for(var a in entity.aspects){
						var aspect = entity.aspects[a];
						var aspectIndentation = "         ↪";
						formattedOutput = formattedOutput+ aspectIndentation + aspect.id +  " [Aspect]\n";
					}
					indentation = "      ↪";
				}
				
				if(formattedOutput.lastIndexOf("\n")>0) {
					formattedOutput = formattedOutput.substring(0, formattedOutput.lastIndexOf("\n"));
				} 
				
				return formattedOutput.replace(/"/g, "");
			},

			/**
			 * Add a transfer function to a watched var's sim state.
			 * The transfer function should accept the value of the watched var and output a
			 * number between 0 and 1, corresponding to min and max brightness.
			 * If no transfer function is specified then brightess = value
			 * @param entityName
			 * @param varName
			 * @param transferFunction
			 */
			addBrightnessFunction: function(entityName, varName, transferFunction) {	
				this.listeners[varName] = (function (simState){
					GEPPETTO.lightUpEntity(entityName, transferFunction ? transferFunction(simState.value) : simState.value);
				});
			},

			/**
			 * Clear brightness transfer functions on simulation state
			 * @param varName
			 */
			clearBrightnessFunctions: function(varName) {
				this.listeners[varName] = null;
			}
		};

		function santasLittleHelper(msg, return_msg, outbound_msg_log, payload) {
			if(GEPPETTO.Simulation.isLoaded()) {
				GEPPETTO.MessageSocket.send(msg, payload);

				GEPPETTO.Console.debugLog(outbound_msg_log);

				return return_msg;
			}
			else {
				return GEPPETTO.Resources.SIMULATION_NOT_LOADED_ERROR;
			}
		};
	}
});
