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
 * Client class use to represent an instance object (instantiation of a variable).
 * 
 * @module model/Instance
 * @author Giovanni Idili
 */

define([ 'jquery', 'underscore', 'backbone'], function(require) {
	return Backbone.Model.extend({
			id : "",
			name : "",
			_metaType : "",
			variable : null,
			parent : null,
			children: [],
			
			/**
			 * Initializes this node with passed attributes
			 * 
			 * @param {Object} options - Object with options attributes to initialize instance
			 */
			initialize : function(options) {
				this.set({ "variable" : options.variable });
				this.set({ "parent" : options.parent });
				this.set({ "children" : (options.children != undefined) ? options.children : [] });
				this.set({ "id" : options.id });
				this.set({ "name" : options.name });
				this.set({ "_metaType" : options._metaType });
			},
			
			/**
			 * Get id 
			 * 
			 * @command Instance.getId()
			 * 
			 * @returns {String} - Id
			 * 
			 */
			getId : function() {
				return this.get("id");
			},
			
			/**
			 * Get name 
			 * 
			 * @command Instance.getName()
			 * 
			 * @returns {String} - Name
			 * 
			 */
			getName : function() {
				return this.get("name");
			},
			
			/**
			 * Get meta type
			 * 
			 * @command Instance.getMetaType()
			 * 
			 * @returns {String} - meta type
			 * 
			 */
			getMetaType : function() {
				return this.get("_metaType");
			},
			
			/**
			 * Get the type for this instance
			 * 
			 * @command Instance.getTypes()
			 * 
			 * @returns {List<Type>} - array of types
			 * 
			 */
			getTypes : function() {
				return this.get("variable").getTypes();
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
				var types=this.get("variable").getTypes();
				if(types.length==1)
				{
					return types[0];
				}
				else return types;
			},
			
			/**
			 * Checks if this instance has a visual type
			 * 
			 * @command Instance.hasVisualType()
			 * 
			 * @returns {Boolean}
			 * 
			 */
			hasVisualType : function() {
				var hasVisual = false;
				var types = this.getTypes();
				
				// check if any of types is VISUAL_TYPE_NODE or if types HAVE .visualType
				for(var i=0; i < types.length; i++){
					// could be pointing to an array variable if it's an exploded instance
					if(types[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE){ 
						// check it if is a visual type or has a visual type
						if(types[i].getType().getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE || (types[i].getType().getVisualType() != null && types[i].getType().getVisualType() != null)){
							hasVisual = true;
							break;
						}
					} else if(types[i].getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE || (types[i].getVisualType() != null && types[i].getVisualType() != null)){
						hasVisual = true;
						break;
					}
				}

				return hasVisual;
			},
			
		
			/**
			 * Get the variable for this instance
			 * 
			 * @command Instance.getVariable()
			 * 
			 * @returns {Variable} - Variable object for this instance
			 * 
			 */
			getVariable : function() {
				return this.get("variable");
			},
			
			/**
			 * Get children instances
			 * 
			 * @command Instance.getChildren()
			 * 
			 * @returns {List<Instance>} - List of instances
			 * 
			 */
			getChildren : function() {
				return this.get("children");
			},
			
			/**
			 * Get instance path
			 * 
			 * @command Instance.getInstancePath()
			 * 
			 * @returns {String} - Instance path
			 * 
			 */
			getInstancePath : function() {
				var parent = this.get("parent");
				var parentPath = "";
				
				if(parent != null && parent != undefined){
					parentPath = parent.getInstancePath();
				}
				var path=(parentPath + "." + this.getId());
				if((parentPath!="") && 
					(parent.getMetaType()==GEPPETTO.Resources.ARRAY_INSTANCE_NODE) &&
					(this.getId().indexOf(parent.getId(), 0) === 0))
				{
					var index=this.getId().substring(parent.getId().length+1,this.getId().length);
					path=parentPath+"["+index+"]";
				}
				return (parentPath != "") ?  path : this.getId();
			},
			
			/**
			 * Get raw instance path (without array shortening)
			 * 
			 * @command Instance.getRawInstancePath()
			 * 
			 * @returns {String} - Instance path
			 * 
			 */
			getRawInstancePath : function() {
				var parent = this.get("parent");
				var parentPath = "";
				
				if(parent != null && parent != undefined){
					parentPath = parent.getInstancePath();
				}
				
				return (parentPath != "") ? (parentPath + "." + this.getId()) : this.getId();
			},
			
			
			/**
			 * Get parent
			 * 
			 * @command Instance.getParent()
			 * 
			 * @returns {Instance} - Parent instance
			 * 
			 */
			getParent : function() {
				return this.get("parent");
			},
			
			/**
			 * Get children instances
			 * 
			 * @command Instance.addChild()
			 * 
			 * @returns {List<Instance>} - List of instances
			 */
			addChild : function(child) {
				this.get("children").push(child);
			},
			
			/**
			 * Extends with methods from another object
			 * 
			 * @command Instance.extendApi(extensionObj)
			 */
			extendApi : function(extensionObj){
				$.extend(this, extensionObj);
			}
		})
});
