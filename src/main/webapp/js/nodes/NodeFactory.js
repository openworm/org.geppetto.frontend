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
	return function(GEPPETTO) {
		var AspectNode = require('nodes/AspectNode');
		var EntityNode = require('nodes/EntityNode');

		GEPPETTO.NodeFactory = {
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
				
				updateEntityNodes : function(scene){
					for (var name in scene) {
						var node = scene[name];
						if(node._metaType == "EntityNode"){
							for(var index in GEPPETTO.Simulation.entities){
								if(name == index){
									var entityNode = 
										GEPPETTO.Simulation.entities[index];
									
									for (var a in node) {
										var nodeA = node[a];
										if(nodeA._metaType == "AspectNode"){
											for (var aspectKey in entityNode.aspects) {
												var aspect = entityNode.aspects[aspectKey];
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
					}

				},
				
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
				
				createAspectNode : function(name,aspect){
					var instancePath = aspect.instancePath;
					var a = window[name] = new AspectNode(
							{id: aspect.id,modelInterpreter: aspect.modelInterpreter,
								simulator: aspect.simulator,model : aspect.model,
								instancePath : instancePath});
									
					for (var aspectKey in aspect) {
						var node = aspect[aspectKey];
						if(node._metaType == "AspectSubTreeNode"){
							if(node.type == "ModelTree"){
								a.ModelTree = node;
							}else if(node.type == "VisualizationTree"){
								a.VisualizationTree = node;
							}else if(node.type == "SimulationTree"){
								a.SimulationTree = node;
							}		
						}
					}
					
					return a;
				},
		}
	}
});