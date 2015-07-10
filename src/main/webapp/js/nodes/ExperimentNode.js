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
	return Backbone.Model.extend({

		name : "",
		description: "",
		id : "",
		lastModified : "",
		status : null,
		parent : null,
		variables : null,
		playOptions : {},
		played : false,
		worker : null,
		maxSteps : null,
		paused : false,
		parameters  :null,
		script : "",

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
			this.description=options.description;
			this.lastModified=options.lastModified;
			this.variables = new Array();
			this.simulatorConfigurations = {};
			this.played = false;
			this.parameters = new Array();
			this.script=options.script;
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
		setDescription : function(newdescription) {
			this.saveExperimentProperties({"description":newdescription});
			this.description = newdescription;
		},
		
		/**
		 * Gets the name of the node
		 *
		 * @command ExperimentNode.getName()
		 * @returns {String} Name of the node
		 *
		 */
		getDescription : function() {
			return this.description;
		},
		
		/**
		 * Gets the name of the node
		 *
		 * @command ExperimentNode.getLastModified()
		 * @returns {String} The time and date of when the experiment was modified last
		 *
		 */
		getLastModified : function() {
			return this.lastModified;
		},
		
		/**
		 * Gets the script associated with this expeirment
		 *
		 * @command ExperimentNode.getScript()
		 * @returns {String} The script associated with this experiment
		 *
		 */
		getScript : function() {
			return this.script;
		},
		
		
		
		/**
		 * Sets the script of the node
		 *
		 * @command ExperimentNode.setScript()
		 *
		 */
		setScript : function(script) {
			this.saveExperimentProperties({"script":script});
			this.script = script;
		},
		
		/**
		 * Sets the name of the node
		 *
		 * @command ExperimentNode.setName()
		 *
		 */
		setName : function(newname) {
			this.saveExperimentProperties({"name":newname});
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
			if(this.status == GEPPETTO.Resources.ExperimentStatus.DESIGN){
				GEPPETTO.trigger(Events.Experiment_running);
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
			var parameters = {};
			parameters["experimentId"] = this.id;
			parameters["projectId"] = this.getParent().getId();
			GEPPETTO.MessageSocket.send("load_experiment", parameters);
			GEPPETTO.trigger('project:show_spinner');
			GEPPETTO.trigger(Events.Experiment_active);
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
			if(this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED){
				if(this.paused){
					GEPPETTO.trigger(Events.Experiment_play);
					this.getWorker().postMessage([Events.Experiment_resume]);
					this.paused = false;
					return "Pause Experiment";
				}else{
					if(!this.played){
						GEPPETTO.trigger(Events.Experiment_play);
						var parameters = {};
						parameters["experimentId"] = this.id;
						parameters["projectId"] = this.getParent().getId();
						GEPPETTO.MessageSocket.send("play_experiment", parameters);
						return "Play Experiment";
					}else{
						GEPPETTO.Console.log("replay ");
						GEPPETTO.trigger(Events.Experiment_replay);
						this.terminateWorker();
						this.experimentUpdateWorker();
						return "Play Experiment";
					}
				}
			}else{
				GEPPETTO.FE.infoDialog(GEPPETTO.Resources.CANT_PLAY_EXPERIMENT, 
	            		"Experiment " + name + " with id " +
	            		id + " isn't completed, and can't be played.");
			}
		},
		
		pause : function(){
			this.paused = true;
			this.getWorker().postMessage([Events.Experiment_pause]);
			GEPPETTO.trigger(Events.Experiment_pause);
			return "Pause Experiment";
		},
		
		stop : function(){
			this.terminateWorker();
			this.paused = false;
			GEPPETTO.trigger(Events.Experiment_stop);
			return "Stop Experiment";
		},
		
		experimentUpdateWorker : function(){
			var lastExecutedStep = 0;
			var steps = this.playOptions.step;
			var playAll = this.playOptions.playAll;
			
			if(steps == null || undefined){
				steps = 0;
			}
			
			//create web worker
			this.worker = new Worker("assets/js/ExperimentWorker.js");
			
			//tells worker to update each half a second
			this.worker.postMessage([Events.Experiment_play, GEPPETTO.getVARS().playTimerStep, steps, playAll]);

			//receives message from web worker
            this.worker.onmessage = function (event) {
            	//get current timeSteps to execute from web worker
            	var step = event.data[0];
            	var maxSteps = window.Project.getActiveExperiment().maxSteps;
            	if(step >= maxSteps){
            		var parameters = {name : window.Project.getActiveExperiment().getName(),
            						  id : window.Project.getActiveExperiment().getId()};
            		window.Project.getActiveExperiment().terminateWorker();
            		GEPPETTO.trigger(Events.Experiment_over, parameters);
            	}else{
            		var playAllFlag = event.data[1];
            		var parameters = {steps : step, playAll : playAllFlag};
            		GEPPETTO.trigger(Events.Experiment_update, parameters);
            		if(playAllFlag){
            			//end worker, since we are playing all 
            			window.Project.getActiveExperiment().terminateWorker();
            			GEPPETTO.trigger(Events.Experiment_stop);
            		}
            	}
             };
		},
		
		saveExperimentProperties : function(properties) {
			var parameters = {};
			parameters["experimentId"] = this.id;
			parameters["projectId"] = this.getParent().getId();
			parameters["properties"] = properties;
			GEPPETTO.MessageSocket.send("save_experiment_properties", parameters);
		},
	
		
		terminateWorker : function(){
			if(this.worker!=undefined){
				this.worker.terminate();
				this.worker= undefined;
			}
		},
		
		getWorker : function(){
			return this.worker;
		},

		/**
		 * Start watching of variables for this experiment
		 *
		 * @command ExperimentNode.watchVariables()
		 */
		watchVariables : function(variables){
			var watchedVariables = [];
			for (var index in variables){
				watchedVariables.push(variables[index].getInstancePath());
			}
			if(this.status == GEPPETTO.Resources.ExperimentStatus.DESIGN){
				var parameters = {};
				parameters["experimentId"] = this.id;
				parameters["projectId"] = this.getParent().getId();
				parameters["variables"] = watchedVariables;
				GEPPETTO.MessageSocket.send("set_watched_variables", parameters);
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
		 * @command ProjectNode.setParameters(parameters)
		 * @returns {ExperimentNode} ExperimentNode for given name
		 */
		setParameters : function(aspectPath, newParameters){
			if(this.status == GEPPETTO.Resources.ExperimentStatus.DESIGN){
				var modelParameters = {};
				for (var index in newParameters){
					modelParameters[newParameters[index].getInstancePath()]=newParameters[index].getValue();
				}
				this.parameters = new Array();
				var parameters = {};
				parameters["experimentId"] = this.id;
				parameters["projectId"] = this.getParent().getId();
				parameters["modelAspectPath"] = aspectPath;
				parameters["modelParameters"] = modelParameters;
				
				for (var key in newParameters) {
					this.parameters.push(key);
				}
								
				GEPPETTO.MessageSocket.send("set_parameters", parameters);
				
				return "Sending request to set parameters";
			}
		},

		/**
		 * Download results for recording file
		 *
		 * @command ExperimentNode.downloadResults(recording)
		 */
		downloadResults : function(aspectPath,format){
			if(this == window.Project.getActiveExperiment()){
				if(this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED){
					var parameters = {};
					parameters["format"] = format;
					parameters["aspectPath"] = aspectPath;
					parameters["experimentId"] = this.id;
					parameters["projectId"] = this.getParent().getId();
					GEPPETTO.MessageSocket.send("download_results", parameters);
					
					return "Sending request to download results.";
				}else{
					return "Experiment must be completed before attempting to download results";
				}
			}else{
				return "Experiment must be set to active before requesting results";
			}
		},
		
		deleteExperiment : function(){
			var parameters = {};
			parameters["experimentId"] = this.id;
			parameters["projectId"] = this.getParent().getId();
			GEPPETTO.MessageSocket.send("delete_experiment", parameters);
			
			return "Request to delete experiment sent";
		},
		
		uploadModel : function(aspectPath,format){
			if(this == window.Project.getActiveExperiment()){
				if(this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED){
					var parameters = {};
					parameters["format"] = format;
					parameters["aspectPath"] = aspectPath;
					parameters["experimentId"] = this.id;
					parameters["projectId"] = this.getParent().getId();
					GEPPETTO.MessageSocket.send("upload_model", parameters);
					
					return "Sending request to upload results.";
				}else{
					return "Unable to upload model for an experimet that hasn't been completed";
				}
			}else{
				return "Experiment isn't active, make it active before continuing upload";
			}
		},
		
		uploadResults : function(aspectPath, format){
			if(this == window.Project.getActiveExperiment()){
				if(this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED){
					var parameters = {};
					parameters["format"] = format;
					parameters["aspectPath"] = aspectPath;
					parameters["experimentId"] = this.id;
					parameters["projectId"] = this.getParent().getId();
					GEPPETTO.MessageSocket.send("upload_results", parameters);
					
					return "Sending request to upload results.";
				}else{
					return GEPPETTO.Resources.EXPERIMENT_NOT_COMPLETED_UPLOAD;
				}
			}else{
				return GEPPETTO.Resources.UNACTIVE_EXPERIMENT_UPLOAD;
			}
		},

		/**
		 * Print out formatted node
		 */
		print : function() {
			return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n";
		},
		
		addSimulatorConfiguration : function(aspect, simulatorConfiguration){
			this.simulatorConfigurations[aspect]=simulatorConfiguration;
		}
		
		
	});
});
