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
 * Client class use to represent a visual object reference node. This node 
 * points to a specific object within an aspect, stores object's id and aspect's
 * instancepath to keep track of location.
 * 
 * @module nodes/VisualObjectReferenceNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Node = require('nodes/Node');

	return Node.Model.extend({
		aspectInstancePath : null,
		visualObjectID : null,

		/**
		 * Initializes this node with passed attributes
		 * 
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			this.id = options.id;
			this.aspectInstancePath = options.aspectInstancePath;
			this.visualObjectID = options.visualObjectID;
			this.instancePath = options.instancePath;
			this._metaType = options._metaType;
			this.domainType = options.domainType;
		},

		/**
		 * Get aspect instance path for visual reference
		 * 
		 * @command VisualObjectReferenceNode.getAspectInstancePath()
		 * @returns {String} Aspect instance path for this visual reference node 
		 */
		getAspectInstancePath : function() {
			return this.aspectInstancePath;
		},
		
		/**
		 * Get ID of object this visual reference node refers to
		 * 
		 * @command VisualObjectReferenceNode.getVisualObjectID()
		 * @returns {String} ID of visual object this node references
		 */
		getVisualObjectID : function() {
			return this.visualObjectID;
		},
		
		/**
		 * Highlight visual object reference node
		 * @command VisualObjectReferenceNode.highlight()
		 * @param {boolean} mode - Highlight or unhighlight the visual reference
		 */
		highlight : function(mode){
			var pathToObject = this.getAspectInstancePath()+ ".VisualizationTree." + this.getVisualObjectID();
			if(mode){
				GEPPETTO.SceneController.split(this.getAspectInstancePath());
			}
			else{
				GEPPETTO.SceneController.merge(this.getAspectInstancePath());
			}
			GEPPETTO.SceneController.highlight(this.getAspectInstancePath(),pathToObject,mode);
			
			return GEPPETTO.Resources.HIGHLIGHTING + pathToObject;
		},

		/**
		 * Print out formatted node
		 */
		print : function() {
			return "Id : " + this.id + "\n" 
					+ "    AspectInstancePath : " + this.aspectInstancePath + "\n"
					+ "    VisualObjectID : " + this.visualObjectID + "\n";
		}
	});
});
