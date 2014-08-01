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
 * Client class use to represent an Aspect. It stores that aspect's properties along with its
 * population, visualization and model tree.
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Node = require('nodes/Node');
	var $ = require('jquery');

	return Node.Model.extend({
		id:"",
		modelInterpreterName : "",
		simulatorName : "",
		modelURL : "",
		instancePath : "",
		ModelTree : null,
		VisualizationTree : {},
		SimulationTree : {},
		initialize : function(options){
			this.id = options.id;
			this.modelInterpreterName = options.modelInterpreter;
			this.simulatorName = options.simulator;
			this.modelURL = options.model;
			this.instancePath = options.instancePath;
		},


		/**
		 * Hides the aspect
		 *
		 * @name AspectNode.hide()
		 */
		 hide : function(){
		 },

		 /**
		  * Shows the aspect
		  *
		  * @name AspectNode.show()
		  */
		 show : function(){
		 },

		 /**
		  * Get the model interpreter associated with aspect
		  *
		  * @name AspectNode.getId()
		  */
		 getId : function(){
			 return this.id;
		 },

		 /**
		  * Get the model interpreter associated with aspect
		  *
		  * @name AspectNode.getModelInterpreterName()
		  */
		 getModelInterpreterName : function(){
			 return this.modelInterpreterName;
		 },

		 /**
		  * Get the simulator interpreter associated with aspect
		  *
		  * @name AspectNode.getSimulatorName()
		  */
		 getSimulatorName : function(){
			 return this.simulatorName;
		 },

		 /**
		  * Get model URL associated with the aspect
		  *
		  * @name AspectNode.getModelURL()
		  */
		 getModelURL : function(){
			 return this.modelURL;
		 },

		 /**
		  * Get visualization tree for aspect
		  * 
		  * @name AspectNode.getVisualizationTree()
		  */
		 getVisualizationTree : function(){
			 return this.VisualizationTree;	        	   
		 },

		 /**
		  * Get model tree for aspect
		  * 
		  * @name AspectNode.getModelTree()
		  */
		 getModelTree : function(){
			 if(this.ModelTree == null){
				 GEPPETTO.MessageSocket.send("get_model_tree", this.instancePath);
				 
				 return GEPPETTO.Resources.RETRIEVING_MODEL_TREE;
			 }
			 else{
				 var formattedNode = GEPPETTO.Utility.formatnode(this.ModelTree, 3, "");
				 formattedNode = formattedNode.substring(0, formattedNode.lastIndexOf("\n"));
				 formattedNode.replace(/"/g, "");

				 return GEPPETTO.Resources.RETRIEVING_MODEL_TREE + "\n" + formattedNode;
			 }
		 },

		 /**
		  * Get simulation watch tree for aspect
		  * 
		  * @name AspectNode.getSimulationTree()
		  */
		 getSimulationTree : function(){
			 return this.SimulationTree;       	   
		 },
	});
});