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
		modelInterpreterName : "",
		simulatorName : "",
		modelURL : "",
		selected : false,
		ModelTree : {},
		VisualizationTree : {},
		SimulationTree : {},
		_metaType : "AspectNode",
		
		initialize : function(options){
			this.id = options.id;
			this.modelInterpreterName = options.modelInterpreter;
			this.simulatorName = options.simulator;
			this.modelURL = options.model;
			this.instancePath = options.instancePath;
			this.name = options.name;
		},


		/**
         * Hides the aspect
         *
         * @name AspectNode.hide()
         *
         */
        hide : function(){
     	   var message; 
     	   
     	   if(GEPPETTO.hideAspect(this.instancePath)){
     		   message = GEPPETTO.Resources.HIDE_ASPECT + this.instancePath;
     	   }
     	   else{
     		   message = GEPPETTO.Resources.ASPECT_ALREADY_HIDDING;
     	   }
     	   this.visible = false;
     	   
			   return message;
        },

        /**
         * Shows the aspect
         *
         * @name AspectNode.show()
         *
         */
        show : function(){
     	   var message; 
     	   
     	   if(GEPPETTO.showAspect(this.instancePath)){
     		   message = GEPPETTO.Resources.SHOW_ASPECT + this.instancePath;
     	   }
     	   else{
     		   message = GEPPETTO.Resources.ASPECT_ALREADY_VISIBLE;
     	   }
     	   this.visible = true;
     	   
			   return message;
     	   						
        },
        
        /**
         * Unselects the aspect
         *
         * @name AspectNode.unselect()
         *
         */
        unselect : function(){
     	   var message; 
     	   
     	   if(GEPPETTO.unselectAspect(this.instancePath)){
     		   message = GEPPETTO.Resources.UNSELECTING_ASPECT + this.instancePath;
     	   }
     	   else{
     		   message = GEPPETTO.Resources.ASPECT_NOT_SELECTED;
     	   }
     	   this.selected = false;
     	   
			   return message;
        },

        /**
         * Selects the aspect
         *
         * @name AspectNode.unselect()
         *
         */
        select : function(){

        	var message; 

        	if(GEPPETTO.selectAspect(this.instancePath)){
        		message = GEPPETTO.Resources.SELECTING_ASPECT + this.instancePath;
        	}
        	else{
        		message = GEPPETTO.Resources.ASPECT_ALREADY_SELECTED;
        	}
        	this.selected = true;

        	return message;
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
		  * Get formatted model tree for this aspect
		  * 
		  * @name AspectNode.getModelTree()
		  */
		 getModelTree : function(){
			 //empty model tree, request server for it
			 if(jQuery.isEmptyObject(this.ModelTree)){
				 GEPPETTO.MessageSocket.send("get_model_tree", this.instancePath);
				 
				 return GEPPETTO.Resources.RETRIEVING_MODEL_TREE;
			 }
			 //model tree isn't empty, was requested previously and stored
			 else{
				 var formattedNode = GEPPETTO.Utility.formatmodeltree(this.ModelTree, 3, "");
				 formattedNode = formattedNode.substring(0, formattedNode.lastIndexOf("\n"));
				 formattedNode.replace(/"/g, "");

				 return GEPPETTO.Resources.RETRIEVING_MODEL_TREE + "\n" + formattedNode;
			 }
		 },

		 /**
		  * Get formatted simulation watch tree for this aspect. 
		  * 
		  * @name AspectNode.getSimulationTree()
		  */
		 getSimulationTree : function(){
			 //simulation tree is empty
			 if(jQuery.isEmptyObject(this.SimulationTree)){
				 return GEPPETTO.Resources.NO_SIMULATION_TREE;
			 }
			 else{
				 var formattedNode = GEPPETTO.Utility.formatsimulationtree(this.SimulationTree, 3, "");
				 formattedNode = formattedNode.substring(0, formattedNode.lastIndexOf("\n"));
				 formattedNode.replace(/"/g, "");

				 return GEPPETTO.Resources.RETRIEVING_SIMULATION_TREE + "\n" + formattedNode;
			 }       	   
		 },
		 
		 getChildren : function(){
			 var children = new Array();
			 if (!$.isEmptyObject(this.ModelTree)){
				 children.push(this.ModelTree);
			 }
			 if (!$.isEmptyObject(this.SimulationTree)){
				 children.push(this.SimulationTree);
			 }
			 if (!$.isEmptyObject(this.VisualizationTree)){
				 children.push(this.VisualizationTree);
			 }
			 return children; 
		 }
	});
});