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
 * Factory class that figures out what kind of nodes to create with the updates received 
 * from the server. Creates the client nodes for entities, aspects, etc and updates them.
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {
		var AspectNode = require('nodes/AspectNode');
		var EntityNode = require('nodes/EntityNode');
		var AspectSubTreeNode = require('nodes/AspectSubTreeNode');
		var CompositeNode = require('nodes/CompositeNode');
		var ParameterNode = require('nodes/ParameterNode');
		var ParameterSpecificationNode = require('nodes/ParameterSpecificationNode');
		var DynamicsSpecificationNode = require('nodes/DynamicsSpecificationNode');
		var FunctionNode = require('nodes/FunctionNode');
		var VariableNode = require('nodes/VariableNode');

		GEPPETTO.RuntimeTreeFactory = {
				/**Creates the backbone nodes for the first time depending.
				 */
				createRuntimeTree : function(jsonRuntimeTree){
					for (var id in jsonRuntimeTree) {
						var node = jsonRuntimeTree[id];
						if(node._metaType == "EntityNode"){
							var entityNode = 
								GEPPETTO.RuntimeTreeFactory.createEntityNode(node);

							GEPPETTO.Console.updateCommands("js/nodes/EntityNode.js", entityNode, id);

							//keep track of client entity nodes created
							GEPPETTO.Simulation.runTimeTree[id]= entityNode;
							
							this.traverseEntities(node, entityNode, GEPPETTO.Simulation.runTimeTree[id]);
						}
					}
				},
				
				traverseEntities: function(entities, parentNode, runTimeRef){
					for (var id in entities) {
						var node = entities[id];
						if(node._metaType == "EntityNode"){
							var entityNode = 
								GEPPETTO.RuntimeTreeFactory.createEntityNode(node);
							
							GEPPETTO.Console.updateTags(entityNode.instancePath, entityNode);

							runTimeRef[id] = entityNode;
							parentNode.get("entities").add(entityNode);
							
							this.traverseEntities(node);
						}
					}
				},

				/**Update entities of scene with new server updates*/
				updateRuntimeTree : function(jsonRuntimeTree){
					for (var id in jsonRuntimeTree) {
						var node = jsonRuntimeTree[id];
						if(node._metaType == "EntityNode"){
							//check to see if entitynode already exists
							if(GEPPETTO.Simulation.runTimeTree.hasOwnProperty(id)){
								//retrieve entity node
								var entityNode = 
									GEPPETTO.Simulation.runTimeTree[id];

								//traverse through server update node to get aspects
								for (var a in node) {
									var nodeA = node[a];
									//match aspect in server update
									if(nodeA._metaType == "AspectNode"){
										//match aspect in existing entity node
										for (var aspectId in entityNode.aspects) {
											var aspect = entityNode.aspects[aspectId];
											//update subtrees of matched aspect with new data
											if(aspect.instancePath == nodeA.instancePath){
												if(nodeA.VisualizationTree.modified){
													aspect.VisualizationTree.content = nodeA.VisualizationTree;
													aspect.VisualizationTree.modified = true;
												}
												if(nodeA.SimulationTree.modified){
													this.updateAspectSimulationTree(aspect.instancePath,nodeA.SimulationTree);
													aspect.SimulationTree.modified = true;
												}
												if(nodeA.ModelTree.modified){
													/*Do nothing, should never be true. Model Tree is created upon 
													 * request by using Entity.aspect.getModelTree() command 
													 */
												}
											}
										}
									}
								}
							}
						}
					}

					this.updateWidgets();
				},
				
				/**Update entities of scene with new server updates*/
				resetSubtreesDirtyFlag : function(jsonRuntimeTree){
					for (var id in jsonRuntimeTree) {
						var node = jsonRuntimeTree[id];
						if(node._metaType == "EntityNode"){
							//check to see if entitynode already exists
							if(GEPPETTO.Simulation.runTimeTree.hasOwnProperty(id)){
								//retrieve entity node
								var entityNode = 
									GEPPETTO.Simulation.runTimeTree[id];

								//traverse through server update node to get aspects
								for (var a in node) {
									var nodeA = node[a];
									//match aspect in server update
									if(nodeA._metaType == "AspectNode"){
										//match aspect in existing entity node
										for (var aspectId in entityNode.aspects) {
											var aspect = entityNode.aspects[aspectId];
											//update subtrees of matched aspect with new data
											if(aspect.instancePath == nodeA.instancePath){
												aspect.VisualizationTree.modified = false;
												aspect.SimulationTree.modified = false;
												aspect.ModelTree.modified = false;
											}
										}
									}
								}
							}
						}
					}
				},

				/**Update and create simulation Tree for aspect
				 * 
				 * @param aspectInstancePath - Path of aspect to update
				 * @param simulationTree - Server JSON update
				 */
				updateAspectSimulationTree : function(aspectInstancePath,simulationTreeUpdate){
					var aspect= GEPPETTO.Utility.deepFind(GEPPETTO.Simulation.runTimeTree, aspectInstancePath);	

					//if client aspect has no simulation tree, let's created
					if(jQuery.isEmptyObject(aspect.SimulationTree)){
						var path =aspectInstancePath + ".SimulationTree";
						
						//create SubTreeNode to store simulation tree
						var subTree = new AspectSubTreeNode({name : "SimulationTree",
							instancePath : path ,
							type : "SimulationTree",
							_metaType : "AspectSubTreeNode", modified : true});
						aspect.SimulationTree = this.createSimulationTree(subTree, simulationTreeUpdate);
						
						GEPPETTO.Console.updateTags(subTree.instancePath, subTree);
					}
					/*client side simulation tree already exists, update it*/
					else{
						//traverse through list of simulation states being watched
						for(var index in GEPPETTO.Simulation.simulationStates){
							var state = GEPPETTO.Simulation.simulationStates[index];
							//match client side existing node for simulation state
							var existingNode = GEPPETTO.Utility.deepFind(GEPPETTO.Simulation.runTimeTree, state);
							state = state.replace(aspect.instancePath + ".SimulationTree.", "");
							//match new update from server json
							var newNode = GEPPETTO.Utility.deepFind(simulationTreeUpdate, state);

							//set existing node with new value
							existingNode.value = newNode.value;
						}

					}
				},
				
				updateWidgets : function(){
					//send command to widgets that newd data is available
					GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.UPDATE);

					//update scene brightness
					for(var key in GEPPETTO.Simulation.listeners) {
						//retrieve the simulate state from watch tree
						var simState = GEPPETTO.Utility.deepFind(GEPPETTO.Simulation.runTimeTree, key);

						//update simulation state
						GEPPETTO.Simulation.listeners[key](simState);
					}
				},

				/**Create Model Tree for aspect
				 * 
				 * @param aspectInstancePath - Path of aspect to populate
				 * @param modelTree - Server JSON update
				 */
				createAspectModelTree : function(aspectInstancePath, modelTree){
					var aspect= GEPPETTO.Utility.deepFind(GEPPETTO.Simulation.runTimeTree, aspectInstancePath);
					
					//populate model tree with server nodes
					this.modelJSONToNodes(aspect.ModelTree, modelTree);
					aspect.ModelTree.modified = true;
					
					//notify user received tree was empty
					if(aspect.ModelTree.getChildren().length==0){
						var indent = "    ";
						GEPPETTO.Console.log(indent + GEPPETTO.Resources.EMPTY_MODEL_TREE);
					}else{
						GEPPETTO.Console.executeCommand(aspect.ModelTree.instancePath + ".print()");
						aspect.ModelTree.print();
					}
				},

				/**Create Model Tree using JSON server update
				 * 
				 * @param parent - Used to store the created client nodes
				 * @param node - JSON server update nodes
				 */
				modelJSONToNodes : function(parent, node){				    
					//traverse through nodes to create model tree
					for(var i in node) {
						if(typeof node[i] === "object") {
							var metatype = node[i]._metaType;

							//if object is array, do recursion to find more objects
							if(node[i] instanceof Array){
								var array = node[i];
								parent[i] = [];
								var arrayNode = new CompositeNode(
										{id: i, name : i,_metaType : "CompositeNode"});
								parent.get("children").add(arrayNode);
								for(var index in array){
									parent[i][index] = {};
									var arrayObject = this.modelJSONNodes(arrayNode, array[index]);
									parent[i][index] = arrayObject;
								}
							}
							
							/*Match type of node and created*/
							if(metatype == "CompositeNode"){
								var compositeNode =this.createCompositeNode(node[i]);
								if(parent._metaType == "CompositeNode" || parent._metaType == "AspectSubTreeNode"){
									parent.get("children").add(compositeNode);
								}
								parent[i] = compositeNode;
								//traverse through children of composite node
								this.modelJSONToNodes(parent[i], node[i]);
							}
							else if(metatype == "FunctionNode"){
								var functionNode =  this.createFunctionNode(node[i]);
								if(parent._metaType == "CompositeNode" || parent._metaType == "AspectSubTreeNode"){
									parent.get("children").add(functionNode);
								}
								parent[i] = functionNode;
							}
							else if(metatype == "DynamicsSpecificationNode"){
								var dynamicsSpecificationNode =  this.createDynamicsSpecificationNode(node[i]);
								if(parent._metaType == "CompositeNode" || parent._metaType == "AspectSubTreeNode"){
									parent.get("children").add(dynamicsSpecificationNode);
								}
								parent[i] = dynamicsSpecificationNode;
							}
							else if(metatype == "ParameterSpecificationNode"){
								var parameterSpecificationNode =  this.createParameterSpecificationNode(node[i]);
								if(parent._metaType == "CompositeNode" || parent._metaType == "AspectSubTreeNode"){
									parent.get("children").add(parameterSpecificationNode);
								}
								parent[i] = parameterSpecificationNode;
							}
						}
					}

					return parent;
				},

				/**Create Simulation Tree
				 * 
				 * @param parent - Used to store the created client nodes
				 * @param node - JSON server update nodes
				 */
				createSimulationTree : function(parent, node){				    
					// traverse throuh node to find objects
					for(var i in node) {
						if(typeof node[i] === "object") {
							var metatype = node[i]._metaType;
							
							//if object is array, do recursion to find more objects
							if(node[i] instanceof Array){
								var array = node[i];
								parent[i] = [];
								var arrayNode = new CompositeNode(
										{id: i, name : i,instancePath : node.instancePath+"."+i,_metaType : "CompositeNode"});
								parent.get("children").add(arrayNode);
								for(var index=0;index<array.length;index++){
									parent[i][index] = {};
									arrayNode.instancePath = node.instancePath+"."+i+  "[" + index +"]";
									var arrayObject = this.createSimulationTree(arrayNode, array[index]);
									parent[i][index] = arrayObject;
								}
							}
							//if object is CompositeNode, do recursion to find children
							else if(metatype == "CompositeNode"){
								var compositeNode=this.createCompositeNode(node[i]);
								this.createSimulationTree(compositeNode, node[i]);
								//add to parent if applicable
								if(parent._metaType == "CompositeNode" || parent._metaType == "AspectSubTreeNode"){
									parent.get("children").add(compositeNode);
								}
								parent[i] = compositeNode;
							}
							else if(metatype == "VariableNode"){
								var variableNode =  this.createVariableNode(node[i]);
								//add to parent if applicable
								if(parent._metaType == "CompositeNode" || parent._metaType == "AspectSubTreeNode"){
									parent.get("children").add(variableNode);
								}
								parent[i] = variableNode;
							}
							else if(metatype == "ParameterNode"){
								var parameterNode =  this.createParameterNode(node[i]);
								//add to parent if applicable
								if(parent._metaType == "CompositeNode" || parent._metaType == "AspectSubTreeNode"){
									parent.get("children").add(parameterNode);
								}
								parent[i] = parameterNode;
							}
						}
					}

					return parent;
				},

				/**Create and populate client entity nodes for the first time*/
				createEntityNode : function(entity){
					var e = window[entity.id] = new EntityNode(
							{id:entity.id, name : entity.id,
								instancePath : entity.instancePath,position : entity.position});
					//add commands to console autocomplete and help option
					GEPPETTO.Console.addTag(entity.instancePath);

					for (var id in entity) {
						var node = entity[id];
						//create aspect nodes
						if(node._metaType == "AspectNode"){
							var aspectNode = 
								GEPPETTO.RuntimeTreeFactory.createAspectNode(node);

							//set aspectnode as property of entity
							e[id] =aspectNode;
							//add aspect node to entity
							e.get("aspects").add(aspectNode);
							aspectNode.setParentEntity(e);
						}
					}

					return e;
				},

				/**Creates and populates client aspect nodes for first time*/
				createAspectNode : function(aspect){
					var a = window[aspect.id] = new AspectNode(
							{id: aspect.id,modelInterpreter: aspect.modelInterpreter,
								name : aspect.id,
								simulator: aspect.simulator,model : aspect.model,
								instancePath : aspect.instancePath});
					GEPPETTO.Console.updateTags(aspect.instancePath, a);
					GEPPETTO.Console.addTag(aspect.instancePath);

					//create visualization subtree only at first
					for (var aspectKey in aspect) {
						var node = aspect[aspectKey];
						if(node._metaType == "AspectSubTreeNode"){
							if(node.type == "VisualizationTree"){
								var subTree = this.createAspectSubTreeNode(node);
								
								a.VisualizationTree = subTree;
								
								a.VisualizationTree["content"] = node;								
							}		
							else if(node.type == "SimulationTree"){
								a.SimulationTree = {};
							}
							else if(node.type == "ModelTree"){
								var subTree = this.createAspectSubTreeNode(node);
								
								a.ModelTree = subTree;
								
								a.ModelTree["content"] = node;								
							}	
						}
					}

					return a;
				},

				/**Creates and populates client aspect nodes for first time*/
				createAspectSubTreeNode : function(node){
					var a = new AspectSubTreeNode(
							{name : node.type, type: node.type, id: node.id,instancePath : node.instancePath, 
								_metaType : "AspectSubTreeNode", modified : node.modified});
					
					GEPPETTO.Console.updateTags(node.instancePath, a);
					GEPPETTO.Console.addTag(node.instancePath);

					return a;
				},
				
				/**Creates and populates client aspect nodes for first time*/
				createCompositeNode : function(node){
					var a = new CompositeNode(
							{id: node.id, name : node.id, 
								instancePath : node.instancePath,_metaType : "CompositeNode"});
					
					GEPPETTO.Console.updateTags(node.instancePath, a);
					GEPPETTO.Console.addTag(node.instancePath);

					return a;
				},

				/**Creates and populates client aspect nodes for first time*/
				createFunctionNode : function(node){
					var a = new FunctionNode(
							{id: node.id, name: node.id, expression : node.expression, arguments : node.arguments,
								instancePath : node.instancePath,_metaType : "FunctionNode"});
					
					GEPPETTO.Console.updateTags(node.instancePath, a);
					GEPPETTO.Console.addTag(node.instancePath);

					return a;
				},
				/**Creates and populates client aspect nodes for first time*/
				createDynamicsSpecificationNode : function(node){
					var a = new DynamicsSpecificationNode(
							{id: node.id, name: node.id, value : node.value, unit : node.unit, 
								scalingFactor : node.scalingFactor,
								instancePath : node.instancePath, _metaType : "DynamicsSpecificationNode"});
					var f = new FunctionNode(
							{expression : node._function.expression, 
								instancePath : node.instancePath,arguments : node._function.arguments});

					a.set("dynamics",f);
					GEPPETTO.Console.updateTags(node.instancePath, a);
					GEPPETTO.Console.addTag(node.instancePath);

					return a;
				},
				/**Creates and populates client aspect nodes for first time*/
				createParameterSpecificationNode : function(node){
					var a = new ParameterSpecificationNode(
							{id : node.id, name: node.id, value : node.value, unit : node.unit, 
								scalingFactor : node.scalingFactor,instancePath : node.instancePath,
								_metaType : "ParameterSpecificationNode"});

					GEPPETTO.Console.updateTags(node.instancePath, a);
					GEPPETTO.Console.addTag(node.instancePath);
					return a;
				},
				/**Creates and populates client aspect nodes for first time*/
				createParameterNode : function(node){
					var a = new ParameterNode(
							{id: node.ide, name: node.id, instancePath : node.instancePath, properties : options.properties,
								_metaType : "ParameterNode"});
					
					GEPPETTO.Console.updateTags(node.instancePath, a);
					GEPPETTO.Console.addTag(node.instancePath);

					return a;
				},
				/**Creates and populates client aspect nodes for first time*/
				createVariableNode : function(node){
					var a = new VariableNode(
							{id: node.id, name: node.id, value : node.value, unit : node.unit, 
								scalingFactor : node.scalingFactor, instancePath : node.instancePath,
								_metaType : "VariableNode"});
					GEPPETTO.Console.updateTags(node.instancePath, a);
					GEPPETTO.Console.addTag(node.instancePath);
					return a;
				},
		};
	};
});