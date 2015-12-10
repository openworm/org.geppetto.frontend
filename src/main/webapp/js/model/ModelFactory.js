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
 * Factory class with node creation methods. Used by RuntimeTreeFactory class
 * while population of run time tree using json object.
 * 
 * @author Giovanni Idili
 */
define(function(require)
{
	return function(GEPPETTO)
	{
		var CompositeNode = require('model/CompositeNode');
		var Type = require('model/Type');
		var Variable = require('model/Variable');
		var CompositeType = require('model/CompositeType');
		
		/**
		 * @class GEPPETTO.ModelFactory
		 */
		GEPPETTO.ModelFactory =
		{
			/*
			 * Variables to keep track of tree building state go here if needed
			 */

			/**
			 * Creates and populates Geppetto model
			 */
			createGeppettoModel : function(jsonModel)
			{
				var geppettoModel = null;
				
				if(jsonModel.eClass == 'GeppettoModel'){
					geppettoModel = this.createCompositeNode(element);
					
					var variables = this.createCompositeNode(element.variables);
					variables.getChildren().push(createVariables(element.variables));
					
					var libraries = null;
					for(var i=0; i < element.libraries.length; i++){
						var library = this.createCompositeNode(element.libraries[i]);
						var types = createTypes(element.libraries[i].types);
						library.getChildren().push(types);
					}
					
					// TODO: traverse everything and populate type references in variables
					
					geppettoModel.getChildren().push(variables);
					geppettoModel.getChildren().push(libraries);
				}
				
				return geppettoModel;
			},

			/** 
			 * Creates variables starting from an array of variables in the json model format
			 */
			createVariables : function(jsonVariables){
				var variables = [];
				
				for(var i=0; i < jsonVariables.length; i++){
					var variable = this.createVariable(jsonVariables[i]);
					
					// check if it has an anonymous type
					if(jsonVariables[i].anonymousTypes != undefined){
						variable.anonymousTypes = this.createTypes(jsonVariables[i].anonymousTypes);
					}
					
					variables.push(variable);
				}
				
				return variables;
			},
			
			/** 
			 * Creates type objects starting from an array of types in the json model format
			 */
			createTypes : function(jsonTypes){
				var types = [];
				
				for(var i=0; i < jsonTypes.length; i++){
					var type = null;
					
					// check if it's composite type or simple type
					var eClassID = jsonTypes[i].eClass.split("/")[jsonTypes[i].eClass.split("/").length - 1];
					if(eClassID == 'CompositeType'){
						type = this.createCompositeType(jsonTypes[i]);
						type.variables = this.createVariables(jsonTypes[i].variables);
					}
					else{
						type = this.createType(jsonTypes[i]);
					}
					
					// TODO: find out if we treat composite visual type the same way
					
					types.push(type);
				}
				
				return types;
			},
			
			/** 
			 * Creates and populates instance tree skeleton 
			 */
			createInstanceTree : function(geppettoModel)
			{
				var instanceTree = null;
				
				// TODO: implement - GI
				
				return instanceTree;
			},
			
			/** Creates a simple composite node */
			createCompositeNode : function(node, options)
			{
				if (options == null || options == undefined){
					options = { id : node.id, name : node.name, _metaType : GEPPETTO.Resources.COMPOSITE_NODE};
				}
				
				var n = new CompositeNode(options);

				return n;
			},
			
			/** Creates a variable node */
			createVariable : function(node, options)
			{
				if (options == null || options == undefined){
					options = { id : node.id, name : node.name, _metaType : GEPPETTO.Resources.VARIABLE_NODE, wrappedObj: node};
				}
				
				var v = new Variable(options);

				return v;
			},
			
			/** Creates a type node */
			createType : function(node, options)
			{
				if (options == null || options == undefined){
					options = { id : node.id, name : node.name, _metaType : GEPPETTO.Resources.TYPE_NODE, wrappedObj: node};
				}
				
				var t = new Type(options);

				return t;
			},
			
			/** Creates a composite type node */
			createCompositeType : function(node, options)
			{
				if (options == null || options == undefined){
					options = { id : node.id, name : node.name, _metaType : GEPPETTO.Resources.COMPOSITE_TYPE_NODE, wrappedObj: node};
				}
				
				var t = new CompositeType(options);

				return t;
			},

		};
	};
});
