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
 * Client class use to represent a variable.
 * 
 * @module model/Variable
 * @author Giovanni Idili
 */
define(function(require) {
	var ObjectWrapper = require('model/ObjectWrapper');

	return ObjectWrapper.Model.extend({
		anonymousTypes : [],
		types : [],
		
		/**
		 * Initializes this node with passed attributes
		 * 
		 * @param {Object} options - Object with options attributes to initialize node
		 */
		initialize : function(options) {
			this.set({ "anonymousTypes" : (options.anonymousTypes != undefined) ? options.anonymousTypes : []});
			this.set({ "types" : (options.types != undefined) ? options.types : []});
			this.set({ "wrappedObj" : options.wrappedObj });
			this.set({ "_metaType" : options._metaType });
		},
		
		/**
		 * Get the list of types for this variable
		 * 
		 * @command Variable.getTypes()
		 * 
		 * @returns {List<Type>} - array of types
		 * 
		 */
		getTypes : function() {
			var types = (this.get('types') != undefined) ? this.get('types') : [];
			var anonTypes = (this.get('anonymousTypes') != undefined) ? this.get('anonymousTypes') : [];
			var allTypes = types.concat(anonTypes);
			return allTypes;
		},
		
		/**
		 * Get the type of this variable, return a list if it has more than one
		 * 
		 * @command Variable.getType()
		 * 
		 * @returns List<Type>} - array of types
		 * 
		 */
		getType : function() {
			var types=this.getTypes();
			if(types.length==1)
			{
				return types[0];
			}
			else return types;
		},
		

		/**
		 * Get the list of values for this variable
		 * 
		 * @command Variable.getInitialValues()
		 * 
		 * @returns {List<Value>} - array of values
		 * 
		 */
		getInitialValues : function() {
			// TODO: fetch initial values
			return this.getWrappedObj().initialValues;
		},
		
		/**
		 * Check if the variable is static
		 * 
		 * @command Variable.isStatic()
		 * 
		 * @returns {bool} - Boolean 
		 * 
		 */
		isStatic : function() {
			// TODO: fetch static from wrapped obj
			return this.getWrappedObj().isStatic;
		},
		
		/**
		 * Gets position for the variable
		 * 
		 * @command Variable.isStatic()
		 * 
		 * @returns {Object} - position for the variable 
		 * 
		 */
		getPosition : function() {
			// TODO: fetch static from wrapped obj
			return this.getWrappedObj().position;
		},
		
		/**
		 * Get combined children
		 * 
		 * @command Variable.getChildren()
		 * 
		 * @returns {List<Object>} - List of children
		 * 
		 */
		getChildren : function() {
			// only anonymousTypes as containment == true in the model (they are not references)
			return this.get('anonymousTypes');
		},
	});
});
