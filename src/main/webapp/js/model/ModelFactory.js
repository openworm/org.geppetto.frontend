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
 * Factory class with model creation methods.
 * 
 * @author Giovanni Idili
 */
define(function(require)
{
	return function(GEPPETTO)
	{
		var GeppettoModel = require('model/GeppettoModel');
		var Library = require('model/Library');
		var Type = require('model/Type');
		var VisualType = require('model/VisualType');
		var Variable = require('model/Variable');
		var CompositeType = require('model/CompositeType');
		var CompositeVisualType = require('model/CompositeVisualType');
		var ArrayType = require('model/ArrayType');
		var Instance = require('model/Instance');
		var ArrayInstance = require('model/ArrayInstance');
		var VisualGroup = require('model/VisualGroup');
		var VisualGroupElement = require('model/VisualGroupElement');
		var AVisualCapability = require('model/AVisualCapability');
		var AConnectionCapability = require('model/AConnectionCapability');
		var AParameterCapability = require('model/AParameterCapability');
		var AStateVariableCapability = require('model/AStateVariableCapability');
		
		/**
		 * @class GEPPETTO.ModelFactory
		 */
		GEPPETTO.ModelFactory =
		{
			/*
			 * Variables to keep track of tree building state go here if needed
			 */
			rawGeppetoModel : null,

			/**
			 * Creates and populates Geppetto model
			 */
			createGeppettoModel : function(jsonModel)
			{
				// store raw model for easy access during model building operations
				this.rawGeppetoModel = jsonModel;
				
				var geppettoModel = null;
				
				if(jsonModel.eClass == 'GeppettoModel'){
					geppettoModel = this.createModel(jsonModel);
					geppettoModel.set({ "variables": this.createVariables(jsonModel.variables) });
					
					for(var i=0; i < jsonModel.libraries.length; i++){
						var library = this.createLibrary(jsonModel.libraries[i]);
						library.set({ "types" : this.createTypes(jsonModel.libraries[i].types) });
						geppettoModel.getLibraries().push(library);
					}
					
					// traverse everything and build shortcuts to children if composite --> containment == true
					this.populateChildrenShortcuts(geppettoModel);
					
					// traverse everything and populate type references in variables
					this.populateTypeReferences(geppettoModel, geppettoModel);
				}
				
				return geppettoModel;
			},
			
			/** 
			 * Creates variables starting from an array of variables in the json model format
			 */
			populateChildrenShortcuts : function(node) {
				// check if getChildren exists, if so add shortcuts based on ids and recurse on each
				if((node.getMetaType()!=GEPPETTO.Resources.ARRAY_INSTANCE_NODE) && (typeof node.getChildren === "function")){
					var children = node.getChildren();
					
					if(children != undefined){
						for (var i=0; i < children.length; i++){
							node[children[i].getId()] = children[i];
							this.populateChildrenShortcuts(children[i]);
						}
					}
				}
			},
			
			/** 
			 * Populate type references
			 */
			populateTypeReferences : function(node, geppettoModel) {
				
				// check if variable, if so populate type references
				if(node.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE){
					var types = node.getTypes();
					var referencedTypes = [];
					
					if(types != undefined){
						for (var i=0; i < types.length; i++){
							// get reference string - looks like this --> '//@libraries.1/@types.5';
							
							var refStr = types[i].$ref;
							
							//if it's anonymous there's no reference
							if(refStr!=undefined){
								// parse data
								var typePointer = this.parseTypePointerString(refStr);
								
								// go grab correct type from Geppetto Model
								var typeObj = geppettoModel.getLibraries()[typePointer.libraries].getTypes()[typePointer.types];
								
								// add to list
								referencedTypes.push(typeObj);
								
								// set types to actual object references using backbone setter
								node.set({ "types" : referencedTypes });
							}
						}
					}
				} else if(node.getMetaType() == GEPPETTO.Resources.TYPE_NODE || node.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE){
					// take visual type string - looks like this --> '//@libraries.1/@types.5'
					var vizType = node.getVisualType();
					
					if(vizType != undefined){
						var vizTypeRefStr = vizType.$ref;
						
						// parse data into typePointer
						var typePointer =  this.parseTypePointerString(vizTypeRefStr);
						
						// replace with reference to actual type
						var typeObj = geppettoModel.getLibraries()[typePointer.libraries].getTypes()[typePointer.types];
						node.set({ "visualType" : typeObj})
					}
				} else if(node.getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE){
					// take array type string - looks like this --> '//@libraries.1/@types.5'
					var arrayType = node.getType();
					
					if(arrayType != undefined){
						var refStr = arrayType.$ref;
						
						// parse data into typePointer
						var typePointer =  this.parseTypePointerString(refStr);
						
						// replace with reference to actual type
						var typeObj = geppettoModel.getLibraries()[typePointer.libraries].getTypes()[typePointer.types];
						node.set({ "type" : typeObj})
					}
				}
				
				// check if getChildren exists, if so recurse over children
				if(typeof node.getChildren === "function"){
					var children = node.getChildren();
					
					if(children != undefined){
						for(var i = 0; i < children.length; i++){ 
							this.populateTypeReferences(children[i], geppettoModel);
						}
					}
				}
			},
			
			/**
			 * Helper function to parse type pointers to objects
			 */
			parseTypePointerString : function(refStr){
				var typePointer = { libraries : undefined, types: undefined};
				
				var raw = refStr.replace(/\//g, '').split('@');
				for(var i=0; i<raw.length; i++){
				  if(raw[i].indexOf('libraries') > -1){
				  	typePointer.libraries = parseInt(raw[i].split('.')[1]);
				  } else if(raw[i].indexOf('types') > -1){
				  	typePointer.types = parseInt(raw[i].split('.')[1]);
				  }
				}
				
				return typePointer;
			},
			
			/** 
			 * Creates variables starting from an array of variables in the json model format
			 */
			createVariables : function(jsonVariables){
				var variables = [];
				
				if(jsonVariables != undefined){
					for(var i=0; i < jsonVariables.length; i++){
						var variable = this.createVariable(jsonVariables[i]);
						
						// check if it has an anonymous type
						if(jsonVariables[i].anonymousTypes != undefined){
							variable.set( { "anonymousTypes" : this.createTypes(jsonVariables[i].anonymousTypes) });
						}
						
						variables.push(variable);
					}
				}
				
				return variables;
			},
			
			/** 
			 * Creates type objects starting from an array of types in the json model format
			 */
			createTypes : function(jsonTypes){
				var types = [];
				
				if(jsonTypes != undefined){
					for(var i=0; i < jsonTypes.length; i++){
						var type = null;
						
						// check if it's composite type, visual type, array type or simple type
						if(jsonTypes[i].eClass == 'CompositeType'){
							type = this.createCompositeType(jsonTypes[i]);
						}
						else if(jsonTypes[i].eClass == 'CompositeVisualType'){
							type = this.createCompositeVisualType(jsonTypes[i]);
						}
						else if(jsonTypes[i].eClass == 'VisualType'){
							type = this.createVisualType(jsonTypes[i]);
						}
						else if(jsonTypes[i].eClass == 'ArrayType'){
							type = this.createArrayType(jsonTypes[i]);
						} else {
							type = this.createType(jsonTypes[i]);
						}
						
						types.push(type);
					}
				}
				
				return types;
			},
			
			/** 
			 * Creates and populates initial instance tree skeleton with any instance that needs to be visualized
			 */
			createInstances : function(geppettoModel)
			{
				var instances = [];
				
				var varsWithVizTypes = [];
				
				// builds list of vars with visual types - start traversing from top level variables
				var vars = geppettoModel.getVariables();
				for(var i=0; i<vars.length; i++){
					this.fetchVarsWithVisualTypes(vars[i], varsWithVizTypes, '');
				}
				
				// based on list, traverse again and build instance objects
				for(var j=0; j<varsWithVizTypes.length; j++){
					this.buildInstanceHierarchy(varsWithVizTypes[j], null, geppettoModel, instances);
				}
				
				// populate shortcuts
				for(var k=0; k<instances.length; k++){
					this.populateChildrenShortcuts(instances[k]);
				}
				
				return instances;
			},
			
			/** 
			 * Build instance hierarchy
			 */
			buildInstanceHierarchy : function(path, parentInstance, model, topLevelInstances)
			{				
				var variable = null;
				var newlyCreatedInstance = null;
				
				// find matching first variable in path in the model object passed in
				var varsIds = path.split('.');
				// check model MetaType and find variable accordingly
				if(model.getMetaType() == GEPPETTO.Resources.GEPPETTO_MODEL_NODE){
					var variables = model.getVariables();
					for(var i=0; i<variables.length; i++){
						if(varsIds[0] === variables[i].getId()){
							variable = variables[i];
							break;
						}
					}
				}
				else if(model.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE){
				
					var allTypes =model.getTypes();
					// get all variables and match it from there
					for(var i=0; i<allTypes.length; i++){
						if(allTypes[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE){
							var variables = allTypes[i].getVariables();
							for(var i=0; i<variables.length; i++){
								if(varsIds[0] === variables[i].getId()){
									variable = variables[i];
									break;
								}
							}
						}
					}
				}
				
				// create instance for given variable
				if(variable != null){
					
					var types = variable.getTypes();
					var arrayType = null;
					for(var j=0; j<types.length; j++){
						if(types[j].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE){
							arrayType = types[j];
							break;
						}
					}
					
					if(arrayType != null){
						// when array type, explode into multiple ('size') instances
						var size = arrayType.getSize();
						
						// create new ArrayInstance object, add children to it
						var arrayOptions = { id: variable.getId(), name: variable.getId(), _metaType: GEPPETTO.Resources.ARRAY_INSTANCE_NODE, variable : variable, size: size, parent : parentInstance};
						var arrayInstance = this.createArrayInstance(arrayOptions);
						
						// check if visual type and inject AVisualCapability 
						if(arrayInstance.hasVisualType()){
							arrayInstance.extendApi(AVisualCapability);
						}
						
						for(var i=0; i<size; i++){
							// create simple instance for this variable
							var options = { id: variable.getId() + '_' + i, name: variable.getId() + '_' + i, _metaType: GEPPETTO.Resources.INSTANCE_NODE, variable : variable, children: [], parent : arrayInstance};
							var explodedInstance = this.createInstance(options);
							
							// check if visual type and inject AVisualCapability
							// NOTE: should always be the case for an exploded instance but better to check
							if(explodedInstance.hasVisualType()){
								explodedInstance.extendApi(AVisualCapability);
							}
							
							// add to array instance (adding this way because we want to access as an array)
							arrayInstance[i] = explodedInstance;
						}
						
						//  if there is a parent add to children else add to top level instances
						if (parentInstance != null && parentInstance != undefined){
							parentInstance.addChild(arrayInstance);
						} else {
							// NOTE: not sure if this can ever happen (top level instance == array)
							topLevelInstances.push(arrayInstance);
						}
						
					} else {
						// check in top level instances if we have an instance for the current variable already
						var matchingInstance = null;
						matchingInstance = this.findMatchingInstance(variable, topLevelInstances);
						
						if(matchingInstance != null){
							// there is a match, simply re-use that instance as the "newly created one" instead of creating a new one
							newlyCreatedInstance = matchingInstance;
						} else {						
							// create simple instance for this variable
							var options = { id: variable.getId(), name: variable.getId(), _metaType: GEPPETTO.Resources.INSTANCE_NODE, variable : variable, children: [], parent : parentInstance};
							newlyCreatedInstance = this.createInstance(options);
							
							// check if visual type and inject AVisualCapability
							if(newlyCreatedInstance.hasVisualType()){
								newlyCreatedInstance.extendApi(AVisualCapability);
							}
							
							// check if it has connections and inject AConnectionCapability
							if(newlyCreatedInstance.getType().getConnections().length>0){
								newlyCreatedInstance.extendApi(AConnectionCapability);
							}
							
							if(newlyCreatedInstance.getType().getId()==GEPPETTO.Resources.STATE_VARIABLE_TYPE_NODE){
								newlyCreatedInstance.extendApi(AStateVariableCapability);
							}
							
							if(newlyCreatedInstance.getType().getId()==GEPPETTO.Resources.PARAMETER_TYPE_NODE){
								newlyCreatedInstance.extendApi(AParameterCapability);
							}
							
							//  if there is a parent add to children else add to top level instances
							if (parentInstance != null && parentInstance != undefined){
								parentInstance.addChild(newlyCreatedInstance);
							} else {
								topLevelInstances.push(newlyCreatedInstance);
							}
						}
					}
				}
				
				// recurse rest of path (without first var) - pass down path, parent instance we just created, model node, top level instance list
				var newPath = '';
				for(var i=0; i<varsIds.length; i++){
					if(i!=0){ 
						newPath += (i<(varsIds.length - 1)) ? (varsIds[i] + '.') : varsIds[i]; 
					}
				}
				
				// if there is a parent instance - recurse with new parameters
				if (newlyCreatedInstance!= null){
					this.buildInstanceHierarchy(newPath, newlyCreatedInstance, variable, topLevelInstances);
				}
			},
			
			/**
			 * Find instance given variable id (unique), if any
			 */
			findMatchingInstance : function(variable, instances) {
				var matching = null;
				
				for(var i=0; i < instances.length; i++){
					if(instances[i].getId() == variable.getId()){
						matching = instances[i];
						break;
					} else {
						if(typeof instances[i].getChildren === "function"){
							matching = this.findMatchingInstance(variable, instances[i].getChildren());
						}
					}
				}
				
				return matching;
			},
			
			/** 
			 * Build "list" of variables that have a visual type
			 */
			fetchVarsWithVisualTypes : function(node, varsWithVizTypes, parentPath)
			{
				// build "list" of variables that have a visual type (store "path")
				// check meta type - we are only interested in variables
				if(node.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE){
					var allTypes = node.getTypes();
					for(var i=0; i<allTypes.length; i++){
						// if normal type or composite type check if it has a visual type
						if(allTypes[i].getMetaType() == GEPPETTO.Resources.TYPE_NODE || allTypes[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE){
							var vizType = allTypes[i].getVisualType();
							
							if(vizType!=undefined && vizType!=null){
								// ADD to list of vars with viz types
								var path = (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId());
								varsWithVizTypes.push(path); 
							}
						}
						else if(allTypes[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE){
							// if array type, need to check what type the array is of
							var arrayType = allTypes[i].getType();
							var vizType = arrayType.getVisualType();
							
							if(vizType!=undefined && vizType!=null){
								// ADD to list of vars with viz types
								var path = (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId());
								varsWithVizTypes.push(path);
							}
						}
						else if(allTypes[i].getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE){
							var path = (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId());
							varsWithVizTypes.push(path);
						}
						
						// RECURSE on any variables inside composite types
						if(allTypes[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE){
							var vars = allTypes[i].getVariables();
							
							if(vars != undefined && vars != null){
								for(var j=0; j<vars.length; j++){
									this.fetchVarsWithVisualTypes(vars[j], varsWithVizTypes, (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId()));
								}
							}
						}
						else if(allTypes[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE){
							var arrayType = allTypes[i].getType();
							
							// check if the array is of composite type and if so recurse too on contained variables
							if(arrayType.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE){
								var vars = arrayType.getVariables();
								
								if(vars != undefined && vars != null){
									for(var j=0; j<vars.length; j++){
										this.fetchVarsWithVisualTypes(vars[j], varsWithVizTypes, (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId()));
									}
								}
							}
						}
					}
				}
			},
			
			/** Creates a simple composite node */
			createModel : function(node, options)
			{
				if (options == null || options == undefined){
					options = {_metaType : GEPPETTO.Resources.GEPPETTO_MODEL_NODE, wrappedObj: node};
				}
				
				var n = new GeppettoModel(options);

				return n;
			},
			
			/** Creates a simple composite node */
			createLibrary : function(node, options)
			{
				if (options == null || options == undefined){
					options = {_metaType : GEPPETTO.Resources.LIBRARY_NODE, wrappedObj: node};
				}
				
				var n = new Library(options);

				return n;
			},
			
			/** Creates a variable node */
			createVariable : function(node, options)
			{
				if (options == null || options == undefined){
					options = {_metaType : GEPPETTO.Resources.VARIABLE_NODE, wrappedObj: node};
				}
				
				var v = new Variable(options);
				v.set({ "types" : node.types });

				return v;
			},
			
			/** Creates a type node */
			createType : function(node, options)
			{
				if (options == null || options == undefined){
					options = {_metaType : GEPPETTO.Resources.TYPE_NODE, wrappedObj: node};
				}
				
				var t = new Type(options);
				t.set({ "visualType" : node.visualType });

				return t;
			},
			
			
			/** Creates a visual type node */
			createVisualType : function(node, options)
			{
				if (options == null || options == undefined){
					options = {_metaType : GEPPETTO.Resources.VISUAL_TYPE_NODE, wrappedObj: node};
				}
				
				var t = new Type(options);

				return t;
			},
			
			/** Creates a composite type node */
			createCompositeType : function(node, options)
			{
				if (options == null || options == undefined){
					options = {_metaType : GEPPETTO.Resources.COMPOSITE_TYPE_NODE, wrappedObj: node};
				}
				
				var t = new CompositeType(options);
				t.set({ "visualType" : node.visualType });
				t.set({ "variables" : this.createVariables(node.variables) });

				return t;
			},
			
			/** Creates a composite visual type node */
			createCompositeVisualType : function(node, options)
			{
				if (options == null || options == undefined){
					options = {_metaType : GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE, wrappedObj: node};
				}
				
				var t = new CompositeVisualType(options);
				t.set({ "visualType" : node.visualType });
				t.set({ "variables" : this.createVariables(node.variables) });
				if(node.visualGroups!=undefined){
					t.set({ "visualGroups" : this.createVisualGroups(node.visualGroups) });
				}

				return t;
			},
			
			/** Creates a composite type node */
			createArrayType : function(node, options)
			{
				if (options == null || options == undefined){
					options = {_metaType : GEPPETTO.Resources.ARRAY_TYPE_NODE, wrappedObj: node};
				}
				
				var t = new ArrayType(options);
				t.set({ "size" :  node.size });
				t.set({ "type" :  node.arrayType });

				return t;
			},
			
			/** Creates an istance node */
			createInstance : function(options)
			{
				if (options == null || options == undefined){
					options = {_metaType : GEPPETTO.Resources.INSTANCE_NODE};
				}
				
				var i = new Instance(options);

				return i;
			},
			
			/** Creates an istance node */
			createArrayInstance : function(options)
			{
				if (options == null || options == undefined){
					options = {_metaType : GEPPETTO.Resources.ARRAY_INSTANCE_NODE};
				}
				
				var a = new ArrayInstance(options);

				return a;
			},
			
			
			/** Creates visual groups */
			createVisualGroups : function(nodes)
			{
				var visualGroups = [];
				
				for(var i=0; i < nodes.length; i++){	
					if(nodes[i].visualGroupElements!=undefined){
						var	options = {_metaType : GEPPETTO.Resources.VISUAL_GROUP_NODE, wrappedObj: nodes[i], visualGroupElements : this.createVisualGroupElements(nodes[i].visualGroupElements)};
						
						// get tags from raw json
						var tagRefObjs = nodes[i].tags;
						
						if(tagRefObjs != undefined){
							var tags = [];
							
							// populate tags from references
							for(var j=0; j<tagRefObjs.length; j++){
								// get reference string - looks like this --> '//@tags.1/@tags.5';
								var refStr = tagRefObjs[j].$ref;
								
								// parse
								var tagPointer = this.parseTagPointerString(refStr);
								
								// go fetch tag from geppetto model and add it to tags (bloody hawkard)
								var tagStr = this.rawGeppetoModel.tags[tagPointer.tagIndex1].tags[tagPointer.tagIndex2].name;
								
								tags.push(tagStr);
							}
							
							// add to options to init object
							options.tags = tags;
						}
						
						var vg = new VisualGroup(options);
						visualGroups.push(vg);
					}
				}

				return visualGroups;
			},
			
			/**
			 * Helper function to parse tag pointer strings to objects
			 */
			parseTagPointerString : function(refStr){
				var tagPointer = { tagIndex1 : undefined, tagIndex2: undefined};
				
				var raw = refStr.replace(/\//g, '').split('@');
				for(var i=0; i<raw.length; i++){
				  if(raw[i].indexOf('tags') > -1 && i === 1){
				  	tagPointer.tagIndex1 = parseInt(raw[i].split('.')[1]);
				  } else if(raw[i].indexOf('tags') > -1 && i === 2){
				  	tagPointer.tagIndex2 = parseInt(raw[i].split('.')[1]);
				  }
				}
				
				return tagPointer;
			},
			
			/** Creates visual group elements */
			createVisualGroupElements : function(nodes)
			{
				var visualGroupElements = [];
				
				for(var i=0; i < nodes.length; i++){
					var options = {_metaType : GEPPETTO.Resources.VISUAL_GROUP_ELEMENT_NODE, wrappedObj: nodes[i]};
					
					var vge = new VisualGroupElement(options);
					
					visualGroupElements.push(vge);
				}

				return visualGroupElements;
			},

		};
	};
});
