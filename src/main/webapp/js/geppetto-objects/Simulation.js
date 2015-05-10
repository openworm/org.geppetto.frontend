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
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {
		var loading = false;

		/**
		 * @exports geppetto-objects/Simulation
		 */
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
			initializationTime : null,
			selectionOptions : {
				show_inputs : true,
				show_outputs : true,
				draw_connection_lines : true,
				hide_not_selected : false
			},
			highlightedConnections : [],
			
			/**
			 * Simulation.Status
			 * 
			 * Different statutes a Simulation can be on
			 * @enum
			 */
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
			 * @command GEPPETTO.Simulation.start()
			 * @returns {String}  Simulation status after starting it.
			 */
			start: function() {
				if(this.isLoaded() && (this.status != this.StatusEnum.STARTED)) {
					GEPPETTO.MessageSocket.send("start", null);

					if(this.status == this.StatusEnum.STOPPED){
						//reset data for any open plot widget after simulation was stopped and then started again
						GEPPETTO.trigger(Events.Widgets_restarted);
					}
					
					this.status = this.StatusEnum.STARTED;
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_START);
					 
					return GEPPETTO.Resources.SIMULATION_STARTED;
				}
				else if(this.isLoaded() && this.status == this.StatusEnum.STARTED){
					return GEPPETTO.Resources.SIMULATION_ALREADY_STARTED;
				}
				else {
					return GEPPETTO.Resources.UNABLE_TO_START_SIMULATION;
				}
			},

			/**
			 * Pauses the simulation
			 *
			 * @command GEPPETTO.Simulation.pause()
			 * @returns {String}  Status of Simulation after pausing it.
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
			 * @command GEPPETTO.Simulation.stop()
			 * @returns {String} Status of simulation after stopping it.
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
			 * @command GEPPETTO.Simulation.load(simulationURL)
			 * @param {URL} simulationURL - URL of simulation file to be loaded, use string format as in 
			 *                              Simulation.load("http://url.com")
			 * @returns {String}  Status of attempt to load simulation using url.
			 */
			load: function(simulationURL) {
				if(this.status == this.StatusEnum.STARTED || this.status == this.StatusEnum.PAUSED) {
					this.stop();
				}
				
				//remove commands for all entities previously loaded
				for(var e in this.runTimeTree){
					GEPPETTO.Console.removeCommands(e);
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
						if(this.status == this.StatusEnum.INIT) {
							//we call it only the first time
							GEPPETTO.SceneController.animate();
						}
						GEPPETTO.MessageSocket.send(GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_PROJECT_FROM_URL, simulationURL);
						this.initializationTime = new Date();
						GEPPETTO.Console.debugLog("Message sent : " + this.initializationTime.getTime());
						loading = true;
						GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD);
						//trigger simulation restart event
						GEPPETTO.trigger(Events.Simulation_restarted);
					}
				}

				else {
					loadStatus = GEPPETTO.Resources.SIMULATION_UNSPECIFIED;
				}

				this.simulationStates = [];
				this.loading = true;

                GEPPETTO.trigger('simulation:show_spinner');

				return loadStatus;
			},

			/**
			 * Loads a simulation using the content's from the simulation file editor.
			 *
			 * @command GEPPETTO.Simulation.loadFromContent(content)
			 * @param {XML} content - XML content of simulation to be loaded.
			 * @returns {String} Status of attempt to load simulation from content window.
			 */
			loadFromContent: function(content) {
				if(this.status == this.StatusEnum.STARTED || this.status == this.StatusEnum.PAUSED) {
					this.stop();
				}
				
				//remove commands for all entities previously loaded
				for(var e in this.runTimeTree){
					GEPPETTO.Console.removeCommands(e);
				}
				this.runTimeTree = {};
				this.listeners=[];
				var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
				//update ui based on success of webgl
				GEPPETTO.FE.update(webGLStarted);
				//Keep going with load of simulation only if webgl container was created
				if(webGLStarted) {
					if(GEPPETTO.Simulation.status == GEPPETTO.Simulation.StatusEnum.INIT) {
						//we call it only the first time
						GEPPETTO.SceneController.animate();
					}

					GEPPETTO.MessageSocket.send(GEPPETTO.SimulationHandler.MESSAGE_TYPE.LOAD_PROJECT_FROM_CONTENT, content);
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.LOADING_FROM_CONTENT);
					GEPPETTO.trigger(Events.Simulation_restarted);
				}

				this.loading = true;
				
                GEPPETTO.trigger('simulation:show_spinner');

				return GEPPETTO.Resources.LOADING_SIMULATION;
			},

			/**
			 * Checks status of the simulation, whether it has been loaded or not.
			 *
			 * @command GEPPETTO.Simulation.isLoaded()
			 * @returns {Boolean} True if simulation has been loaded, false if not.
			 */
			isLoaded: function() {
				return this.status != this.StatusEnum.INIT;
			},
			
			/**
			 * Checks status of the simulation, whether it has been started or not.
			 *
			 * @command GEPPETTO.Simulation.isStarted()
			 * @returns {Boolean} True if simulation has been started, false if not.
			 */
			isStarted: function() {
				return this.status == this.StatusEnum.STARTED;
			},

			/**
			 * Checks status of the simulation, whether it's loading or not.
			 *
			 * @command GEPPETTO.Simulation.isLoading()
			 * @returns {Boolean} True if simulation is loading, false if not.
			 */
			isLoading: function() {
				return loading;
			},

			addTransferFunction: function(targetEntity, targetVar, transferFunction) {
				console.log(this.getWatchTree());
			},

			/**
			 * Add watchlists to the simulation.
			 *
			 * @command GEPPETTO.Simulation.setWatchedVariables(watchLists)
			 * @param {Array} watchLists - Array listing variables to be watched.
			 */
			setWatchedVariables: function(watchLists) {
				var watchedList = [];
				for (var index in watchLists){
					watchedList.push(watchLists[index].instancePath);
					
				}
				santasLittleHelper("set_watch", GEPPETTO.Resources.SIMULATION_SET_WATCH, GEPPETTO.Resources.MESSAGE_OUTBOUND_SET_WATCH, watchedList);

				return GEPPETTO.Resources.SIMULATION_SET_WATCH;
			},

			/**
			 * Clears all watch lists for the given simulation
			 *
			 * @command GEPPETTO.Simulation.clearWatchLists()
			 * @returns {String} Status after request.
			 */
			clearWatchLists: function() {
				santasLittleHelper("clear_watch", GEPPETTO.Resources.SIMULATION_CLEAR_WATCH, GEPPETTO.Resources.MESSAGE_OUTBOUND_CLEAR_WATCH, null);

				GEPPETTO.Simulation.simulationStates = [];

				return GEPPETTO.Resources.SIMULATION_CLEAR_WATCH;
			},

			/**
			 *
			 * Selects the entity passed as a parameter
			 *
			 * @command GEPPETTO.Simulation.selectEntity(entity)
			 * 
			 * @param {Entity} entity - Entity to be selected
			 */
			selectEntity: function(entity) {
				var message = GEPPETTO.Resources.CANT_FIND_ENTITY;
				if(entity.select()){
					message = GEPPETTO.Resources.SELECTING_ENTITY + entity.instancePath + ".";
				}
				else{
					message = GEPPETTO.Resources.ENTITY_ALREADY_SELECTED + entity.instancePath + ".";
				}
				
				return message;
			},
			
			/**
			 *
			 * Unselect entity
			 *
			 * @command GEPPETTO.Simulation.unselectEntity(entity)
			 * @param {Entity} entity - Entity to be unselected
			 */
			unselectEntity: function(entity) {
				var message = GEPPETTO.Resources.CANT_FIND_ENTITY;
				if(entity.unselect()){
					message = GEPPETTO.Resources.UNSELECTING_ENTITY + entity.instancePath + ".";
				}
				else{
					message = GEPPETTO.Resources.ENTITY_NOT_SELECTED + entity.instancePath + ".";
				}
				
				return message;
			},
			
			/**
			 *
			 * Outputs list of commands with descriptions associated with the Simulation object.
			 *
			 * @command GEPPETTO.Simulation.getSelection()
			 * @returns  {Array} Returns list of all entities selected
			 */
			getSelection : function() {
				var selection = this.traverseSelection(this.runTimeTree);
				
				return selection;
			},

			/**
			 * Helper method that traverses through run time tree looking for selected 
			 * entities.
			 */
			traverseSelection : function(entities){
				var selection = new Array();
				for(var e in entities){
					var entity = entities[e];
					if(entity.selected){
						if(entity.getEntities().length==0){
							selection[selection.length] = entity;
						}
					}
					if(entity.getEntities().length >0){
						selection = selection.concat(this.traverseSelection(entity.getEntities()));
					}
				}

				return selection;
			},
			
			/**
			 *
			 * Outputs list of commands with descriptions associated with the Simulation object.
			 *
			 * @command GEPPETTO.Simulation.help()
			 * @returns  Returns list of all commands for the Simulation object
			 */
			help: function() {
				return GEPPETTO.Utility.extractCommandsFromFile("assets/js/geppetto-objects/Simulation.js", GEPPETTO.Simulation, "Simulation");
			},

			/**
			 * Return status of simulation
			 */
			getSimulationStatus: function() {
				return this.status;
			},

			/**
			 * Sets status to simulation loaded, resets simulation states
			 */
			setSimulationLoaded: function() {
				this.status = GEPPETTO.Simulation.StatusEnum.LOADED;
				loading = false;
				this.loading = false;
				
				//Reset the simulation states
				this.simulationStates=[];				
			},
			
			/**
			 *
			 * Outputs list of commands with descriptions associated with the Simulation object.
			 *
			 * @command GEPPETTO.Simulation.getEntities()
			 * @returns {Array} Returns list of all entities selected
			 */
			getEntities : function(){
				var formattedOutput="";
				var indentation = "    ";

				return GEPPETTO.Utility.formatEntitiesTree(this.runTimeTree,formattedOutput, indentation);				
			},

			/**
			 * Modulates the brightness of an aspect visualization, given a watched node
			 * and a normalization function. The normalization function should receive
			 * the value of the watched node and output a number between 0 and 1,
			 * corresponding to min and max brightness. If no normalization function is
			 * specified, then brightness = value
			 * 
			 * @param {AspectNode} aspect - Aspect which contains the entity to be lit
			 * @param {String} objectReference - objectReference
			 * @param {VariableNode} modulation - Variable which modulates the brightness
			 * @param {Function} normalizationFunction
			 */
			addBrightnessFunction: function(aspect,modulation,normalizationFunction) {
				this.addOnNodeUpdatedCallback(modulation, function(varnode){
			    	GEPPETTO.SceneController.lightUpEntity(aspect.getInstancePath(),
			    			normalizationFunction ? normalizationFunction(varnode.getTimeSeries()[0].getValue()) : varnode.getTimeSeries()[0].getValue());
				});
			},

			clearBrightnessFunctions: function(varnode) {
				this.clearOnNodeUpdateCallback(varnode);
			},

			/**
			 * Callback to be called whenever a watched node changes
			 *
			 * @param {VariableNode} varnode - VariableNode to couple callback to
			 * @param {Function} callback - Callback function to be called whenever _variable_ changes
			 */
			addOnNodeUpdatedCallback: function(varnode, callback) {
				this.listeners[varnode.getInstancePath()] = callback;
			},
			
			/**
			 * Sets options that happened during selection of an entity. For instance, 
			 * user can set things that happened during selection as if connections inputs and outputs are shown,
			 * if connection lines are drawn and if other entities that were not selected are still visible.
			 * 
			 * @param {Object} options - New set of options for selection process
			 */
			setOnSelectionOptions : function(options){
				if(options.show_inputs != null){
					this.selectionOptions.show_inputs = options.show_inputs;
				}
				if(options.show_outputs != null){
					this.selectionOptions.show_outputs = options.show_outputs;
				}
				if(options.draw_connection_lines != null){
					this.selectionOptions.draw_connection_lines = options.draw_connection_lines;
				}
				if(options.hide_not_selected != null){
					this.selectionOptions.hide_not_selected = options.hide_not_selected;
				}
			},
			
			/**
			 * Options set for the selection event, turning on/off connections and lines.
			 * 
			 * @returns {Object} Options for selection.
			 */
			getSelectionOptions : function(){
				return this.selectionOptions;
			},
			
			/**
			 * Unselects all selected entities
			 * 
			 * @command Simulation.unSelectAll()
			 */
			unSelectAll : function(){
				var selection = this.getSelection();
				if(selection.length > 0){
					for(var key in selection){
						var entity = selection[key];
						entity.unselect();
					}
				}
				
				return GEPPETTO.Resources.UNSELECT_ALL;
			},
			
			/**
			 * Unhighlight all highlighted connections
			 * 
			 * @command Simulation.unHighlightAll()
			 */
			unHighlightAll : function(){
				for(var hc in this.highlightedConnections){
					this.highlightedConnections[hc].highlight(false);
				}
				
				return GEPPETTO.Resources.HIGHLIGHT_ALL;
			},
			
			/**
			 * Show unselected entities, leaving selected one(s) visible.
			 * 
			 * @param {boolean} mode - Toggle flag for showing unselected entities.
			 */
			showUnselected : function(mode){
				var selection = this.getSelection();
				var visible = {};
				for(var e in selection){
					var entity = selection[e];
					var connections = entity.getConnections();
					for(var c in connections){
						var con = connections[c];
						visible[con.getEntityInstancePath()] = "";
					}
				}
				this.toggleUnSelected(this.runTimeTree, mode,visible);
			},

			toggleUnSelected : function(entities, mode, visibleEntities){
				for(var e in entities){
					var entity = entities[e];
					if((!(entity.getInstancePath() in visibleEntities)) && entity.selected == false){
						if(mode){
							entity.hide();
						}
						else{
							entity.show();
						}
					}
					if(entity.getEntities()!=null){
						this.toggleUnSelected(entity.getEntities(), mode, visibleEntities);
					}
				}
			},

			/**
			 * Clears callbacks coupled to changes in a node 
			 * 
			 * @param {VariableNode} varnode - VariableNode to which callbacks are coupled
			 */
			clearOnNodeUpdateCallback: function(varnode) {
				this.listeners[varnode.getInstancePath()] = null;
			},

			/**
			 * Dynamically change the visual representation of an aspect,
			 * modulated by the value of a watched node. The _transformation_
			 * to be applied to the aspect visual representation should be a
			 * function receiving the aspect and the watched node's value,
			 * which can be normalized via the _normalization_ function. The
			 * latter is a function which receives the watched node's value
			 * an returns a float between 0 and 1.
			 * 
			 * @param {AspectNode} visualAspect - Aspect which contains the VisualizationTree with the entity to be dynamically changed
			 * @param {String} visualEntityName - Name of visual entity in the visualAspect VisualizationTree
			 * @param {VariableNode} dynVar - Dynamical variable which will modulate the transformation
			 * @param {Function} transformation - Transformation to act upon the visualEntity, given the modulation value
			 * @param {Function} normalization - Function to be applied to the dynamical variable, normalizing it to a suitable range according to _transformation_
			 */	
			addDynamicVisualization: function(visualAspect, visualEntityName, dynVar, transformation, normalization){
				//TODO: things should be VisualizationTree centric instead of aspect centric...  
		    	this.addOnNodeUpdatedCallback(dynVar, function(watchedNode){
		    		transformation(visualAspect, visualEntityName, normalization ? normalization(watchedNode.getTimeSeries()[0].getValue()) : watchedNode.getTimeSeries()[0].getValue());});
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
	};
});
