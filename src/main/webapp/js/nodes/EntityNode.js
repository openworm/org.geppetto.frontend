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
	var $ = require('jquery');

	return Node.Model
			.extend({
				relations : [ {
					type : Backbone.Many,
					key : 'aspects',
					relatedModel : AspectNode,
				}, {
					type : Backbone.Many,
					key : 'entities',
					relatedModel : Backbone.Self
				} ],

				defaults : {
					aspects : [],
					entities : [],
				},

				children : [],
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
					this.aspects = this.get("aspects").models;
				},

				/**
				 * Hides the entity
				 * 
				 * @command EntityNode.hide()
				 * 
				 */
				hide : function() {
					var message;

					if (GEPPETTO.hideEntity(this.instancePath)) {
						message = GEPPETTO.Resources.HIDE_ENTITY
								+ this.instancePath;
					} else {
						message = GEPPETTO.Resources.ENTITY_ALREADY_HIDDING;
					}
					this.visible = false;

					return message;
				},

				/**
				 * Shows the entity
				 * 
				 * @command EntityNode.show()
				 * 
				 */
				show : function() {
					var message;

					if (GEPPETTO.showEntity(this.instancePath)) {
						message = GEPPETTO.Resources.SHOW_ENTITY
								+ this.instancePath;
						this.visible = true;
					} else {
						message = GEPPETTO.Resources.ENTITY_ALREADY_VISIBLE;
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

					if (GEPPETTO.unselectEntity(this.instancePath)) {
						message = GEPPETTO.Resources.UNSELECTING_ENTITY
								+ this.instancePath;
						this.selected = false;

						// Notify any widgets listening that there has been a
						// changed to selection
						GEPPETTO.WidgetsListener
								.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.SELECTION_CHANGED);
					} else {
						message = GEPPETTO.Resources.ENTITY_NOT_SELECTED;
					}

					return message;
				},

				/**
				 * Selects the entity
				 * 
				 * @command EntityNode.unselect()
				 * 
				 */
				select : function() {

					var message;

					if (GEPPETTO.selectEntity(this.instancePath)) {
						message = GEPPETTO.Resources.SELECTING_ENTITY
								+ this.instancePath;
						this.selected = true;

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
				 * Zooms to entity
				 * 
				 * @command EntityNode.zoomTo()
				 * 
				 */
				/*
				 * zoomTo : function(){
				 * 
				 * GEPPETTO.zoomToEntity(this.instancePath);
				 * 
				 * return GEPPETTO.Resources.ZOOM_TO_ENTITY + this.instancePath; },
				 */

				/**
				 * Get this entity's aspects
				 * 
				 * @command EntityNode.getAspects()
				 * 
				 * @returns {List<Aspect>} List of aspects
				 * 
				 */
				getAspects : function() {
					var entities = this.get("aspects");
					return entities;
				},

				/**
				 * Get this entity's children entities
				 * 
				 * @command EntityNode.getEntities()
				 * 
				 * @returns {List<Entity>} List of entities
				 * 
				 */
				getEntities : function() {
					var entities = this.get("entities");
					return entities;
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
					var entities = this.get("entities");
					var aspects = this.get("aspects");

					return entities.add(aspects.toJSON());
				},

				/**
				 * Print out formatted node
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

					return formattedNode;
				}
			});
});