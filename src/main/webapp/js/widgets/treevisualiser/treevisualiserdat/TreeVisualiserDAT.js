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
			width : "auto",
			autoPlace : false
		},

		initialize : function(options) {
			TreeVisualiser.TreeVisualiser.prototype.initialize.call(this, options);

			this.options = this.defaultTreeVisualiserOptions;

			this.gui = new dat.GUI({
				width : this.options.width,
				autoPlace : this.options.autoPlace
			});

			this.dialog.append(this.gui.domElement);
		},
		
		events : {
			'contextmenu .title' : 'manageRightClickEvent'
		},

		manageRightClickEvent : function(event) {
			var ascendantsElements = $(event.target).parentsUntil("#" + this.id,".folder").get().reverse();
			var nodeString = "";
			for (var ascendantsElementKey in ascendantsElements){
				var label = $(ascendantsElements[ascendantsElementKey]).find(".title").first().html();
				nodeString += label + ".";
			}
			nodeString = nodeString.substring(0,nodeString.length-1);

			var node = eval(nodeString);
			this.showContextMenu(event, node);
		},

		setData : function(state, options) {
			dataset = TreeVisualiser.TreeVisualiser.prototype.setData.call(this, state, options);
			dataset.valueDict = {};
			
			this.prepareTree(this.gui, dataset.data);

			dataset.isDisplayed = true;
			this.datasets.push(dataset);

			return "Metadata or variables to display added to tree visualiser";
		},

		prepareTree : function(parent, data) {
			
			//TODO: Remove once all getName are implemented in all nodes
			if (data.getName() === undefined){label = data.getId();}
			else{label = data.getName();}
			
			if (data._metaType == "VariableNode"  | data._metaType == "DynamicsSpecificationNode" | data._metaType == "ParameterSpecificationNode") {
				if (!dataset.isDisplayed) {
					dataset.valueDict[data.instancePath] = {};
					dataset.valueDict[data.instancePath][label] = data.getValue() + " " + ((data.getUnit()!=null && data.getUnit()!="null")?(" " + data.getUnit()):"");
					dataset.valueDict[data.instancePath]["controller"] = parent.add(dataset.valueDict[data.instancePath], data.getName()).listen();
				}
				else{
					dataset.valueDict[data.instancePath][label] = data.getValue() + " " + ((data.getUnit()!=null && data.getUnit()!="null")?(" " + data.getUnit()):"");
				}
			}
			else{
				if (!dataset.isDisplayed) {
					parentFolder = parent.addFolder(label);
				}
				//TODO: Remove when entitynode and aspectnode getChildren works as getchildren in other nodes					
				var children = [];
				if (data._metaType != "EntityNode" & data._metaType != "AspectNode"){
					children = data.getChildren().models;
				}
				else{
					children = data.getChildren();
				}
				if (children.length > 0){
					var parentFolderTmp = parentFolder; 
					for (var childIndex in children){
						this.prepareTree(parentFolderTmp, children[childIndex]);
					}
				}
			}
		},
		
		updateData : function() {
			for ( var key in this.datasets) {
				dataset = this.datasets[key];
				if (dataset.variableToDisplay != null) {
					this.prepareTree(this.gui, dataset.data);
				}
			}
		},


	});
});