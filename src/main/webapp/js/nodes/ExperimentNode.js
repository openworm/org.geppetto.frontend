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

	var Node = require('nodes/Node');
	var ParameterNode = require('nodes/ParameterNode');
	/**
	 * 
	 * Different status an experiment can be on
	 * 
	 * @enum
	 */
	var ExperimentStatus = {
			DESIGN : 0,
			QUEUED : 1,
			RUNNING: 2,
			ERROR : 3,
			COMPLETED : 4,
			DELETED : 5,
	};
	
	return Node.Model.extend({
		status : null,

		/**
		 * Initializes this project with passed attributes
		 * 
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			this.name = options.name;
			this.id = options.id;
			this.instancePath = options.instancePath;
			this._metaType = options._metaType;
			this.status = ExperimentStatus.DESIGN;
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
				GEPPETTO.MessageSocket.send("load_experiment", parameters);
			}
		},
		
		/**
		 * Sets experiment status to active
		 * 
		 * @command ExperimentNode.run()
		 */
		setActive : function(){
			this.status = ExperimentStatus.RUNNING;
		},
		
		/**
		 * Play experiment
		 * 
		 * @command ExperimentNode.play()
		 */
		play : function(){
			if(this.status == ExperimentStatus.COMPLETED){
				this.setActive();
				var parameters = {};
				parameters["experimentId"] = this.id;
				parameters["projectID"] = this.getParent().getId();
				GEPPETTO.MessageSocket.send("play_experiment", parameters);
			}
		},
		
		/**
		 * Start watching of variables for this experiment 
		 * 
		 * @command ExperimentNode.watchVariables()
		 */
		watchVariables : function(){
			if(this.status == ExperimentStatus.DESIGN){
				
			}
		},

		/**
		 * Sets variables for experiment
		 * 
		 * @command ExperimentNode.setWatchVariables(variables)
		 */
		setVariables : function(variables){
			if(this.status == ExperimentStatus.DESIGN){
				
			}
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

		/**
		 * Print out formatted node
		 */
		print : function() {
			return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n"
					+ "    InstancePath : " + this.instancePath + "\n";
		}
	});
});
