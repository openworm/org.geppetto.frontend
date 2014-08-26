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
define(function(require) {
	var Node = require('nodes/Node');
	var $ = require('jquery');

	return Node.Model.extend({
		relations:[
		           {
		        	   type: Backbone.Many,
		        	   key: 'children',
		        	   relatedModel: Node
		           }
		           ],
		           defaults : {
		        	   children : []
		           },
		           id : "",
		           type : "",
		           _metaType : "AspectSubTreeNode",
		           
		           initialize : function(options){
		        	   this.id = options.id;
		        	   this.instancePath = options.instancePath;
		        	   this.name = options.name;
		        	   this.type = options.type;
		           },


		           /**
		            * Get the model interpreter associated with entity
		            *
		            * @name EntityNode.getId()
		            * @returns {String} - ID of entity
		            */
		           getId : function(){
		        	   return this.id;
		           },

		           
		           getChildrenNodes : function(node, children){
		        	   var childrenTmp = children;
		        	   
		        	   // node is always an array of variables
						for(var i in node) {
					//		console.log(node[i]);
							if(typeof node[i] === "object" && node[i]!=null && i!= "attributes") {
								var type = node[i]._metaType;
				
								if(node[i] instanceof Array){
									var array = node[i];
									for(var index in array){
										children.push(this.getChildrenNodes(array[index], childrenTmp));
									}
								}
								else if(type == "CompositeNode" || type == "ParameterNode" || type  == "VariableNode"){
									children.push(node[i]); 
								}
							}
						}
						
						return childrenTmp;
		           },
		           
		           /**
		            * Get this entity's aspects
		            *
		            * @name CompositeVariableNode.getChildren()
		            * 
		            * @returns {List<Aspect>} - List of aspects
		            *
		            */
		           getChildren : function(){
		        	   var children = this.get("children");
		        	   
		        	   //var children = this.getChildrenNodes(this, new Array());
		        	   return children;
		           }
	});
});