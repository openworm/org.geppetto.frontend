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
define(function(require) {

	var Node = require('nodes/Node');
	var AspectSubTreeNode = require('nodes/AspectSubTreeNode');
	var $ = require('jquery');

	return Node.Model.extend({
		id:"",
		modelInterpreter : "",
		simulator : "",
		model : "",
		instancePath : "",
		relations:[
		           {
		        	   type:Backbone.Many,
		        	   key:'aspectSubTrees',
		        	   relatedModel:AspectSubTreeNode,
		           },
		           ],
		           defaults : {
		        	   aspectSubTrees : [],
		           },
		           initialize : function(options){
		        	   this.id = options.id;
		        	   this.modelInterpreter = options.modelInterpreter;
		        	   this.simulator = options.simulator;
		        	   this.model = options.model;
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
		        	   return this.defaults.id;
		           },

		           /**
		            * Get the model interpreter associated with aspect
		            *
		            * @name AspectNode.getModelInterpreter()
		            */
		           getModelInterpreter : function(){
		        	   return this.defaults.modelInterpreter;
		           },

		           /**
		            * Get the simulator interpreter associated with aspect
		            *
		            * @name AspectNode.getSimulator()
		            */
		           getSimulator : function(){
		        	   return this.defaults.simulator;
		           },

		           /**
		            * Get model URL associated with the aspect
		            *
		            * @name AspectNode.getModel()
		            */
		           getModel : function(){
		        	   return this.defaults.model;
		           },

		           /**
		            * Get visualization tree for aspect
		            * 
		            * @name AspectNode.getVisualizationTree()
		            */
		           getVisualizationTree : function(){
		        	   var subtrees = this.get("aspectSubTrees");
		        	   for(var s=0; s<subtrees.length; s++){
		        		   if(subtrees.at(s).type == "VisualizationTree"){
		        			   return subtrees.at(s);
		        		   }
		        	   }	        	   
		           },

		           /**
		            * Get model tree for aspect
		            * 
		            * @name AspectNode.getModelTree()
		            */
		           getModelTree : function(){
		        	   var subtrees = this.get("aspectSubTrees");
		        	   for(var s=0; s<subtrees.length; s++){
		        		   if(subtrees.at(s).type == "ModelTree"){
		        			   return subtrees.at(s);
		        		   }
		        	   }	        	   
		           },

		           /**
		            * Get simulation watch tree for aspect
		            * 
		            * @name AspectNode.getSimulationTree()
		            */
		           getSimulationTree : function(){
		        	   var subtrees = this.get("aspectSubTrees");
		        	   for(var s=0; s<subtrees.length; s++){
		        		   if(subtrees.at(s).type == "SimulationTree"){
		        			   return subtrees.at(s);
		        		   }
		        	   }	        	   
		           },
	});
});