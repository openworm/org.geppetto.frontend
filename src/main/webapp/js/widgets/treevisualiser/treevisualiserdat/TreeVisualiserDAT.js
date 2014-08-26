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
 * Tree Visualiser Widget
 * 
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */

define(function(require) {

	var TreeVisualiser = require('widgets/treevisualiser/TreeVisualiser');
	var $ = require('jquery');

	return TreeVisualiser.TreeVisualiser.extend({

		defaultTreeVisualiserOptions : {
			width : 400,
			autoPlace : false
		},

		events : {
			'contextmenu .title' : 'manageRightClickEvent'
		},

		manageRightClickEvent : function(event) {
//			nodeName = $(event.target).html();
//			node = this.findVariableInTree(dataset.data, nodeName);

			
			var node = null;
			var ascendantsElements = $(event.target).parentsUntil("#" + this.id,".folder").get().reverse();
			for (var ascendantsElementKey in ascendantsElements){
//			for (var ascendantsElementKey = 0; ascendantsElementKey < ascendantsElements.length -1 ; ascendantsElementKey++) {	
				var label = $(ascendantsElements[ascendantsElementKey]).find(".title").first().html();
				if (node == null){
					for (var datasetKey in this.datasets){
						dataset = this.datasets[datasetKey]; 
						if (dataset.variableToDisplay == ""){
							for (var dataLabel in dataset.data){
								if (dataLabel == label){
									node = dataset.data;
								}
							}
						}
						else if (dataset.variableToDisplay == label){
							node = dataset;
						}
					}
				}
				node = node[label];
			}
			
			
//			$($(event.target).parentsUntil("#" + this.id,".folder").get().reverse()).each(function(){
//				var label = $(this).find(".title").first().html();
//				console.log("entrando");
//				if (node == null){
//					for (var dataset in datasetsTmp){
//						if (dataset.variableToDisplay == label){
//							node = dataset;
//						}
//					}
//				}
//				node = node[label];
//			});
			
			console.log("node", node);
			
			this.showContextMenu(event, node);
		},

		findVariableInTree : function(tree, label) {
			if (tree.hasOwnProperty(label)) {
				return tree[label];
			}
			for (var name in tree) {
				var result = this.findVariableInTree(tree[name], label);
				if (result !== undefined) {
					return result;
				}
			}
			return undefined;
		},

		initialize : function(options) {
			TreeVisualiser.TreeVisualiser.prototype.initialize.call(this,
					options);

			this.options = this.defaultTreeVisualiserOptions;

			this.gui = new dat.GUI({
				width : this.options.width,
				autoPlace : this.options.autoPlace
			});
			// Testing With Real Data
			//this.generateRealDataTestTreeForDAT();

			// Testing With Variable
			//this.setData(hhcell);
//			this.setData(purkinje);

			this.dialog.append(this.gui.domElement);

			// Delegate key and mouse events to View input
			// this.contextMenu = new ContextMenuView.View();

		},

		setData : function(state, options) {
			dataset = TreeVisualiser.TreeVisualiser.prototype.setData.call(
					this, state, options);
			this.prepareTree(this.gui, dataset.data);
			dataset.isDisplayed = true;
			this.datasets.push(dataset);
			
//			if (typeof (state) != 'string') {
//				this.prepareTree(this.gui, state);
//			}
			return "Metadata or variables to display added to tree visualiser";
		},

		prepareTree : function(parent, data) {
//			for ( var key in data) {
				if (data !== null && typeof data === 'object') {
//					parent.add(data, key).listen();
//				}
//				else{
					
					
					//TODO: Remove when visualizationtree is not set as AspectSubTreeNode					
					if (data.type == "VisualizationTree"){
						label = data.type;
						parentFolder = parent.addFolder(label);
					}
					else{
						if (data.getName() === undefined){
							label = data.getId();
						}
						else{
							label = data.getName();
						}
						parentFolder = parent.addFolder(label);
						
						var children = data.getChildren();
						if (children.length > 0){
							var parentFolderTmp = parentFolder; 
							for (var childIndex in children){
								this.prepareTree(parentFolderTmp, children[childIndex]);
							}
						}
					}	
					
					console.log(label);
					console.log(data);
					
				}
//				else {
//					if (data[key] === null) {
//						data[key] = '';
//					}
//					parent.add(data, key).listen();
//				}
//			}
		},

//		createHierarchicalTree : function() {
//			
//		},
		
		updateData : function() {
			for ( var key in this.datasets) {
				dataset = this.datasets[key];

				if (dataset.variableToDisplay != null) {
//					newData = this.getState(GEPPETTO.Simulation.runTimeTree,
//							dataset.variableToDisplay);
//					newDataObject = {};
//					newDataObject[dataset.variableToDisplay] = newData;
					if (!dataset.isDisplayed) {
//						dataset.data = newDataObject;
						this.prepareTree(this.gui, dataset.data);
//						dataset.isDisplayed = true;
					} else {
//						$.extend(true, dataset.data, newDataObject);
					}
				}
			}
		},

		generateRealDataTestTreeForDAT : function() {
			this.setData(this.getTestingData());
		},

		generateRealDataTestTreeForDAT2 : function() {
			this.setData(this.getTestingData2());
		},

		getTestingData : function() {
			return {
				"electrical" : {
					"hhpop" : [ {
						"bioPhys1" : {
							"membraneProperties" : {
								"naChans" : {
									"gDensity" : {
										"value" : 4.1419823201649315,
										"unit" : null,
										"scale" : null
									},
									"na" : {
										"m" : {
											"q" : {
												"value" : 0.21040640018173135,
												"unit" : null,
												"scale" : null
											}
										},
										"h" : {
											"q" : {
												"value" : 0.4046102327961389,
												"unit" : null,
												"scale" : null
											}
										}
									}
								},
								"kChans" : {
									"k" : {
										"n" : {
											"q" : {
												"value" : 0.42015716873953574,
												"unit" : null,
												"scale" : null
											}
										}
									}
								}
							}
						},
						"spiking" : {
							"value" : 0,
							"unit" : null,
							"scale" : null
						},
						"v" : {
							"value" : -0.047481204346777425,
							"unit" : null,
							"scale" : null
						}
					} ]
				}
			};
		},

		getTestingData2 : function() {
			return {
				"electrical2" : {
					"hhpop" : [ {
						"bioPhys1" : {
							"membraneProperties" : {
								"naChans" : {
									"gDensity" : {
										"value" : 4.1419823201649315,
										"unit" : null,
										"scale" : null
									},
									"na" : {
										"m" : {
											"q" : {
												"value" : 0.21040640018173135,
												"unit" : null,
												"scale" : null
											}
										},
										"h" : {
											"q" : {
												"value" : 0.4046102327961389,
												"unit" : null,
												"scale" : null
											}
										}
									}
								},
								"kChans" : {
									"k" : {
										"n" : {
											"q" : {
												"value" : 0.42015716873953574,
												"unit" : null,
												"scale" : null
											}
										}
									}
								}
							}
						},
						"spiking" : {
							"value" : 0,
							"unit" : null,
							"scale" : null
						},
						"v" : {
							"value" : -0.047481204346777425,
							"unit" : null,
							"scale" : null
						}
					} ]
				}
			};
		}

	});
});