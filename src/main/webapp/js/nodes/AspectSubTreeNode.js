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
 * Client class use to represent a composite variable node, used for simulation
 * tree state variables.
 * 
 * @module nodes/AspectSubTreeNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	var Node = require('nodes/Node');

	return Node.Model.extend({
		relations : [ {
			type : Backbone.Many,
			key : 'children',
			relatedModel : Node
		} ],
		defaults : {
			children : []
		},
		type : "",
		modified : false,

		/**
		 * Initializes this node with passed attributes
		 * 
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			this.id = options.id;
			this.instancePath = options.instancePath;
			this.name = options.name;
			this.type = options.type;
			this.modified = options.modified;
			this._metaType = options._metaType;
			this.domainType = options.domainType;
		},

		/**
		 * Get this entity's aspects
		 * 
		 * @command CompositeVariableNode.getChildren()
		 * 
		 * @returns {List<Node>} - List of children nodes
		 * 
		 */
		getChildren : function() {
			var children = this.get("children");
			return children;
		},

		/**
		 * Print out formatted node
		 */
		print : function() {
			// simulation tree is empty
			if (this.getChildren().length == 0) {
				if (this.type == "SimulationTree") {
					return GEPPETTO.Resources.NO_SIMULATION_TREE;
				} else if (this.type == "VisualizationTree") {
					var formattedNode = GEPPETTO.Utility
							.formatVisualizationTree(this.content, 3, "");
					formattedNode = formattedNode.substring(0, formattedNode
							.lastIndexOf("\n"));
					formattedNode.replace(/"/g, "");

					return GEPPETTO.Resources.RETRIEVING_VISUALIZATION_TREE
							+ "\n" + formattedNode;
				}
				if (this.type == "ModelTree") {
					return GEPPETTO.Resources.EMPTY_MODEL_TREE;
				}
			} else {
				if (this.type == "SimulationTree") {
					var formattedNode = GEPPETTO.Utility.formatsimulationtree(
							this, 3, "");
					formattedNode = formattedNode.substring(0, formattedNode
							.lastIndexOf("\n"));
					formattedNode.replace(/"/g, "");

					return GEPPETTO.Resources.RETRIEVING_SIMULATION_TREE + "\n"
							+ formattedNode;
				} else if (this.type == "VisualizationTree") {
					var formattedNode = GEPPETTO.Utility
							.formatVisualizationTree(this, 3, "");
					formattedNode = formattedNode.substring(0, formattedNode
							.lastIndexOf("\n"));
					formattedNode.replace(/"/g, "");

					return GEPPETTO.Resources.RETRIEVING_VISUALIZATION_TREE
							+ "\n" + formattedNode;
				} else if (this.type == "ModelTree") {
					var formattedNode = GEPPETTO.Utility.formatmodeltree(this,
							3, "");
					formattedNode = formattedNode.substring(0, formattedNode
							.lastIndexOf("\n"));
					formattedNode.replace(/"/g, "");

					return GEPPETTO.Resources.RETRIEVING_MODEL_TREE + "\n"
							+ formattedNode;
				}
			}
		}
	});
});
