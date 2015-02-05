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
 * Client class use to represent an Aspect. It stores that aspect's properties
 * along with its population, visualization and model tree.
 * 
 * @module nodes/AspectNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Node = require('nodes/Node');
	var AspectSubTreeNode = require('nodes/AspectSubTreeNode');

	return Node.Model
			.extend({
				relations : [ {
					type : Backbone.Many,
					key : 'children',
					relatedModel : AspectSubTreeNode,
				}, ],

				defaults : {
					children : []
				},
				modelInterpreterName : "",
				simulatorName : "",
				modelURL : "",
				selected : false,
				ModelTree : {},
				VisualizationTree : {},
				SimulationTree : {},
				visible : true,
				/**
				 * Initializes this node with passed attributes
				 * 
				 * @param {Object} options - Object with options attributes to
				 *                           initialize node
				 */
				initialize : function(options) {
					this.id = options.id;
					this.modelInterpreterName = options.modelInterpreter;
					this.simulatorName = options.simulator;
					this.modelURL = options.model;
					this.instancePath = options.instancePath;
					this.name = options.name;
					this._metaType = options._metaType;
					this.domainType = options.domainType;
				},

				/**
				 * Hides the aspect
				 * 
				 * @command AspectNode.hide()
				 * 
				 */
				hide : function() {
					var message;
					if (this.visible) {
						GEPPETTO.SceneController.hideAspect(this.instancePath);
						
						//update visible flag on parents
						var parent  = this.getParent();
						while(parent!=null){
							parent.visible = false;
							parent = parent.getParent();
						}
						
						message = GEPPETTO.Resources.HIDE_ASPECT
								+ this.instancePath;
					} else {
						message = GEPPETTO.Resources.ASPECT_ALREADY_HIDDING;
					}
					this.visible = false;
					return message;
				},
				/**
				 * Shows the aspect
				 * 
				 * @command AspectNode.show()
				 * 
				 */
				show : function() {
					var message;
					if (!this.visible) {
						GEPPETTO.SceneController.showAspect(this.instancePath);
						
						//update visible flag on parents
						var parent  = this.getParent();
						while(parent!=null){
							parent.visible = true;
							parent = parent.getParent();
						}
						
						message = GEPPETTO.Resources.SHOW_ASPECT
								+ this.instancePath;
					} else {
						message = GEPPETTO.Resources.ASPECT_ALREADY_VISIBLE;
					}
					this.visible = true;
					return message;
				},
				
				/**
				 * Selects the aspect
				 * 
				 * @command AspectNode.unselect()
				 * 
				 */
				select : function() {
					var message;
					if (!this.selected) {
						GEPPETTO.SceneController.selectAspect(this.instancePath);				
						message = GEPPETTO.Resources.SELECTING_ASPECT + this.instancePath;
						this.selected = true;
						
						var parent  = this.getParent();
						while(parent!=null){
							parent.selected = true;
							parent = parent.getParent();
						}
						
						GEPPETTO.SceneController.setGhostEffect(true);
						
						//look on the simulation selection options and perform necessary
						//operations
						if(Simulation.getSelectionOptions().show_inputs){
							this.getParent().showInputConnections(true);
						}
						if(Simulation.getSelectionOptions().show_outputs){
							this.getParent().showOutputConnections(true);
						}
						if(Simulation.getSelectionOptions().draw_connection_lines){
							this.getParent().showConnectionLines(true);
						}
						if(Simulation.getSelectionOptions().hide_not_selected){
							Simulation.showUnselected(true);
						}
						//signal selection has changed in simulation
						GEPPETTO.trigger(Events.Select);
					} else {
						message = GEPPETTO.Resources.ASPECT_ALREADY_SELECTED;
					}

					return message;
				},

				/**
				 * Unselects the aspect
				 * 
				 * @command AspectNode.unselect()
				 * 
				 */
				unselect : function() {
					var message;
					Simulation.showUnselected(false);
					if (this.selected) {
						message = GEPPETTO.Resources.UNSELECTING_ASPECT
								+ this.instancePath;
						GEPPETTO.SceneController.unselectAspect(this.instancePath);
						this.selected = false;
						
						var parent  = this.getParent();
						while(parent!=null){
							parent.selected = false;
							parent = parent.getParent();
						}
						
						//don't apply ghost effect to meshes if nothing is left selected after
						//unselecting this entity
						if(Simulation.getSelection().length ==0){
							GEPPETTO.SceneController.setGhostEffect(false);
						}
						//update ghost effect after unselection of this entity
						else{
							GEPPETTO.SceneController.setGhostEffect(true);
						}
						
						//look on the simulation selection options and perform necessary
						//operations
						if(Simulation.getSelectionOptions().show_inputs){
							this.getParent().showInputConnections(false);
						}
						if(Simulation.getSelectionOptions().show_outputs){
							this.getParent().showOutputConnections(false);
						}
						if(Simulation.getSelectionOptions().draw_connection_lines){
							this.getParent().showConnectionLines(false);
						}
						if(Simulation.getSelectionOptions().hide_not_selected){
							Simulation.showUnselected(false);
						}
					
						//trigger event that selection has been changed
						GEPPETTO.trigger(Events.Selection);
					} else {
						message = GEPPETTO.Resources.ASPECT_NOT_SELECTED;
					}
					return message;
				},
				
				/**
				 * Zooms to aspect
				 * 
				 * @command AspectNode.zoomTo()
				 * 
				 */
				 zoomTo : function(){
					 GEPPETTO.SceneController.zoom(this.instancePath);
				 
					 return GEPPETTO.Resources.ZOOM_TO_ENTITY + this.instancePath; 
			     },
				
				/**
				 * Get the model interpreter associated with aspect
				 * 
				 * @command AspectNode.getId()
				 */
				getId : function() {
					return this.id;
				},

				/**
				 * Get this entity's children entities
				 * 
				 * @command EntityNode.getChildren()
				 * 
				 * @returns {List<Aspect>} All children e.g. aspects and
				 *          entities
				 * 
				 */
				getChildren : function() {
					var subtrees = this.get("children");

					return subtrees;
				},

				/**
				 * Get the model interpreter associated with aspect
				 * 
				 * @command AspectNode.getModelInterpreterName()
				 */
				getModelInterpreterName : function() {
					return this.modelInterpreterName;
				},

				/**
				 * Get the simulator interpreter associated with aspect
				 * 
				 * @command AspectNode.getSimulatorName()
				 */
				getSimulatorName : function() {
					return this.simulatorName;
				},

				/**
				 * Get model URL associated with the aspect
				 * 
				 * @command AspectNode.getModelURL()
				 */
				getModelURL : function() {
					return this.modelURL;
				},

				/**
				 * Get formatted model tree for this aspect
				 * 
				 * @command AspectNode.getModelTree()
				 */
				getModelTree : function() {
					// empty model tree, request server for it
					if (this.ModelTree.getChildren().length == 0) {
						GEPPETTO.MessageSocket.send("get_model_tree",
								this.instancePath);

						return GEPPETTO.Resources.RETRIEVING_MODEL_TREE;
					}
					// model tree isn't empty, was requested previously and
					// stored
					else {
						return this.ModelTree;
					}
				},

				/**
				 * Get formatted simulation watch tree for this aspect.
				 * 
				 * @command AspectNode.getSimulationTree()
				 */
				getSimulationTree : function() {
					return this.SimulationTree;
				},

				/**
				 * Get formatted visualization watch tree for this aspect.
				 * 
				 * @command AspectNode.getVisualizationTree()
				 */
				getVisualizationTree : function() {
					return this.VisualizationTree;
				},

				/**
				 * Print out formatted node
				 */
				print : function() {
					var formattedNode = "Name : " + this.name + "\n"
							+ "      Id: " + this.id + "\n"
							+ "      InstancePath : " + this.instancePath
							+ "\n" + "      SubTree : ModelTree \n"
							+ "      SubTree : VisualizationTree \n"
							+ "      SubTree : SimulationTree \n";

					return formattedNode;
				},
			});
});
