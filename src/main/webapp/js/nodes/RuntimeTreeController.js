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
 * Factory class that figures out what kind of nodes to create with the updates
 * received from the server. Creates the client nodes for entities, aspects, etc
 * and updates them.
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {
		var simulationTreeCreated=false;

		/**
		 * @class GEPPETTO.RuntimeTreeController
		 */
		GEPPETTO.RuntimeTreeController = {
				/**Creates the backbone nodes for the first time depending.
				 */
				createRuntimeTree : function(jsonRuntimeTree){
					this.simulationTreeCreated=false;
					for (var id in jsonRuntimeTree) {
						var node = jsonRuntimeTree[id];
						if(node._metaType == GEPPETTO.Resources.ENTITY_NODE){
							var entityNode = 
								GEPPETTO.NodeFactory.createEntityNode(node);
							
							// keep track of client entity nodes created
							GEPPETTO.Simulation.runTimeTree[id] = entityNode;

							this.traverseEntities(node, entityNode,
									GEPPETTO.Simulation.runTimeTree[id]);							
						}
					}
				},

				/**
				 * Traverse through entities to create children
				 * 
				 * * @name RuntimeTreeController#traverseEntities
				 */
				traverseEntities : function(entities, parentNode, runTimeRef) {
					for ( var id in entities) {
						var node = entities[id];
						if (node._metaType == GEPPETTO.Resources.ENTITY_NODE) {
							var entityNode = GEPPETTO.NodeFactory
													 .createEntityNode(node);

							runTimeRef[id] = entityNode;
							entityNode.setParent(parentNode);
							parentNode.getEntities().push(entityNode);

							this.traverseEntities(node,entityNode);
						}
					}
				},
				/**Traverse the tree, when an aspect is found */
				updateNode :function(node)
				{
					for(var c in node)
					{
						var child=node[c];
						if(child._metaType==GEPPETTO.Resources.ASPECT_NODE)
						{
							var aspectNode=eval(child.instancePath);
							if(child.SimulationTree != undefined)
							{
								if(jQuery.isEmptyObject(aspectNode.SimulationTree) || aspectNode.Simulation==undefined)
								{
									this.createAspectSimulationTree(aspectNode.instancePath,child.SimulationTree);	
								}
							}
						}
						else if(child._metaType==GEPPETTO.Resources.ENTITY_NODE)
						{
							this.updateNode(child);
						}
					}
				},

				/**Update all visual trees for a given entity*/
				updateEntityVisualTrees : function(entity, jsonRuntimeTree){
					for (var id in entity) 
					{
						if(entity[id]._metaType ==GEPPETTO.Resources.ASPECT_NODE )
						{
							var receivedAspect = entity[id];
							//match received aspect to client one
							var aspect =  GEPPETTO.Utility.deepFind(GEPPETTO.Simulation.runTimeTree, receivedAspect.instancePath);
							if(receivedAspect.VisualizationTree != undefined)
							{
								aspect.VisualizationTree.content = receivedAspect.VisualizationTree;
							}
						}
						//traverse inside entity looking for more updates in visualization tree
						else if(entity[id]._metaType ==GEPPETTO.Resources.ENTITY_NODE){
							this.updateEntityVisualTrees(entity[id],jsonRuntimeTree);
						}
					}
				},

				/**Update entities of scene with new server updates*/
				updateVisualTrees : function(jsonRuntimeTree){
					for(var c in jsonRuntimeTree)
					{
						var node = jsonRuntimeTree[c];
						if(node._metaType==GEPPETTO.Resources.ENTITY_NODE)
						{
							this.updateEntityVisualTrees(node,jsonRuntimeTree);
						}
					}
				},

				/**Update entities of scene with new server updates*/
				updateRuntimeTree : function(jsonRuntimeTree){
					if(!this.simulationTreeCreated)
					{
						this.updateNode(jsonRuntimeTree);
						this.simulationTreeCreated=true;
					}
					this.updateVisualTrees(jsonRuntimeTree);
					for(var index in GEPPETTO.Simulation.simulationStates)
					{
						var state = GEPPETTO.Simulation.simulationStates[index];
						var received=eval("jsonRuntimeTree."+state);
						var clientNode=eval(state);
						clientNode.getTimeSeries()[0].value = received.timeSeries["quantity0"].value;
					}

					this.updateWidgets();
				},
				
				/**Update and create simulation Tree for aspect
				 * 
				 * @param aspectInstancePath - Path of aspect to update
				 * @param simulationTree - Server JSON update
				 */
				createAspectSimulationTree : function(aspectInstancePath,simulationTreeUpdate){
					var aspect= eval(aspectInstancePath);	
					//the client aspect has no simulation tree, let's create it
					var path =aspectInstancePath + ".SimulationTree";

					//create SubTreeNode to store simulation tree
					var subTree = GEPPETTO.NodeFactory.createAspectSubTreeNode({
								  name : "SimulationTree",instancePath : path ,
								  type : "SimulationTree",
								 _metaType : GEPPETTO.Resources.ASPECT_SUBTREE_NODE});
					this.createSimulationTree(subTree, simulationTreeUpdate);
					aspect.SimulationTree = subTree;
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
				populateAspectModelTree : function(aspectInstancePath, modelTree){
					var aspect= GEPPETTO.Utility.deepFind(GEPPETTO.Simulation.runTimeTree, aspectInstancePath);

					//populate model tree with server nodes
					this.createAspectModelTree(aspect.ModelTree, modelTree);

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
				createAspectModelTree : function(parent, node){				    
					//traverse through nodes to create model tree
					for(var i in node) {
						if(typeof node[i] === "object") {
							var metatype = node[i]._metaType;

							//if object is array, do recursion to find more objects
							if(node[i] instanceof Array){
								var array = node[i];
								parent[i] = [];
								var arrayNode = new CompositeNode(
										{id: i, name : i,_metaType : GEPPETTO.Resources.COMPOSITE_NODE});
								arrayNode.setParent(parent);
								parent.getChildren().push(arrayNode);
								for(var index in array){
									parent[i][index] = {};
									var arrayObject = this.modelJSONNodes(arrayNode, array[index]);
									parent[i][index] = arrayObject;
								}
							}

							/*Match type of node and created*/
							if(metatype == GEPPETTO.Resources.COMPOSITE_NODE){
								var compositeNode =GEPPETTO.NodeFactory.createCompositeNode(node[i],true);
								compositeNode.setParent(parent);
								if(parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE){
									parent.getChildren().push(compositeNode);
								}
								parent[i] = compositeNode;
								//traverse through children of composite node
								this.createAspectModelTree(parent[i], node[i]);
							}
							else if(metatype == GEPPETTO.Resources.FUNCTION_NODE){
								var functionNode =  GEPPETTO.NodeFactory.createFunctionNode(node[i]);
								functionNode.setParent(parent);
								if(parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE){
									parent.getChildren().push(functionNode);
								}
								parent[i] = functionNode;
							}
							else if(metatype == GEPPETTO.Resources.DYNAMICS_NODE){
								var dynamicsSpecificationNode =  GEPPETTO.NodeFactory.createDynamicsSpecificationNode(node[i]);
								dynamicsSpecificationNode.setParent(parent);
								if(parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE){
									parent.getChildren().push(dynamicsSpecificationNode);
								}
								parent[i] = dynamicsSpecificationNode;
							}
							else if(metatype == GEPPETTO.Resources.PARAMETER_SPEC_NODE){
								var parameterSpecificationNode =  GEPPETTO.NodeFactory.createParameterSpecificationNode(node[i]);
								parameterSpecificationNode.setParent(parent);
								if(parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE){
									parent.getChildren().push(parameterSpecificationNode);
								}
								parent[i] = parameterSpecificationNode;
							}
							else if(metatype == GEPPETTO.Resources.TEXT_METADATA_NODE){
								var textMetadataNode =  GEPPETTO.NodeFactory.createTextMetadataNode(node[i]);
								if(parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE){
									parent.getChildren().push(textMetadataNode);
								}
								parent[i] = textMetadataNode;
							}
						}
					}

					return parent;
				},

				/**
				 * Create Simulation Tree
				 * 
				 * @param parent -
				 *            Used to store the created client nodes
				 * @param node -
				 *            JSON server update nodes
				 */
				createSimulationTree : function(parent, node) {
					// traverse throuh node to find objects
					for ( var i in node) {
						if (typeof node[i] === "object") {
							var metatype = node[i]._metaType;

							// if object is array, do recursion to find more objects
							if (node[i] instanceof Array) {
								var array = node[i];
								parent[i] = [];
								// create parent composite node for array nodes
								var arrayNode = GEPPETTO.NodeFactory.createCompositeNode({
												id : i,
												name : i,
												instancePath : node.instancePath + "." + i,
												_metaType : GEPPETTO.Resources.COMPOSITE_NODE
												},true);
								parent.getChildren().push(arrayNode);

								// create nodes for each array index
								for ( var index = 0; index < array.length; index++) {
									parent[i][index] = {};
									// create nodes for each array index node
									var arrayObject = this.createSimulationTree(
											arrayNode, array[index]);
									// set instance path of created array node and
									// set as property
									if (arrayObject.getChildren().length > 0) {
										arrayObject.instancePath = arrayNode.instancePath
										+ "[" + index + "]";
										parent[i][index] = arrayObject;
									}
								}
							}
							// if object is CompositeNode, do recursion to find
							// children
							else if (metatype == GEPPETTO.Resources.COMPOSITE_NODE) {
								var newNode = GEPPETTO.NodeFactory.createCompositeNode(node[i],true);
								newNode.setParent(parent);
								this.createSimulationTree(newNode, node[i]);
								// add to parent if applicable
								if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE
										|| parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE) {
									parent.getChildren().push(newNode);
								}
								parent[i] = newNode;
							} else if (metatype == GEPPETTO.Resources.VARIABLE_NODE) {
								var newNode = GEPPETTO.NodeFactory.createVariableNode(node[i]);
								newNode.setParent(parent);
								// add to parent if applicable
								if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE
										|| parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE) {
									parent.getChildren().push(newNode);
								}
								parent[i] = newNode;
							} else if (metatype == GEPPETTO.Resources.PARAMETER_NODE) {
								var newNode = GEPPETTO.NodeFactory.createParameterNode(node[i]);
								newNode.setParent(parent);
								// add to parent if applicable
								if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE
										|| parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE) {
									parent.getChildren().push(newNode);
								}
								parent[i] = newNode;
							}
						}
					}

					return parent;
				},
		};
	};
});
