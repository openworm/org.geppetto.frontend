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
 * Client class use to represent an Entity. It stores that aspect's properties
 * along with its population, visualization and model tree.
 * 
 * @module nodes/EntityNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	var Node = require('nodes/Node');
	var AspectNode = require('nodes/AspectNode');
	var ConnectionNode = require('nodes/ConnectionNode');

	return Node.Model
			.extend({
				aspects : null,
				entities : null,
				connections : null,
				position : null,
				selected : false,
				visible : true,
				/**
				 * Initializes this node with passed attributes
				 * 
				 * @param {Object} options - Object with options attributes to
				 *                           initialize node
				 */
				initialize : function(options) {
					this.id = options.id;
					this.name = options.name;
					this.position = options.position;
					this.instancePath = options.instancePath;
					this._metaType = options._metaType;
					this.domainType = options.domainType;
					this.entities = new Array();
					this.aspects = new Array();
					this.connections = new Array();
				},

				/**
				 * Shows the entity
				 * 
				 * @command EntityNode.show()
				 * 
				 */
				show : function() {
					var message;

					if (!this.visible) {
						message = GEPPETTO.Resources.SHOW_ENTITY
								+ this.instancePath;
						this.visible = true;
						
						this.showChildren(this, true);
					} else {
						message = GEPPETTO.Resources.ENTITY_ALREADY_VISIBLE;
					}

					return message;

				},
				
				/**
				 * Hides the entity
				 * 
				 * @command EntityNode.hide()
				 * 
				 */
				hide : function() {
					var message;

					if (this.visible) {
						message = GEPPETTO.Resources.HIDE_ENTITY
								+ this.instancePath;
						this.showChildren(this, false);
					} else {
						message = GEPPETTO.Resources.ENTITY_ALREADY_HIDDING;
					}
					this.visible = false;

					return message;
				},

				/**
				 * Selects the entity
				 * 
				 * @command EntityNode.unselect()
				 * 
				 */
				select : function() {
					//unselect all other selected entities prior to selecting this one
					G.unSelectAll();
										
					var message;
					if (!this.selected) {
						//traverse through children to select them as well
						this.selectChildren(this, true);
						
						var parent  = this.getParent();
						while(parent!=null){
							parent.selected = true;
							parent = parent.getParent();
						}
						
						message = GEPPETTO.Resources.SELECTING_ENTITY + this.instancePath;
						this.selected = true;
						//apply ghost effect to unselected nodes
						GEPPETTO.SceneController.setGhostEffect(true);
						
						//look on the simulation selection options and perform necessary
						//operations
						if(G.getSelectionOptions().show_inputs){
							this.showInputConnections(true);
						}
						if(G.getSelectionOptions().show_outputs){
							this.showOutputConnections(true);
						}
						if(G.getSelectionOptions().draw_connection_lines){
							this.showConnectionLines(true);
						}
						if(G.getSelectionOptions().hide_not_selected){
							G.showUnselected(false);
						}
						// Notify any widgets listening that there has been a
						// changed to selection
						GEPPETTO.WidgetsListener
								.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.SELECTION_CHANGED);
					} else {
						message = GEPPETTO.Resources.ENTITY_ALREADY_SELECTED;
					}

					return message;
				},
				
				/**
				 * Unselects the entity
				 * 
				 * @command EntityNode.unselect()
				 * 
				 */
				unselect : function() {
					var message;
					
					G.showUnselected(false);

					if (this.selected) {
						message = GEPPETTO.Resources.UNSELECTING_ENTITY
								+ this.instancePath;
						this.selected = false;
						
						this.selectChildren(this, false);

						var parent  = this.getParent();
						while(parent!=null){
							parent.selected = false;
							parent = parent.getParent();
						}
						
						//don't apply ghost effect to meshes if nothing is left selected after
						//unselecting this entity
						if(G.getSelection().length ==0){
							GEPPETTO.SceneController.setGhostEffect(false);
						}
						//update ghost effect after unselection of this entity
						else{
							GEPPETTO.SceneController.setGhostEffect(true);
						}
				
						//look on the simulation selection options and perform necessary
						//operations
						if(G.getSelectionOptions().show_inputs){
							this.showInputConnections(false);
						}
						if(G.getSelectionOptions().show_outputs){
							this.showOutputConnections(false);
						}
						if(G.getSelectionOptions().draw_connection_lines){
							this.showConnectionLines(false);
						}
						if(G.getSelectionOptions().hide_not_selected){
							G.showUnselected(false);
						}
					} else {
						message = GEPPETTO.Resources.ENTITY_NOT_SELECTED;
					}

					return message;
				},
				
				/**
				 * Helper method for selecting entity and all its children
				 * Not a console command
				 */
				selectChildren : function(entity, apply){
					var aspects = entity.getAspects();
					var entities = entity.getEntities();
					
					for(var a in aspects){
						var aspect = aspects[a];
						if(apply){
							if(!aspect.selected){
								GEPPETTO.SceneController.selectAspect(aspect.getInstancePath());
								aspect.selected = true;
							}
						}
						else{
							GEPPETTO.SceneController.unselectAspect(aspect.instancePath);
							aspect.selected = false;
							entity.selected = false;
						}
					}
								
					for(var e in entities){
						this.selectChildren(entities[e],apply);
					}
				},
				
				/**
				 * Helper method for showing/hiding entity and all its children.
				 * Not a console command. 
				 * @param {EntityNode} entity - Entity to traverse and alter visibility
				 * @param {boolean} apply - Visible or invisible
				 */
				showChildren : function(entity, mode){
					var aspects = entity.getAspects();
					var entities = entity.getEntities();
					
					for(var e in entities){
						this.showChildren(entities[e],mode);
					}
					
					for(var a in aspects){
						var aspect = aspects[a];
						if(mode){
							aspect.show();
						}
						else{
							aspect.hide();
						}
					}
				},
				
				/**
				 * Helper method for showing/hiding entity and all its children.
				 * Not a console command. 
				 * @param {EntityNode} entity - Entity to traverse and alter visibility
				 * @param {boolean} apply - Visible or invisible
				 */
				getZoomPaths : function(entity){
					var aspects = entity.getAspects();
					var entities = entity.getEntities();
					var aspectPaths = {};
					
					for(var e in entities){
						this.getZoomPaths(entities[e]);
					}
					
					for(var a in aspects){
						var aspect = aspects[a];
						aspectPaths[aspect.getInstancePath()]="";
					}
					
					return aspectPaths;
				},

				/**
				 * Zooms to entity
				 * 
				 * @command EntityNode.zoomTo()
				 * 
				 */
				 zoomTo : function(){		 
					 GEPPETTO.SceneController.zoomToMeshes(this.instancePath);
				 
					 return GEPPETTO.Resources.ZOOM_TO_ENTITY + this.instancePath; 
			     },
				 

				/**
				 * Get this entity's aspects
				 * 
				 * @command EntityNode.getAspects()
				 * @returns {List<Aspect>} List of aspects
				 * 
				 */
				getAspects : function() {
					return this.aspects;
				},

				/**
				 * Get this entity's children entities
				 * 
				 * @command EntityNode.getEntities()
				 * @returns {List<Entity>} List of entities
				 * 
				 */
				getEntities : function() {
					return this.entities;
				},
				
				/**
				 * Get this entity's connections
				 * 
				 * @command EntityNode.getConnections()
				 * @returns {List<ConnectionNode>} List of connections
				 * 
				 */
				getConnections : function() {
					return this.connections;
				},

				/**
				 * Get this entity's children entities
				 * 
				 * @command EntityNode.getChildren()
				 * @returns {List<Aspect>} All children e.g. aspects and entities
				 */
				getChildren : function() {
					 var children = new Array();
					 children = children.concat(this.aspects);
					 children = children.concat(this.entities);
					 children = children.concat(this.connections);
					 return children;
				},
				
				/**
				 * Show input connections for this entity
				 * @command EntityNode.showInputConnections()
				 * @param {boolean} mode- Show/hide input connections for this entity
				 */
				showInputConnections : function(mode){
					if(mode == null || mode == undefined){
						return GEPPETTO.Resources.MISSING_PARAMETER;
					}
					
					if(this.selected == false && (mode)){
						this.select();
					}
					var paths = new Array();
					//match all aspect paths that are connected to this entity
					for(var c in this.getConnections()){
						var connection = this.getConnections()[c];
						
						if(connection.getType() == GEPPETTO.Resources.INPUT_CONNECTION){
							var entity = 
								GEPPETTO.Utility.deepFind(window.Project.runTimeTree, connection.getEntityInstancePath());
							
							paths = paths.concat(this.getAspectPaths(entity));
						}
					}
					
					//show/hide connections
					if(mode){
						GEPPETTO.SceneController.showConnections(paths,GEPPETTO.Resources.INPUT_CONNECTION);
					}
					else{
						GEPPETTO.SceneController.hideConnections(paths);
					}
				},
				
				/**
				 * Get all the instance paths of the aspects associated with this entity. 
				 * Including children entitis aspects paths.  
				 */
				getAspectPaths : function(entity){
					var aspects = entity.getAspects();
					var entities = entity.getEntities();
					
					var paths = new Array();
					for(var a in aspects){
						var aspect = aspects[a];
						
						paths.push(aspect.getInstancePath());
					}
					
					for(var e in entities){
						var ent = entities[e];
						
						paths = paths.concat(this.getAspectPaths(ent));
					}
					return paths;
				},
				
				/**
				 * Show connection lines for this entity.
				 
				 * @command EntityNode.showConnectionLines()
				 * @param {boolean} mode - Show or hide connection lines
				 */
				showConnectionLines : function(mode){
					if(mode == null || mode == undefined){
						return GEPPETTO.Resources.MISSING_PARAMETER;
					}
					
					var lines = {};
					for(var c in this.getConnections()){
						var connection = this.getConnections()[c];
						
						var entity = 
							GEPPETTO.Utility.deepFind(window.Project.runTimeTree, connection.getEntityInstancePath());
						
						var paths = this.getAspectPaths(entity);
						
						for(var p in paths){
							lines[paths[p]] = connection.getType();
						}
					}
					
					var origin = this.getAspects()[0].getInstancePath();
					//show/hide connection lines
					if(mode){
						if(!jQuery.isEmptyObject(lines)){
							GEPPETTO.SceneController.showConnectionLines(origin,lines);
						}
					}
					else{
						GEPPETTO.SceneController.hideConnectionLines();
					}
				},
				
				/**
				 * Show output connections for this entity.
				 
				 * @command EntityNode.showOutputConnections()
				 * @param {boolean} mode - Show or hide output connections
				 */
				showOutputConnections : function(mode){
					if(mode == null || mode == undefined){
						return GEPPETTO.Resources.MISSING_PARAMETER;
					}
					
					//unselect all previously selected nodes
					if(this.selected == false && (mode)){
						this.select();
					}
					
					var paths = new Array();
					for(var c in this.getConnections()){
						var connection = this.getConnections()[c];
						
						if(connection.getType() == GEPPETTO.Resources.OUTPUT_CONNECTION){
							var entity = 
								GEPPETTO.Utility.deepFind(window.Project.runTimeTree, connection.getEntityInstancePath());
							
							paths = paths.concat(this.getAspectPaths(entity));
						}
					}
					
					//show/hide output connections call
					if(mode){
						GEPPETTO.SceneController.showConnections(paths,GEPPETTO.Resources.OUTPUT_CONNECTION);
					}
					else{
						GEPPETTO.SceneController.hideConnections(paths);
					}
				},

				/**
				 * Print out formatted node
				 * @command EntityNode.print()
				 */
				print : function() {
					var formattedNode = "Name : " + this.name + "\n"
							+ "      Id: " + this.id + "\n"
							+ "      InstancePath : " + this.instancePath
							+ "\n";
					for ( var e in this.entities) {
						formattedNode = formattedNode + "      " + "Entity: "
								+ this.entities[e].instancePath;
					}

					for ( var e in this.aspects) {
						formattedNode = formattedNode + "      " + "Aspect: "
								+ this.aspects[e].instancePath;
					}
					
					for ( var e in this.connections) {
						formattedNode = formattedNode + "      " + "Connection: "
								+ this.connections[e].id;
					}

					return formattedNode;
				}
			});
});
