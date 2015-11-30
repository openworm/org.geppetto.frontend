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
 * Client class use to represent a html metadata node, used for model
 * tree properties.
 * 
 * @module model/HTMLMetadataNode
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function(require) {

	var Node = require('model/Node');

	return Node.Model.extend({
		value : "",

		/**
		 * Initializes this node with passed attributes
		 * 
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			this.name = options.name;
			this.id = options.id;
			this.instancePath = options.instancePath;
			this.aspectNode = options.aspectNode;
			this.value = options.value;
			this._metaType = options._metaType;
			this.domainType = options.domainType;
		},

		/**
		 * Get value of quantity
		 * 
		 * @command HTMLMetadataNode.getValue()
		 * @returns {String} Value of quantity
		 */
		getValue : function() {
			return this.value;
		},
		
		/**
		 * Print out formatted node
		 */
		print : function() {
			return "ID : " + this.name + "\n" 
					+ "    Name : " + this.name + "\n"
					+ "    value : " + this.text + "\n";
		}
	});
});
