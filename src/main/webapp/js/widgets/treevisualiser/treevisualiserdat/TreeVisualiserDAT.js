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
 * @module Widgets/TreeVisualizerDAT
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */

define(function(require) {

	var TreeVisualiser = require('widgets/treevisualiser/TreeVisualiser');
	var $ = require('jquery');

	return TreeVisualiser.TreeVisualiser.extend({

		defaultTreeVisualiserOptions : {
			width : "auto",
			autoPlace : false,
			expandNodes: false
		},
		
		/**
		 * Initializes the TreeVisualiserDAT given a set of options
		 * 
		 * @param {Object} options - Object with options for the TreeVisualiserDAT widget
		 */
		initialize : function(options) {
			TreeVisualiser.TreeVisualiser.prototype.initialize.call(this, options);

			this.options = this.defaultTreeVisualiserOptions;

			this.gui = new dat.GUI({
				width : this.options.width,
				autoPlace : this.options.autoPlace
			});

			this.dialog.append(this.gui.domElement);
		},
		
		/**
		 * Action events associated with this widget
		 */
		events : {
			'contextmenu .title' : 'manageRightClickEvent'
		},

		/**
		 * Register right click event with widget
		 * 
		 * @param {WIDGET_EVENT_TYPE} event - Handles right click event on widget
		 */
		manageRightClickEvent : function(event) {
			//Read node from instancepath data property attached to dom element
			this.showContextMenu(event, eval($(event.target).data("instancepath")));
		},

		/**
		 * Sets the data used inside the TreeVisualiserDAT for rendering. 
		 * 
		 * @param {Array} state - Array of variables used to display inside TreeVisualiserDAT
		 * @param {Object} options - Set of options passed to widget to customize it
		 */
		setData : function(state, options) {
			dataset = TreeVisualiser.TreeVisualiser.prototype.setData.call(this, state, options);
			dataset.valueDict = {};
			
			this.prepareTree(this.gui, dataset.data);

			dataset.isDisplayed = true;
			this.datasets.push(dataset);

			return "Metadata or variables to display added to tree visualiser";
		},

		/**
		 * Prepares the tree for painting it on the widget
		 * 
		 * @param {Object} parent - Parent tree to paint
		 * @param {Array} data - Data to paint
		 */
		prepareTree : function(parent, data) {
			if (data._metaType != null){
				//TODO: Remove once all getName are implemented in all nodes
				if (data.getName() === undefined && data.getName() != ""){label = data.getId();}
				else{label = data.getName();}
				
				if (data._metaType == "VariableNode"  | data._metaType == "DynamicsSpecificationNode" | data._metaType == "ParameterSpecificationNode" |
						data._metaType == "TextMetadataNode" | data._metaType == "FunctionNode" |
						data._metaType == "VisualObjectReferenceNode" | data._metaType == "VisualGroupElementNode") {
					if (!dataset.isDisplayed) {
						dataset.valueDict[data.instancePath] = {};
						
						dataset.valueDict[data.instancePath][label] = this.getValueFromData(data); 
						dataset.valueDict[data.instancePath]["controller"] = parent.add(dataset.valueDict[data.instancePath], label).listen();
						//Add class to dom element depending on node metatype
						$(dataset.valueDict[data.instancePath]["controller"].__li).addClass(data._metaType.toLowerCase() + "tv");
						//Add instancepath as data attribute. This attribute will be used in the event framework
						$(dataset.valueDict[data.instancePath]["controller"].__li).data("instancepath", data.getInstancePath());
					}
					else{
						dataset.valueDict[data.instancePath][label] = this.getValueFromData(data);
					}
				}
				else{
					if (!dataset.isDisplayed) {
						parentFolder = parent.addFolder(label);
						//Add class to dom element depending on node metatype
						$(parentFolder.domElement).find("li").addClass(data._metaType.toLowerCase() + "tv");
						//Add instancepath as data attribute. This attribute will be used in the event framework
						$(parentFolder.domElement).find("li").data("instancepath", data.getInstancePath());
					}
					var children = data.getChildren().models;
					if (children.length > 0){
						var parentFolderTmp = parentFolder; 
						for (var childIndex in children){
							if (!dataset.isDisplayed || (dataset.isDisplayed && children[childIndex].name != "ModelTree")){
								this.prepareTree(parentFolderTmp, children[childIndex]);
							}
						}
						if (this.options.expandNodes){
							parentFolderTmp.open();
						}
					}
				}
			}	
		},
		
		/**
		 * Updates the data that the TreeVisualiserDAT is rendering
		 */
		updateData : function() {
			for ( var key in this.datasets) {
				dataset = this.datasets[key];
				if (dataset.variableToDisplay != null) {
					this.prepareTree(this.gui, dataset.data);
				}
			}
		}

	});
});