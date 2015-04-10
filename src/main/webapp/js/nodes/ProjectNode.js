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
define(function(require) {

	var Node = require('nodes/Node');

	return Node.Model.extend({
		experiments : null,

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
			this.instancePath = options.instancePath;
			this._metaType = options._metaType;
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
			/*
			 * When initializing a node when set its name, id and instancepath. 
			 * We do it here by adding them to an object, and passing this object
			 * as parameter in node.
			 */
			var experimentParameters = {};
			//assign name base on experiments array length, not avoid same names
			experimentParameters["name"] = "Experiment"+this.experiments.length;
			experimentParameters["id"] = "Experiment"+this.experiments.length;
			//instance path consists of project id and this experimetn id
			experimentParameters["instancePath"] = this.id+experimentParameters["id"];
			return new ExperimentNode(experimentParameters);
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
