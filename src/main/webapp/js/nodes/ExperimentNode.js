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
 * Client class for Experiment node.
 *
 * @module nodes/ExperimentNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var ParameterNode = require('nodes/ParameterNode');
	/**
	 *
	 * Different status an experiment can be on
	 *
	 * @enum
	 */
	var ExperimentStatus = {
			DESIGN : "DESIGN",
			CANCELED : "CANCELED",
			QUEUED : "QUEUED",
			RUNNING: "RUNNING",
			ERROR : "ERROR",
			COMPLETED : "COMPLETED",
			DELETED : "DELETED",
	};

	return Backbone.Model.extend({

		name : "",
		id : "",
		status : null,
		parent : null,
		variables : null,
		playOptions : {},
		played : false,
		worker : null,

		/**
		 * Initializes this experiment with passed attributes
		 *
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			this.name = options.name;
			this.id = options.id;
			this.status = options.status;
			this.variables = new Array();
			this.played = false;
		},

		/**
		 * Gets the name of the node
		 *
		 * @command ExperimentNode.getName()
		 * @returns {String} Name of the node
		 *
		 */
		getName : function() {
			return this.name;
		},

		/**
		 * Sets the name of the node
		 *
		 * @command ExperimentNode.setName()
		 *
		 */
		setName : function(newname) {
			this.name = newname;
		},

		/**
		 * Get the id associated with node
		 *
		 * @command ExperimentNode.getId()
		 * @returns {String} ID of node
		 */
		getId : function() {
			return this.id;
		},

		setParent : function(parent){
			this.parent = parent;
		},

		getParent : function(){
			return this.parent;
		},

		/**
		 * Get current status of this experiment
		 *
		 * @command ExperimentNode.getStatus()
		 * @returns {String} Status of experiment
		 */
		getStatus : function() {
			return this.status;
		},
		
		setStatus : function(status){
			this.status = status;
		},

		/**
		 * Run experiment
		 *
		 * @command ExperimentNode.run()
		 */
		run : function(){
			if(this.status == ExperimentStatus.DESIGN){
				var parameters = {};
				parameters["experimentId"] = this.id;
				parameters["projectId"] = this.getParent().getId();
				GEPPETTO.MessageSocket.send("run_experiment", parameters);
			}
		},

		/**
		 * Sets experiment status to active
		 *
		 * @command ExperimentNode.run()
		 */
		setActive : function(){
			//Updates the simulation controls visibility
			var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
			//update ui based on success of webgl
			GEPPETTO.FE.update(webGLStarted);
			//Keep going with load of simulation only if webgl container was created
			if(webGLStarted) {
				//we call it only the first time
				GEPPETTO.SceneController.animate();

				var parameters = {};
				parameters["experimentId"] = this.id;
				parameters["projectId"] = this.getParent().getId();
				this.getParent().setActiveExperiment(this);

				GEPPETTO.MessageSocket.send("load_experiment", parameters);
				GEPPETTO.trigger('project:show_spinner');
			}
		},

		/**
		 * Play experiment.
		 * Takes a JS object as parameter where two options can be set,
		 * but not together: steps or playAll.
		 * If experiment is to be play all at once:
		 * {playAll : true} 
		 * If experiment is to be play by timeSteps:
		 * {steps : 1} where the value can be something else than 1.
		 *
		 * @command ExperimentNode.play()
		 */
		play : function(options){
			//set options
			this.playOptions = options;
			if(this.status == ExperimentStatus.COMPLETED){
	            GEPPETTO.trigger(Events.Experiment_play);
				if(!this.played){
					var parameters = {};
					parameters["experimentId"] = this.id;
					parameters["projectId"] = this.getParent().getId();
					GEPPETTO.MessageSocket.send("play_experiment", parameters);
				}else{
					this.worker.terminate();
					this.worker = undefined;
					this.experimentUpdateWorker();
				}
			}else{
				GEPPETTO.FE.infoDialog(GEPPETTO.Resources.CANT_PLAY_EXPERIMENT, 
	            		"Experiment " + name + " with id " +
	            		id + " isn't completed, and can't be played.");
			}
		},
		
		experimentUpdateWorker : function(){
			var lastExecutedStep = 0;
			var steps = this.playOptions.step;
			var playAll = this.playOptions.playAll;
			
			//create web worker
			this.worker = new Worker("assets/js/ExperimentWorker.js");

			//only use web worker if user doesn't want to play all at once
			GEPPETTO.Console.debugLog("update experiment");
			//tells worker to update each half a second
			this.worker.postMessage([20,steps, playAll]);

			//receives message from web worker
            this.worker.onmessage = function (event) {
            	//get current timeSteps to execute from web worker
            	var step = event.data[0];
            	var playAllFlag = event.data[1];
            	var parameters = {steps : step, playAll : playAllFlag};
	            GEPPETTO.trigger(Events.Experiment_update, parameters);
	            if(playAllFlag){
	            	this.terminate();
	            }
             };
		},

		/**
		 * Start watching of variables for this experiment
		 *
		 * @command ExperimentNode.watchVariables()
		 */
		watchVariables : function(variables){
			if(this.status == ExperimentStatus.DESIGN){
				var parameters = {};
				parameters["experimentId"] = this.id;
				parameters["projectId"] = this.getParent().getId();
				parameters["variables"] = variables;
				GEPPETTO.MessageSocket.send("set_watch", parameters);
			}
			
			for(var i in variables){
				this.variables.push(variables[i]);
			}
		},
		
		getVariables : function(){
			return this.variables;
		},
		
		getPlayOptions : function(){
			return this.playOptions;
		},

		/**
		 * Gets an experiment from this project.
		 *
		 * @command ProjectNode.getExperiment(name)
		 * @returns {ExperimentNode} ExperimentNode for given name
		 */
		setParameters : function(parameters){
			if(this.status == ExperimentStatus.DESIGN){
			}
		},

		/**
		 * Download results for recording file
		 *
		 * @command ExperimentNode.downloadResults(recording)
		 */
		downloadResults : function(recording){
			if(this.status == ExperimentStatus.COMPLETED){

			}
		},
		
		deleteExperiment : function(){
			var parameters = {};
			parameters["experimentId"] = this.id;
			parameters["projectId"] = this.getParent().getId();
			GEPPETTO.MessageSocket.send("delete_experiment", parameters);
		},

		/**
		 * Print out formatted node
		 */
		print : function() {
			return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n";
		}
	});
});
