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
		var CompositeVariableNode = require('nodes/CompositeVariableNode');
		var ParameterNode = require('nodes/ParameterNode');
		var ParameterSpecificationNode = require('nodes/ParameterSpecificationNode');
		var DynamicsSpecificationNode = require('nodes/DynamicsSpecificationNode');
		var FunctionNode = require('nodes/FunctionNode');
		var VariableNode = require('nodes/VariableNode');
		
		GEPPETTO.NodeFactory = {
				/*Creates the nodes for the first time depending on type*/
				createNodes : function(scene){
					for (var name in scene) {
						var node = scene[name];
						if(node._metaType == "EntityNode"){
							var entityNode = 
								GEPPETTO.NodeFactory.createEntityNode(name,node);
							
							GEPPETTO.Simulation.entities[name]= entityNode;
						}
					}

				},
				
				/*Update entities of scene with new updates*/
				updateSceneNodes : function(scene){
					for (var name in scene) {
						var node = scene[name];
						if(node._metaType == "EntityNode"){
							if(GEPPETTO.Simulation.entities.hasOwnProperty(name)){
								var entityNode = 
									GEPPETTO.Simulation.entities[name];

								for (var a in node) {
									var nodeA = node[a];
									if(nodeA._metaType == "AspectNode"){
										for (var aspectKey in entityNode.aspects) {
											var aspect = entityNode.aspects[aspectKey];
											//we don't update the model tree, unless it will change 
											//if/when simulation is running
											if(aspect.instancePath == nodeA.instancePath){
												aspect.VisualizationTree = nodeA.VisualizationTree;
												aspect.SimulationTree = nodeA.SimulationTree;	
											}
										}
									}
								}
							}
						}
					}

				},
				
				updateAspectSimulationTree : function(simulationTree){
					var obj= GEPPETTO.Simulation.entities;
					
					for (var i=0, path=aspectID.split('.'), len=path.length; i<len; i++){
				        obj = obj[path[i]];
				    };
				    
				    obj.SimulationTree = this.createModelTree({}, simulationTree);
				    
				    var formattedNode = GEPPETTO.Utility.formatnode(obj.SimulationTree, 3, "");
				    formattedNode = formattedNode.substring(0, formattedNode.lastIndexOf("\n"));
				    formattedNode.replace(/"/g, "");
				    
				    GEPPETTO.Console.log(formattedNode);
				},
				
				createAspectModelTree : function(aspectID, modelTree){
					var obj= GEPPETTO.Simulation.entities;
					
					for (var i=0, path=aspectID.split('.'), len=path.length; i<len; i++){
				        obj = obj[path[i]];
				    };
				    
				    obj.ModelTree = this.modelJSONToNodes({}, modelTree);
				    
				    var formattedNode = GEPPETTO.Utility.formatnode(obj.ModelTree, 3, "");
				    formattedNode = formattedNode.substring(0, formattedNode.lastIndexOf("\n"));
				    formattedNode.replace(/"/g, "");
				    
				    GEPPETTO.Console.log(formattedNode);
				},
				
				modelJSONToNodes : function(parent, node){				    
					// node is always an array of variables
					for(var i in node) {
						if(typeof node[i] === "object") {
							var metatype = node[i]._metaType;

							if(metatype == "CompositeVariableNode"){
								parent[i]=this.createCompositeVariableNode(i,node[i]);
								this.modelJSONToNodes(parent[i], node[i]);
							}
							else if(metatype == "FunctionNode"){
								var functionNode =  this.createFunctionNode(i,node[i]);
								parent.get("children").add(functionNode);
								parent[i] = functionNode;
							}
							else if(metatype == "DynamicsSpecificationNode"){
								var dynamicsSpecificationNode =  this.createDynamicsSpecificationNode(i,node[i]);
								parent.get("children").add(dynamicsSpecificationNode);
								parent[i] = dynamicsSpecificationNode;
							}
							else if(metatype == "ParameterSpecificationNode"){
								var parameterSpecificationNode =  this.createParameterSpecificationNode(i,node[i]);
								parent.get("children").add(parameterSpecificationNode);
								parent[i] = parameterSpecificationNode;
							}
						}
					}
					
					return parent;
				},
				
				createSimulationTree : function(parent, node){				    
					// node is always an array of variables
					for(var i in node) {
						if(typeof node[i] === "object") {
							var metatype = node[i]._metaType;

							if(metatype == "CompositeVariableNode"){
								parent[i]=this.createCompositeVariableNode(i,node[i]);
								this.createSimulationTree(parent[i], node[i]);
							}
							else if(metatype == "VariableNode"){
								var variableNode =  this.createVariableNode(i,node[i]);
								parent.get("children").add(variableNode);
								parent[i] = variableNode;
							}
							else if(metatype == "ParameterNode"){
								var parameterNode =  this.createParameterNode(i,node[i]);
								parent.get("children").add(parameterNode);
								parent[i] = parameterNode;
							}
						}
					}
					
					return parent;
				},
				
				/*Create and populate client entity nodes for the first time*/
				createEntityNode : function(name,entity){
					var e = window[name] = new EntityNode(
							{id:entity.id, instancePath : entity.instancePath,position : entity.position});
					//add commands to console autocomplete and help option
					GEPPETTO.Utility.updateCommands("js/nodes/EntityNode.js", e, name);
					
					for (var name in entity) {
						var node = entity[name];
						if(node._metaType == "AspectNode"){
							var aspectNode = 
								GEPPETTO.NodeFactory.createAspectNode(name, node);
							
							e[name] =aspectNode;
							e.get("aspects").add(aspectNode);
						}
					}
					
					return e;
				},
				
				/*Creates and populates client aspect nodes for first time*/
				createAspectNode : function(name,aspect){
					var instancePath = aspect.instancePath;
					var a = window[name] = new AspectNode(
							{id: aspect.id,modelInterpreter: aspect.modelInterpreter,
								simulator: aspect.simulator,model : aspect.model,
								instancePath : instancePath});
									
					for (var aspectKey in aspect) {
						var node = aspect[aspectKey];
						if(node._metaType == "AspectSubTreeNode"){
							if(node.type == "VisualizationTree"){
								a.VisualizationTree = node;
							}		
						}
					}
					
					return a;
				},
				
				/*Creates and populates client aspect nodes for first time*/
				createCompositeVariableNode : function(name,node){
					var a = window[name] = new CompositeVariableNode(
							{id: name, name : name, _metaType : "CompositeVariableNode"});
					return a;
				},
				
				/*Creates and populates client aspect nodes for first time*/
				createFunctionNode : function(name,node){
					var a = window[name] = new FunctionNode(
							{name: name, expression : node.expression, arguments : node.arguments,
								_metaType : "FunctionNode"});
					return a;
				},
				/*Creates and populates client aspect nodes for first time*/
				createDynamicsSpecificationNode : function(name,node){
					var a = window[name] = new DynamicsSpecificationNode(
							{name: name, value : node.value, unit : node.unit, 
								scalingFactor : node.scalingFactor,_metaType : "DynamicsSpecificationNode"});
					
					var f = new FunctionNode(
							{expression : node.expression, arguments : node.arguments});
					
					a.set("dynamics",f);
					
					return a;
				},
				/*Creates and populates client aspect nodes for first time*/
				createParameterSpecificationNode : function(name,node){
					var a = window[name] = new ParameterSpecificationNode(
							{name: name, value : node.value, unit : node.unit, 
								scalingFactor : node.scalingFactor,_metaType : "ParameterSpecificationNode"});
					return a;
				},
				/*Creates and populates client aspect nodes for first time*/
				createParameterNode : function(name,node){
					var a = window[name] = new ParameterNode(
							{name: name, _metaType : "ParameterNode"});
					return a;
				},
				/*Creates and populates client aspect nodes for first time*/
				createVariableNode : function(name,node){
					var a = window[name] = new VariableNode(
							{name: name, value : node.value, unit : node.unit, 
								scalingFactor : node.scalingFactor,_metaType : "VariableNode"});
					return a;
				},
		};
	};
});