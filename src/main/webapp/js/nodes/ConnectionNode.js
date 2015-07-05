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
 * Client class use to represent a connection node, used to store the connections
 * between two entities in Geppetto.
 * 
 * @module nodes/ConnectionNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Node = require('nodes/Node');
	var VisualObjectReferenceNode = require('nodes/VisualObjectReferenceNode');

	return Node.Model.extend({
		customNodes : null,
		visualObjectReferenceNodes : null,
		entityInstancePath : null,
		type : null,
		highlighted : null,

		/**
		 * Initializes this node with passed attributes
		 * 
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			this.customNodes = new Array();
			this.visualObjectReferenceNodes = new Array();
			this.id = options.id;
			this.entityInstancePath = options.entityInstancePath;
			this.aspectNode = options.aspectNode;
			this.type = options.type;
			this.name = options.name;
			this.instancePath = options.instancePath;
			this._metaType = options._metaType;
			this.domainType = options.domainType;
		},

		/**
		 * Get Instance path of entity this connection is connected to
		 * 
		 * @command ConnectionNode.getEntityInstancePath()
		 * @returns {String} Entity instance patch for entity this connection 
		 *                   is connected to
		 */
		getEntityInstancePath : function() {
			return this.entityInstancePath;
		},
		
		/**
		 * Get type of connection
		 * 
		 * @command ConnectionNode.getType()
		 * @returns {String} Type of connection
		 */
		getType : function() {
			return this.type;
		},

		/**
		 * Returns array of custom nodes for this connection
		 * 
		 * @command ConnectionNode.getCustomNodes()
		 * @returns {Array} Array of nodes for custom properties of connection node.
		 */
		getCustomNodes : function(){
			return this.customNodes;
		},
		
		/**
		 * Returns array of visual object reference nodes for this connection
		 * @command ConnectionNode.getVisualObjectReferenceNodes()
		 * @returns {Array} Array of nodes for visual object references
		 */
		getVisualObjectReferenceNodes : function(){
			return this.visualObjectReferenceNodes;
		},
		
		/**
		 * Highlight the visual references of this connection
		 * @command ConnectionNode.highlight()
		 * @param {boolean} - Highlight or unhighlight reference nodes
		 */
		highlight : function(mode){
			
			if(mode == null || mode == undefined){
				return GEPPETTO.Resources.MISSING_PARAMETER;
			}
			
			var references = this.getVisualObjectReferenceNodes();
			var message = GEPPETTO.Resources.HIGHLIGHTING + this.id;
			
			if(references.length > 0){
				//highlight all reference nodes
				var targetObjects = {};
				var aspects = {};
				for(var ref in references){
					var pathToObject = references[ref].getAspectInstancePath()+ ".VisualizationTree." + references[ref].getVisualObjectID();
					targetObjects[pathToObject] = "";
					if(!(references[ref].getAspectInstancePath() in aspects)){
						aspects[references[ref].getAspectInstancePath()] = "";
					}
				}
				GEPPETTO.SceneController.highlight(targetObjects,aspects,mode);
			}else{
				message = GEPPETTO.Resources.NO_REFERENCES_TO_HIGHLIGHT;
			}
			
			this.highlighted = mode;
			G.highlightedConnections[this.getInstancePath()] = this;
						
			return message;
		},
		
		/**
		 * Show lines for connections of this entity
		 * @command ConnectionNode.showConnectionsLine()
		 */
		showConnectionsLine : function(mode){
			var from;
			var to;
			GEPPETTO.SceneController.drawLine(from,to);
		},
		
		/**
		 * Get this entity's children entities
		 * 
		 * @command ConnectionNode.getChildren()
		 * @returns {List<Aspect>} All children e.g. aspects and
		 *          entities
		 * 
		 */
		getChildren : function() {
			 var children = new Array();
			 children = children.concat(this.customNodes);
			 children  = children.concat(this.visualObjectReferenceNodes);
			 return children;
		},
		
		/**
		 * Print out formatted node
		 * @command ConnectionNode.print()
		 */
		print : function() {
			return "Id : " + this.id + "\n" 
					+ "    Name : " + this.name + "\n"
					+ "    ConnectionEntityInstancePath : " + this.entityInstancePath + "\n"
					+ "    Type : " + this.type + "\n";
		}
	});
});
