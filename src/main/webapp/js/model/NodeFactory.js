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
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require)
{
	return function(GEPPETTO)
	{
		var CompositeNode = require('model/CompositeNode');
		var ParameterNode = require('model/ParameterNode');
		var ParameterSpecificationNode = require('model/ParameterSpecificationNode');
		var DynamicsSpecificationNode = require('model/DynamicsSpecificationNode');
		var FunctionNode = require('model/FunctionNode');
		var VariableNode = require('model/VariableNode');
		var ConnectionNode = require('model/ConnectionNode');
		var TextMetadataNode = require('model/TextMetadataNode');
		var HTMLMetadataNode = require('model/HTMLMetadataNode');
		var VisualObjectReferenceNode = require('model/VisualObjectReferenceNode');
		var VisualGroupNode = require('model/VisualGroupNode');
		var VisualGroupElementNode = require('model/VisualGroupElementNode');
		var ProjectNode = require('model/ProjectNode');
		var ExperimentNode = require('model/ExperimentNode');
		var SimulatorConfiguration = require('model/SimulatorConfiguration');
		var PhysicalQuantity = require('model/PhysicalQuantity');
		var Quantity = require('model/Quantity');
		var simulationTreeCreated = false;

		/**
		 * @class GEPPETTO.RuntimeTreeFactory
		 */
		GEPPETTO.NodeFactory =
		{
			/*
			 * Variables for debugging nodes totals
			 */
			nodes : 0,
			entities : 0,
			connections : 0,
			nodeTags :
			{},

			/**
			 * Reload local values for this and NodeFactory class after load
			 * event is fired
			 */
			reload : function()
			{
				GEPPETTO.NodeFactory.nodes = 0;
				GEPPETTO.NodeFactory.connections = 0;
				GEPPETTO.NodeFactory.entities = 0;
			},

			/** Creates and populates client project nodes */
			createProjectNode : function(project)
			{
				var p = new ProjectNode(
				{
					name : project.name,
					type : project.type,
					id : project.id,
					_metaType : GEPPETTO.Resources.PROJECT_NODE,
				});

				for ( var key in project.experiments)
				{
					var experiment = project.experiments[key];
					var e = this.createExperimentNode(experiment);

					// add experiment to project
					p[key] = e;
					e.setParent(p);
					// add experiment node to project
					p.getExperiments().push(e);

				}

				this.nodes++;
				GEPPETTO.Console.updateTags("Project", p, true);
				return p;
			},

			/** Creates and populates client aspect nodes for first time */
			createExperimentNode : function(node)
			{
				var e = new ExperimentNode(
				{
					name : node.name,
					type : node.type,
					id : node.id,
					description : node.description,
					lastModified : node.lastModified,
					status : node.status,
					script : node.script,
					_metaType : GEPPETTO.Resources.EXPERIMENT_NODE,
				});

				// create visualization subtree only at first
				for ( var key in node.aspectConfigurations)
				{
					var aC = node.aspectConfigurations[key];

					var variables = aC.watchedVariables;
					if (variables != null || variables != undefined)
					{
						for ( var key in variables)
						{
							var variableName = variables[key].entityInstancePath + "." + variables[key].aspect + "." + variables[key].localInstancePath;
							e.getVariables().push(variableName);
						}
					}

					if (aC.simulatorConfiguration != null)
					{
						var aspect = aC.aspect.entityInstancePath + "." + aC.aspect.aspect;
						var sC = this.createSimulatorConfigurationNode(aC.simulatorConfiguration, aspect);
						sC.setParent(e);
						// add simulator configuration node to experiment
						e.addSimulatorConfiguration(aspect, sC);
					}
				}

				this.nodes++;
				GEPPETTO.Console.createTags(e.name, this.nodeTags[GEPPETTO.Resources.EXPERIMENT_NODE]);
				return e;
			},

			/** Creates and populates client aspect nodes for first time */
			createSimulatorConfigurationNode : function(node, aspectInstancePath)
			{
				var sC = new SimulatorConfiguration(
				{
					parameters : node.parameters,
					simulatorId : node.simulatorId,
					conversionId : node.conversionServiceId,
					aspectInstancePath : aspectInstancePath,
					timeStep : node.timestep,
					length : node.length,
					_metaType : GEPPETTO.Resources.SIMULATOR_CONFIGURATION_NODE
				});

				this.nodes++;
				return sC;
			},

			/** Create and populate client entity nodes for the first time */
			createEntityNode : function(entity)
			{
				var e = window[entity.id] = new EntityNode(
				{
					id : entity.id,
					name : entity.id,
					instancePath : entity.instancePath,
					position : entity.position,
					domainType : entity.domainType,
					_metaType : entity._metaType
				});

				for ( var id in entity)
				{
					var node = entity[id];
					// create aspect nodes
					if (node._metaType == GEPPETTO.Resources.ASPECT_NODE)
					{
						var aspectNode = this.createAspectNode(node);

						// set aspectnode as property of entity
						e[id] = aspectNode;
						aspectNode.setParent(e);
						// add aspect node to entity
						e.getAspects().push(aspectNode);
					}
					if (node._metaType == GEPPETTO.Resources.CONNECTION_NODE)
					{
						var connectionNode = this.createConnectionNode(node);

						// set connection as property of entity
						e[id] = connectionNode;
						connectionNode.setParent(e);
						// add aspect node to entity
						e.getConnections().push(connectionNode);
					}
				}
				this.nodes++;
				this.entities++;
				GEPPETTO.Console.createTags(e.instancePath, this.nodeTags[GEPPETTO.Resources.ENTITY_NODE]);
				return e;
			},

			/** Creates and populates client aspect nodes for first time */
			createAspectNode : function(aspect)
			{
				var a = window[aspect.id] = new AspectNode(
				{
					id : aspect.id,
					modelInterpreter : aspect.modelInterpreter,
					name : aspect.id,
					simulator : aspect.simulator,
					model : aspect.model,
					domainType : aspect.domainType,
					instancePath : aspect.instancePath,
					_metaType : GEPPETTO.Resources.ASPECT_NODE
				});

				// create visualization subtree only at first
				for ( var aspectKey in aspect)
				{
					var node = aspect[aspectKey];
					if (node._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
					{
						if (node.type == "VisualizationTree")
						{
							this.createVisualizationTree(node, a);
						} else if (node.type == "SimulationTree")
						{
							var subTree = this.createAspectSubTreeNode(node, a);
							subTree.setParent(a);
							a.SimulationTree = subTree;
							this.createAspectSimulationTree(a.SimulationTree, node, a);
						} else if (node.type == "ModelTree")
						{
							var subTree = this.createAspectSubTreeNode(node, a);
							subTree.setParent(a);
							a.ModelTree = subTree;
						}
					}
				}
				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.ASPECT_NODE]);
				return a;
			},

			/**
			 * Create Visualization Tree
			 * 
			 * @param node -
			 *            JSON server update nodes
  			 * @param aspect -
			 *            aspect tree
			 */
			createVisualizationTree : function(node, aspect)
			{
				var subTree = this.createAspectSubTreeNode(node, aspect);
				subTree.name = "Visualization";

				for ( var key in node)
				{
					if (typeof node[key] == "object")
					{
						if (node[key]._metaType == GEPPETTO.Resources.VISUAL_GROUP_NODE)
						{
							var vg = this.createVisualGroupNode(node[key], aspect);
							vg.setParent(subTree);
							subTree.getChildren().push(vg);
							subTree[key] = vg;
						} 
						else if (node[key]._metaType == GEPPETTO.Resources.COMPOSITE_NODE)
						{
							var c = this.createCompositeNodeInVisualizationTree(node, key, aspect, subTree);
						}
						else if (node[key]._metaType == GEPPETTO.Resources.SKELETON_ANIMATION_NODE){
							subTree[key] = node[key];
							delete node[key];
						}
					}
				}
				aspect.VisualizationTree = subTree;
				subTree.setParent(aspect);
				aspect.VisualizationTree["content"] = node;
			},
			
			/** Creates composite node in the visualization tree (it looks for composite node and visual group node inside each composite node */
			createCompositeNodeInVisualizationTree: function(node, key, aspect, subTree)
			{
				var c = node[key];
				var element = this.createCompositeNode(c, aspect);
				element.setParent(subTree);

				var hasVisualGroup = false;
				for ( var vg in c)
				{
					if (typeof c[vg] == "object")
					{
						if (c[vg]._metaType == GEPPETTO.Resources.VISUAL_GROUP_NODE)
						{
							var group = this.createVisualGroupNode(c[vg], aspect);
							group.setParent(element);
							element.getChildren().push(group);
							element[vg] = group;
							hasVisualGroup = true;
						}
						else if (c[vg]._metaType == GEPPETTO.Resources.COMPOSITE_NODE)
						{
							var group = this.createCompositeNodeInVisualizationTree(c, vg, aspect, element);
							hasVisualGroup = true;
						}
					}
				}

				if (hasVisualGroup)
				{
					subTree.getChildren().push(element);
					subTree[key] = element;
				}
				return element;
			},

			/**
			 * Create Simulation Tree
			 * 
			 * @param parent -
			 *            Used to store the created client nodes
			 * @param node -
			 *            JSON server update nodes
			 * @param aspect -
			 *            aspect tree
			 */
			createAspectSimulationTree : function(parent, node, aspect)
			{
				// traverse throuh node to find objects
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

							// create nodes for each array index
							for (var index = 0; index < array.length; index++)
							{
								// create parent composite node for array nodes
								var arrayNode = GEPPETTO.NodeFactory.createCompositeNode(
								{
									id : i + "[" + index + "]",
									name : i + "[" + index + "]",
									instancePath : node.instancePath + "." + i + "[" + index + "]",
									_metaType : GEPPETTO.Resources.COMPOSITE_NODE
								});
								parent.getChildren().push(arrayNode);

								parent[i][index] =
								{};
								// create nodes for each array index node
								var arrayObject = this.createAspectSimulationTree(arrayNode, array[index], aspect);
								// set instance path of created array node and
								// set as property
								if (arrayObject.getChildren().length > 0)
								{
									parent[i][index] = arrayObject;
								}
							}
						}
						// if object is CompositeNode, do recursion to find
						// children
						else if (metatype == GEPPETTO.Resources.COMPOSITE_NODE)
						{
							var newNode = GEPPETTO.NodeFactory.createCompositeNode(node[i], true, aspect);
							newNode.setParent(parent);
							// add to parent if applicable
							if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
							{
								parent.getChildren().push(newNode);
							}
							parent[i] = newNode;

							// traverse through children of composite node
							this.createAspectSimulationTree(parent[i], node[i]);
						} else if (metatype == GEPPETTO.Resources.VARIABLE_NODE)
						{
							var newNode = GEPPETTO.NodeFactory.createVariableNode(node[i], aspect);
							newNode.setParent(parent);
							// add to parent if applicable
							if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
							{
								parent.getChildren().push(newNode);
							}
							parent[i] = newNode;
						} else if (metatype == GEPPETTO.Resources.PARAMETER_NODE)
						{
							var newNode = GEPPETTO.NodeFactory.createParameterNode(node[i], aspect);
							newNode.setParent(parent);
							// add to parent if applicable
							if (parent._metaType == GEPPETTO.Resources.COMPOSITE_NODE || parent._metaType == GEPPETTO.Resources.ASPECT_SUBTREE_NODE)
							{
								parent.getChildren().push(newNode);
							}
							parent[i] = newNode;
						}
					}
				}

				return parent;
			},

			/** Creates and populates client aspect nodes for first time */
			createAspectSubTreeNode : function(node, aspect)
			{
				var a = new AspectSubTreeNode(
				{
					name : node.type,
					type : node.type,
					id : node.id,
					name : node.name,
					instancePath : node.instancePath,
					domainType : node.domainType,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.ASPECT_SUBTREE_NODE,
				});

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.ASPECT_SUBTREE_NODE]);
				return a;
			},

			/** Creates and populates client aspect nodes for first time */
			createCompositeNode : function(node, aspect)
			{
				var a = new CompositeNode(
				{
					id : node.id,
					name : node.name,
					instancePath : node.instancePath,
					domainType : node.domainType,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.COMPOSITE_NODE
				});

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.COMPOSITE_NODE]);
				return a;
			},

			/** Creates and populates client aspect nodes for first time */
			createFunctionNode : function(node, aspect)
			{
				var a = new FunctionNode(
				{
					id : node.id,
					name : node.name,
					expression : node.expression,
					plotMetadata : node.plotMetadata,
					arguments : node.arguments,
					instancePath : node.instancePath,
					domainType : node.domainType,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.FUNCTION_NODE
				});

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.FUNCTION_NODE]);
				return a;
			},

			/** Creates and populates client aspect nodes for first time */
			createDynamicsSpecificationNode : function(node, aspect)
			{
				var a = new DynamicsSpecificationNode(
				{
					id : node.id,
					name : node.name,
					value : node.value,
					unit : node.unit,
					scalingFactor : node.scalingFactor,
					instancePath : node.instancePath,
					domainType : node.domainType,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.DYNAMICS_NODE
				});
				var f = new FunctionNode(
				{
					expression : node._function.expression,
					instancePath : node.instancePath,
					arguments : node._function.arguments
				});

				a.dynamics.push(f);

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.DYNAMICS_NODE]);
				return a;
			},

			/** Creates and populates client aspect nodes for first time */
			createParameterSpecificationNode : function(node, aspect)
			{
				var a = new ParameterSpecificationNode(
				{
					id : node.id,
					name : node.name,
					value : node.value,
					unit : node.unit,
					scalingFactor : node.scalingFactor,
					instancePath : node.instancePath,
					domainType : node.domainType,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.PARAMETER_SPEC_NODE
				});

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.PARAMETER_SPEC_NODE]);
				return a;
			},

			/** Creates and populates client parameter nodes for first time */
			createParameterNode : function(node, aspect)
			{
				var a = new ParameterNode(
				{
					id : node.id,
					name : node.name,
					unit : node.unit,
					instancePath : node.instancePath,
					watched : (node.watched === 'true'),
					domainType : node.domainType,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.PARAMETER_NODE
				});

				var timeSeries = node.timeSeries;
				for ( var key in timeSeries)
				{
					if (typeof timeSeries[key] == "object")
					{
						var obj = timeSeries[key];
						var element = new Quantity(obj.value, obj.scale);
						a.getTimeSeries().push(element);
					}
				}

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.PARAMETER_NODE]);
				return a;
			},

			/** Creates and populates client connection nodes for first time */
			createConnectionNode : function(node)
			{
				var aspect = eval(node.aspectInstancePath);

				var a = new ConnectionNode(
				{
					id : node.id,
					type : node.type,
					name : node.name,
					entityInstancePath : node.entityInstancePath,
					instancePath : node.instancePath,
					domainType : node.domainType,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.CONNECTION_NODE
				});

				this.nodes++;
				this.connections++;
				this.populateConnectionNode(a, node, aspect);
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.CONNECTION_NODE]);
				return a;
			},

			populateConnectionNode : function(a, node, aspect)
			{
				for ( var key in node)
				{
					if (typeof node[key] == "object")
					{
						if (node[key]._metaType == GEPPETTO.Resources.COMPOSITE_NODE)
						{
							var composite = this.createCompositeNode(node[key]);
							this.populateConnectionNode(composite, node[key], aspect);
							composite.setParent(a);
							a.getCustomNodes().push(composite);
							a[key] = composite;
						} else if (node[key]._metaType == GEPPETTO.Resources.PARAMETER_NODE)
						{
							var custom = this.createParameterNode(node[key], aspect);
							custom.setParent(a);
							if (a._metaType == GEPPETTO.Resources.COMPOSITE_NODE)
							{
								a.getChildren().push(custom);
							} else
							{
								a.getCustomNodes().push(custom);
							}
							a[key] = custom;
						} else if (node[key]._metaType == GEPPETTO.Resources.PARAMETER_SPEC_NODE)
						{
							var custom = this.createParameterSpecificationNode(node[key], aspect);
							custom.setParent(a);
							if (a._metaType == GEPPETTO.Resources.COMPOSITE_NODE)
							{
								a.getChildren().push(custom);
							} else
							{
								a.getCustomNodes().push(custom);
							}
							a[key] = custom;
						} else if (node[key]._metaType == GEPPETTO.Resources.HTML_METADATA_NODE)
						{
							var custom = this.createHTMLMetadataNode(node[key], aspect);
							custom.setParent(a);
							if (a._metaType == GEPPETTO.Resources.COMPOSITE_NODE)
							{
								a.getChildren().push(custom);
							} else
							{
								a.getCustomNodes().push(custom);
							}
							a[key] = custom;
						} else if (node[key]._metaType == GEPPETTO.Resources.TEXT_METADATA_NODE)
						{
							var custom = this.createTextMetadataNode(node[key], aspect);
							custom.setParent(a);
							if (a._metaType == GEPPETTO.Resources.COMPOSITE_NODE)
							{
								a.getChildren().push(custom);
							} else
							{
								a.getCustomNodes().push(custom);
							}
							a[key] = custom;
						} else if (node[key]._metaType == GEPPETTO.Resources.VISUAL_REFERENCE_NODE)
						{
							var vis = this.createVisualReferenceNode(node[key], aspect);
							vis.setParent(a);
							if (a._metaType == GEPPETTO.Resources.COMPOSITE_NODE)
							{
								a.getChildren().push(vis);
							} else
							{
								a.getVisualObjectReferenceNodes().push(vis);
							}
							a[key] = custom;
						}
					}
				}
				return a;
			},

			/** Creates and populates client connection nodes for first time */
			createVisualReferenceNode : function(node, aspect)
			{
				var a = new VisualObjectReferenceNode(
				{
					id : node.id,
					type : node.type,
					name : node.name,
					aspectInstancePath : node.aspectInstancePath,
					domainType : node.domainType,
					instancePath : node.instancePath,
					aspectNode : aspect,
					visualObjectID : node.visualObjectID,
					_metaType : GEPPETTO.Resources.VISUAL_REFERENCE_NODE,
				});

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.VISUAL_REFERENCE_NODE]);
				return a;
			},

			/** Creates and populates client connection nodes for first time */
			createTextMetadataNode : function(node, aspect)
			{
				var a = new TextMetadataNode(
				{
					id : node.id,
					value : node.value,
					name : node.name,
					aspectInstancePath : node.aspectInstancePath,
					instancePath : node.instancePath,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.TEXT_METADATA_NODE,
				});

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.TEXT_METADATA_NODE]);
				return a;
			},
			
			/** Creates and populates client connection nodes for first time */
			createHTMLMetadataNode : function(node, aspect)
			{
				var a = new HTMLMetadataNode(
				{
					id : node.id,
					value : node.value,
					name : node.name,
					aspectInstancePath : node.aspectInstancePath,
					instancePath : node.instancePath,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.HTML_METADATA_NODE,
				});

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.HTML_METADATA_NODE]);
				return a;
			},			

			/** Creates and populates client aspect nodes for first time */
			createVariableNode : function(node, aspect)
			{
				var a = new VariableNode(
				{
					id : node.id,
					name : node.name,
					unit : node.unit,
					instancePath : node.instancePath,
					watched : (node.watched === 'true'),
					domainType : node.domainType,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.VARIABLE_NODE
				});

				var timeSeries = node.timeSeries;
				for ( var key in timeSeries)
				{
					if (typeof timeSeries[key] == "object")
					{
						var obj = timeSeries[key];
						var element = new Quantity(obj.value, obj.scale);
						a.getTimeSeries().push(element);
					}
				}

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.VARIABLE_NODE]);
				return a;
			},

			/** Creates and populates client visual group nodes for first time */
			createVisualGroupElementNode : function(node, aspect)
			{
				var a = new VisualGroupElementNode(
				{
					id : node.id,
					name : node.name,
					unit : node.unit,
					color : node.color,
					parameter : node.parameter,
					instancePath : node.instancePath,
					domainType : node.domainType,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.VISUAL_GROUP_ELEMENT_NODE
				});
				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.VISUAL_GROUP_ELEMENT_NODE]);
				return a;
			},
			/** Creates and populates client Visual Group nodes for first time */
			createVisualGroupNode : function(node, aspect)
			{
				var a = new VisualGroupNode(
				{
					id : node.id,
					name : node.name,
					type : node.type,
					lowSpectrumColor : node.lowSpectrumColor,
					highSpectrumColor : node.highSpectrumColor,
					instancePath : node.instancePath,
					domainType : node.domainType,
					aspectNode : aspect,
					_metaType : GEPPETTO.Resources.VISUAL_GROUP_NODE
				});

				for ( var key in node)
				{
					if (typeof node[key] == "object")
					{
						if (node[key]._metaType == GEPPETTO.Resources.VISUAL_GROUP_ELEMENT_NODE)
						{
							var element = this.createVisualGroupElementNode(node[key]);
							element.setParent(a);
							a.getVisualGroupElements().push(element);
							a[key] = element;
						}
					}
				}

				this.nodes++;
				GEPPETTO.Console.createTags(a.instancePath, this.nodeTags[GEPPETTO.Resources.VISUAL_GROUP_NODE]);
				return a;
			},

			/**
			 * Populates tags for nodes
			 */
			populateTags : function()
			{
				var e = new EntityNode(
				{});
				this.nodeTags[GEPPETTO.Resources.ENTITY_NODE] = GEPPETTO.Utility.extractMethodsFromObject(e, true);
				delete e;
				var a = new AspectNode(
				{});
				this.nodeTags[GEPPETTO.Resources.ASPECT_NODE] = GEPPETTO.Utility.extractMethodsFromObject(a, true);
				delete a;
				var c = new ConnectionNode(
				{});
				this.nodeTags[GEPPETTO.Resources.CONNECTION_NODE] = GEPPETTO.Utility.extractMethodsFromObject(c, true);
				delete c;
				var v = new VariableNode(
				{});
				this.nodeTags[GEPPETTO.Resources.VARIABLE_NODE] = GEPPETTO.Utility.extractMethodsFromObject(v, true);
				delete v;
				var subtree = new AspectSubTreeNode(
				{});
				this.nodeTags[GEPPETTO.Resources.ASPECT_SUBTREE_NODE] = GEPPETTO.Utility.extractMethodsFromObject(subtree, true);
				delete subtree;
				var comp = new CompositeNode(
				{});
				this.nodeTags[GEPPETTO.Resources.COMPOSITE_NODE] = GEPPETTO.Utility.extractMethodsFromObject(comp, true);
				delete comp;
				var f = new FunctionNode(
				{});
				this.nodeTags[GEPPETTO.Resources.FUNCTION_NODE] = GEPPETTO.Utility.extractMethodsFromObject(f, true);
				delete f;
				var d = new DynamicsSpecificationNode(
				{});
				this.nodeTags[GEPPETTO.Resources.DYNAMICS_NODE] = GEPPETTO.Utility.extractMethodsFromObject(d, true);
				delete d;
				var p = new ParameterNode(
				{});
				this.nodeTags[GEPPETTO.Resources.PARAMETER_NODE] = GEPPETTO.Utility.extractMethodsFromObject(p, true);
				delete p;
				var ps = new ParameterSpecificationNode(
				{});
				this.nodeTags[GEPPETTO.Resources.PARAMETER_SPEC_NODE] = GEPPETTO.Utility.extractMethodsFromObject(ps, true);
				delete ps;
				var t = new TextMetadataNode(
				{});
				this.nodeTags[GEPPETTO.Resources.TEXT_METADATA_NODE] = GEPPETTO.Utility.extractMethodsFromObject(t, true);
				delete t;
				var a = new AspectNode(
				{});
				this.nodeTags[GEPPETTO.Resources.ASPECT_NODE] = GEPPETTO.Utility.extractMethodsFromObject(a, true);
				delete a;
				var vg = new VisualGroupNode(
				{});
				this.nodeTags[GEPPETTO.Resources.VISUAL_GROUP_NODE] = GEPPETTO.Utility.extractMethodsFromObject(vg, true);
				delete vg;
				var vge = new VisualGroupElementNode(
				{});
				this.nodeTags[GEPPETTO.Resources.VISUAL_GROUP_ELEMENT_NODE] = GEPPETTO.Utility.extractMethodsFromObject(vge, true);
				delete vge;
				var vor = new VisualObjectReferenceNode(
				{});
				this.nodeTags[GEPPETTO.Resources.VISUAL_REFERENCE_NODE] = GEPPETTO.Utility.extractMethodsFromObject(vor, true);
				delete vor;
			},
		};
	};
});
