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
 * Client class for Project node.
 * 
 * @module nodes/ProjectNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define([ 'jquery', 'underscore', 'backbone', 
      // Add requirement for Backbone-associations module
],function(require) {

	return Backbone.Model.extend({
		experiments : null,
		activeExperiment : null,
		initializationTime : null,
		name : "",
		id : "",
		persisted:true,
		runTimeTree : {},

		/**
		 * Initializes this project with passed attributes
		 * 
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			this.experiments = new Array();
			this.name = options.name;
			this.id = options.id;
		},

		/**
		 * Gets the name of the node
		 * 
		 * @command Node.getName()
		 * @returns {String} Name of the node
		 * 
		 */
		getName : function() {
			return this.name;
		},

		/**
		 * Sets the name of the node
		 * 
		 * @command Node.setName()
		 * 
		 */
		setName : function(newname) {
			this.saveProjectProperties({"name":newname});
			this.name = newname;
		},

		/**
		 * Get the id associated with node
		 * 
		 * @command Node.getId()
		 * @returns {String} ID of node
		 */
		getId : function() {
			return this.id;
		},
		
		/**
		 * Get experiments for this project
		 * 
		 * @command ProjectNode.getExperiments()
		 * @returns {Array} Array of ExperimentNodes
		 */
		getExperiments : function() {
			return this.experiments;
		},
		
		/**
		 * Get experiment by id
		 * 
		 * @command ProjectNode.getExperimentById(id)
		 * @returns {Array} Array of ExperimentNodes
		 */
		getExperimentById : function(id) {
			var experiment = null;
			
			for(var i=0; i<this.experiments.length; i++){
				if(this.experiments[i].getId() == id){
					experiment = this.experiments[i];
					break;
				}
			}
			
			return experiment;
		},
		
		/**
		 * Set active experiment for this project
		 * 
		 * @command ProjectNode.setActiveExperiment()
		 * @param {ExperimentNode} experiment - Active Experiment
		 */
		setActiveExperiment : function(experiment){
			this.activeExperiment = experiment;
		},
		
		/**
		 * Get active experiment for this project
		 * 
		 * @command ProjectNode.getActiveExperiment()
		 * @returns ExperimentNode
		 */
		getActiveExperiment : function(){
			return this.activeExperiment;
		},
		
		/**
		 * Gets an experiment from this project. 
		 * 
		 * @command ProjectNode.getExperiment(name)
		 * @returns {ExperimentNode} ExperimentNode for given name
		 */
		getExperiment : function(name){
			return this.experiments[name];
		},
		
		/**
		 * Gets an experiment from this project. 
		 * 
		 * @command ProjectNode.getExperiment(name)
		 * @returns {ExperimentNode} ExperimentNode for given name
		 */
		getExperiment : function(name){
			return this.experiments[name];
		},
		
		/**
		 * Gets an experiment from this project. 
		 * 
		 * @command ProjectNode.newExperiment()
		 * @returns {ExperimentNode} Creates a new ExperimentNode
		 */
		newExperiment : function(){
			var parameters = {};
			parameters["projectId"] = this.id;
			GEPPETTO.MessageSocket.send("new_experiment", parameters);
		},
		
		/**
		 * Loads a project from content.
		 *
		 * @command Project.loadFromContent(projectID)
		 * @param {URL} projectID - Id of project to load
		 * @returns {String}  Status of attempt to load simulation using url.
		 */
		loadFromID: function(projectID,experimentID) {
			//TODO: Add logic for what happens after loading a new project
			//when one is already loaded
			var loadStatus = GEPPETTO.Resources.LOADING_PROJECT;

			if(projectID != null && projectID != "") {
				//Updates the simulation controls visibility
				var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
				//update ui based on success of webgl
				GEPPETTO.FE.update(webGLStarted);
				//Keep going with load of simulation only if webgl container was created
				if(webGLStarted) {
					var parameters = {};
					parameters["experimentId"] = experimentID;
					parameters["projectId"] = projectID;
					GEPPETTO.MessageSocket.send("load_project_from_id", parameters);
					this.initializationTime = new Date();
					GEPPETTO.Console.debugLog("Message sent : " + this.initializationTime.getTime());
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD);
				}
			}

			else {
				loadStatus = GEPPETTO.Resources.PROJECT_UNSPECIFIED;
			}

			return loadStatus;
		},
		
		/**
		 * Loads a project from url.
		 *
		 * @command Project.loadFromContent(projectURL)
		 * @param {URL} simulationURL - URL of project to be loaded
		 * @returns {String}  Status of attempt to load project using url.
		 */
		loadFromURL: function(projectURL) {
			//TODO: Add logic for what happens after loading a new project
			//when one is already loaded
			var loadStatus = GEPPETTO.Resources.LOADING_PROJECT;

			if(projectURL != null && projectURL != "") {
				//Updates the simulation controls visibility
				var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
				//update ui based on success of webgl
				GEPPETTO.FE.update(webGLStarted);
				//Keep going with load of simulation only if webgl container was created
				if(webGLStarted) {
					GEPPETTO.MessageSocket.send("load_project_from_url", projectURL);
					GEPPETTO.trigger(Events.Volatile_project_loaded);
					this.persisted=false;
					this.initializationTime = new Date();
					GEPPETTO.Console.debugLog("Message sent : " + this.initializationTime.getTime());
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD);
					//trigger simulation restart event
					GEPPETTO.trigger(Events.Simulation_restarted);
				}
			}

			else {
				loadStatus = GEPPETTO.Resources.PROJECT_UNSPECIFIED;
			}

			return loadStatus;
		},

		/**
		 * Loads a project from content.
		 *
		 * @command Project.loadFromContent(content)
		 * @param {String} content - Content of project to load
		 * @returns {String}  Status of attempt to load project
		 */
		loadFromContent: function(content) {
			//TODO: Add logic for what happens after loading a new project
			//when one is already loaded
			var loadStatus = GEPPETTO.Resources.LOADING_PROJECT;

			if(content != null && content != "") {
				//Updates the simulation controls visibility
				var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
				//update ui based on success of webgl
				GEPPETTO.FE.update(webGLStarted);
				//Keep going with load of simulation only if webgl container was created
				if(webGLStarted) {
					GEPPETTO.MessageSocket.send("load_project_from_content", content);
					this.initializationTime = new Date();
					GEPPETTO.Console.debugLog("Message sent : " + this.initializationTime.getTime());
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD);
					//trigger simulation restart event
					GEPPETTO.trigger(Events.Simulation_restarted);
				}
			}

			else {
				loadStatus = GEPPETTO.Resources.PROJECT_UNSPECIFIED;
			}
			return loadStatus;
		},
		
		saveProjectProperties : function(properties) {
			var parameters = {};
			parameters["projectId"] = this.getId();
			parameters["properties"] = properties;
			GEPPETTO.MessageSocket.send("save_project_properties", parameters);
		},
		
		persist : function(){
			var parameters = {};
			parameters["projectId"] = this.id;
			GEPPETTO.MessageSocket.send("persist_project", parameters);
		},

		/**
		 * Print out formatted node
		 */
		print : function() {
			return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n"
					+ "    InstancePath : " + this.instancePath + "\n"
					+ "    Properties : " + this.experiments + "\n";
		}
	});
});
