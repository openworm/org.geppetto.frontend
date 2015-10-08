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
 * Factory class that figures out what kind of nodes to create with the updates received from the server. Creates the client nodes for entities, aspects, etc and updates them.
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require)
{
	return function(GEPPETTO)
	{
		var simulationTreeCreated = false;
		var Quantity = require('nodes/Quantity');

		/**
		 * @class GEPPETTO.RuntimeTreeController
		 */
		GEPPETTO.RuntimeTreeController =
		{
			/**
			 * Creates the backbone nodes for the first time depending.
			 */
			createRuntimeTree : function(jsonRuntimeTree)
			{
				this.simulationTreeCreated = false;
				GEPPETTO.NodeFactory.populateTags();
				var entityNode = null;
				for ( var id in jsonRuntimeTree)
				{
					var node = jsonRuntimeTree[id];
					if (node._metaType == GEPPETTO.Resources.ENTITY_NODE)
					{
						entityNode = GEPPETTO.NodeFactory.createEntityNode(node);

						// keep track of client entity nodes created
						window["Project"].runTimeTree[id] = entityNode;

						this.traverseEntities(node, entityNode, window["Project"].runTimeTree[id]);
					}
				}

				if (entityNode != null)
				{
					// add commands to console autocomplete and help option
					GEPPETTO.Console.updateHelpCommand("geppetto/js/nodes/EntityNode.js", entityNode, entityNode.getId());
				}
			},

			/**
			 * Traverse through entities to create children *
			 * 
			 * @name RuntimeTreeController#traverseEntities
			 */
			traverseEntities : function(entities, parentNode, runTimeRef)
			{
				for ( var id in entities)
				{
					var node = entities[id];
					if (node._metaType == GEPPETTO.Resources.ENTITY_NODE)
					{
						var entityNode = GEPPETTO.NodeFactory.createEntityNode(node);

						runTimeRef[id] = entityNode;
						entityNode.setParent(parentNode);
						parentNode.getEntities().push(entityNode);

						this.traverseEntities(node, entityNode);
					}
				}
			},
			/** Traverse the tree, when an aspect is found */
			updateNode : function(node)
			{
				var experiment = window.Project.getActiveExperiment();
				for ( var c in node)
				{
					var child = node[c];
					var aspectNode = eval(child.aspectInstancePath);
					if (child.SimulationTree != undefined)
					{
						if (jQuery.isEmptyObject(aspectNode.SimulationTree) || aspectNode.SimulationTree == undefined)
						{
							this.populateAspectSimulationTree(aspectNode.instancePath, child.SimulationTree);
						} else
						{
							// update existing simulation tree
							var simulationTree = child.SimulationTree;
							// extract time from simulation tree
							if (simulationTree.time != null || undefined)
							{
								var timeNode = GEPPETTO.NodeFactory.createVariableNode(simulationTree.time);
								window.Project.getActiveExperiment().time = timeNode;
							}
							var variables = experiment.getVariables();
							// find variable node in experiment
							for ( var v in variables)
							{
								var state = variables[v];
								// format state in a way to match what server is sending
								var splitState = state.split(".SimulationTree.");
								if (splitState[0] == child.aspectInstancePath)
								{
									var formattedState = splitState[1];
									var received = eval("simulationTree." + formattedState);

									var clientNode = eval(state);
									clientNode.getTimeSeries().unshift();
									clientNode.setUnit(received.unit);

									for ( var index in received.timeSeries)
									{
										clientNode.getTimeSeries().push(new Quantity(received.timeSeries[index].value, received.timeSeries[index].scale));
									}
								}
							}
						}
					}
				}
			},

			/** Update entities of scene with new server updates */
			updateVisualTrees : function(jsonRuntimeTree)
			{
				for ( var c in jsonRuntimeTree)
				{
					var node = jsonRuntimeTree[c];
					// check if it's a visualization tree
					if (node.VisualizationTree !== undefined)
					{
						if (node.VisualizationTree._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
						{
							// get the right node
							var vizTree = GEPPETTO.Utility.deepFind(node.VisualizationTree.instancePath);

							// #NOTE:0 loop and add SKELETON_ANIMATION_NODE at the
							// right level of nesting (only geometries go inside
							// "content" property)
							for ( var key in node.VisualizationTree)
							{
								if (node.VisualizationTree.hasOwnProperty(key))
								{
									var obj = node.VisualizationTree[key];

									if (obj._metaType == GEPPETTO.Resources.SKELETON_ANIMATION_NODE)
									{
										// add to viz tree
										vizTree.transformation = obj;
										delete node.VisualizationTree[key];
									}
								}
							}

							// set viz tree contents
							vizTree.content = node.VisualizationTree;
						}
					}
				}
			},

			/** Update entities of scene with new server updates */
			updateRuntimeTree : function(jsonRuntimeTree)
			{
				this.updateNode(jsonRuntimeTree);
				this.updateVisualTrees(jsonRuntimeTree);
			},

			/**
			 * Create Model Tree for aspect
			 * 
			 * @param aspectInstancePath -
			 *            Path of aspect to populate
			 * @param modelTree -
			 *            Server JSON update
			 */
			populateAspectModelTree : function(aspectInstancePath, modelTree)
			{
				var aspect = GEPPETTO.Utility.deepFind(aspectInstancePath);

				// populate model tree with server nodes
				this.createAspectModelTree(aspect.ModelTree, modelTree, aspect);

				// notify user received tree was empty
				if (aspect.ModelTree.getChildren().length == 0)
				{
					var indent = "    ";
					GEPPETTO.Console.log(indent + GEPPETTO.Resources.EMPTY_MODEL_TREE);
				} else
				{
					GEPPETTO.Console.executeCommand(aspect.ModelTree.instancePath + ".print()");
					aspect.ModelTree.print();
				}
			},

			/**
			 * Create Model Tree using JSON server update
			 * 
			 * @param parent -
			 *            Used to store the created client nodes
			 * @param node -
			 *            JSON server update nodes
			 */
			createAspectModelTree : function(parent, node, aspect)
			{
				// traverse through nodes to create model tree
				for ( var i in node)
				{
					if (typeof node[i] === "object")
					{
						var metatype = node[i]._metaType;

						// if object is array, do recursion to find more objects
						if (node[i] instanceof Array)
						{
							var array = node[i];
							parent[i] = [];
							var arrayNode = new CompositeNode(
							{
								id : i,
								name : i,
								_metaType : GEPPETTO.Resources.COMPOSITE_NODE
							});
							arrayNode.setParent(parent);
							parent.getChildren().push(arrayNode);
							for ( var index in array)
							{
								parent[i][index] =
								{};
								var arrayObject = this.modelJSONNodes(arrayNode, array[index]);
								parent[i][index] = arrayObject;
							}
						}

						/* Match type of node and created */
						if (metatype == GEPPETTO.Resources.COMPOSITE_NODE)
						{
							var compositeNode = GEPPETTO.NodeFactory.createCompositeNode(node[i], aspect);
							compositeNode.setParent(parent);
							if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
							{
								parent.getChildren().push(compositeNode);
							}
							parent[i] = compositeNode;
							// traverse through children of composite node
							this.createAspectModelTree(parent[i], node[i], aspect);
						} else if (metatype == GEPPETTO.Resources.FUNCTION_NODE)
						{
							var functionNode = GEPPETTO.NodeFactory.createFunctionNode(node[i], aspect);
							functionNode.setParent(parent);
							if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
							{
								parent.getChildren().push(functionNode);
							}
							parent[i] = functionNode;
						} else if (metatype == GEPPETTO.Resources.DYNAMICS_NODE)
						{
							var dynamicsSpecificationNode = GEPPETTO.NodeFactory.createDynamicsSpecificationNode(node[i], aspect);
							dynamicsSpecificationNode.setParent(parent);
							if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
							{
								parent.getChildren().push(dynamicsSpecificationNode);
							}
							parent[i] = dynamicsSpecificationNode;
						} else if (metatype == GEPPETTO.Resources.PARAMETER_SPEC_NODE)
						{
							var parameterSpecificationNode = GEPPETTO.NodeFactory.createParameterSpecificationNode(node[i], aspect);
							parameterSpecificationNode.setParent(parent);
							if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
							{
								parent.getChildren().push(parameterSpecificationNode);
							}
							parent[i] = parameterSpecificationNode;
						} else if (metatype == GEPPETTO.Resources.TEXT_METADATA_NODE)
						{
							var textMetadataNode = GEPPETTO.NodeFactory.createTextMetadataNode(node[i], aspect);
							textMetadataNode.setParent(parent);
							if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
							{
								parent.getChildren().push(textMetadataNode);
							}
							parent[i] = textMetadataNode;
						} else if (metatype == GEPPETTO.Resources.VARIABLE_NODE)
						{
							var variableNode = GEPPETTO.NodeFactory.createVariableNode(node[i], aspect);
							variableNode.setParent(parent);
							if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
							{
								parent.getChildren().push(variableNode);
							}
							parent[i] = variableNode;
						}
					}
				}

				return parent;
			},

			/**
			 * Update and create simulation Tree for aspect
			 * 
			 * @param aspectInstancePath -
			 *            Path of aspect to update
			 * @param simulationTree -
			 *            Server JSON update
			 */
			populateAspectSimulationTree : function(aspectInstancePath, simulationTree)
			{
				var aspect = GEPPETTO.Utility.deepFind(aspectInstancePath);

				// Clear Simulation Tree
				aspect.SimulationTree.children = new Array();

				// populate model tree with server nodes
				GEPPETTO.NodeFactory.createAspectSimulationTree(aspect.SimulationTree, simulationTree);

				// notify user received tree was empty
				// #NOTE:0 Don't print to console.log in here, this function is recursive,
				// and for entities with subentities it repeats printing same statement over and over again
				if (aspect.SimulationTree.getChildren().length == 0)
				{
					var indent = "    ";
					GEPPETTO.Console.debugLog(indent + GEPPETTO.Resources.EMPTY_SIMULATION_TREE);
				} else
				{
					GEPPETTO.Console.debugLog(indent + GEPPETTO.Resources.SIMULATION_TREE_POPULATED);
				}

				this.simulationTreeCreated = true;
			},
		};
	};
});
