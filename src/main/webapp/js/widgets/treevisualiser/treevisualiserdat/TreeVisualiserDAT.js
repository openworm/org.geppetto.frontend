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

define(function (require) {

    var TreeVisualiser = require('widgets/treevisualiser/TreeVisualiser');
    var $ = require('jquery');

    return TreeVisualiser.TreeVisualiser.extend({

        defaultTreeVisualiserOptions: {
            width: "auto",
            autoPlace: false,
            expandNodes: false
        },

        /**
         * Initializes the TreeVisualiserDAT given a set of options
         *
         * @param {Object} options - Object with options for the TreeVisualiserDAT widget
         */
        initialize: function (options) {
            TreeVisualiser.TreeVisualiser.prototype.initialize.call(this, options);

            this.options = this.defaultTreeVisualiserOptions;

            //This function allows to access a node by its data attribute (this function is required is the data property has been added by jquery)
            $.fn.filterByData = function (prop, val) {
                return this.filter(
                    function () {
                        return $(this).data(prop) == val;
                    }
                );
            };

            this.initDATGUI();
        },

        /**
         * Action events associated with this widget
         */
        events: {
            'contextmenu .title': 'manageRightClickEvent',
            'contextmenu .cr.string': 'manageRightClickEvent',
            'click': 'manageClickEvent',
            'click': 'manageClickEvent'
            	
        },

        /**
         * Register right click event with widget
         *
         * @param {WIDGET_EVENT_TYPE} event - Handles right click event on widget
         */
        manageClickEvent: function (event) {
        	var nodeInstancePath = $(event.target).data("instancepath");
            if (nodeInstancePath == undefined) {
                nodeInstancePath = $(event.target).parents('.cr.string').data("instancepath");
            }
            if (nodeInstancePath != null || undefined) {
                //Read node from instancepath data property attached to dom element
                this.dataset.isDisplayed = false;
                var node = this.dataset.valueDict[nodeInstancePath]["model"];
                if (node.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE && node.getWrappedObj().getType().getMetaType() == GEPPETTO.Resources.POINTER_TYPE){
                	GEPPETTO.Console.executeCommand("G.addWidget(Widgets.TREEVISUALISERDAT).setData(Model.neuroml." + node.getWrappedObj().getInitialValues()[0].getElements()[0].getType().getId() + ")");
                }
                else if (node.getChildren().length == 0 && node.getHiddenChildren().length > 0){
	                node.set({"children": node.getHiddenChildren()});
	                for (var childIndex in node.getChildren()){
	                	this.prepareTree(this.dataset.valueDict[nodeInstancePath]["folder"], node.getChildren()[childIndex], 0);
	                }
	                this.dataset.isDisplayed = true;
                }
            }
        },
        
        /**
         * Register right click event with widget
         *
         * @param {WIDGET_EVENT_TYPE} event - Handles right click event on widget
         */
        manageRightClickEvent: function (event) {
            var nodeInstancePath = $(event.target).data("instancepath");
            if (nodeInstancePath == undefined) {
                nodeInstancePath = $(event.target).parents('.cr.string').data("instancepath");
            }
            if (nodeInstancePath != null || undefined) {
                //Read node from instancepath data property attached to dom element
                this.showContextMenu(event, eval(nodeInstancePath));
            }
        },

        /**
         * Sets the data used inside the TreeVisualiserDAT for rendering.
         *
         * @param {Array} state - Array of variables used to display inside TreeVisualiserDAT
         * @param {Object} options - Set of options passed to widget to customize it
         */
        setData: function (state, options) {
            labelsInTV = [];

            if (state instanceof Array) {
                var that = this;
                $.each(state, function (d) {
                    that.setData(state[d], options)
                });
            }
            
            var currentDataset = TreeVisualiser.TreeVisualiser.prototype.setData.call(this, state, options);
            this.dataset.data.push(currentDataset);
            this.dataset.isDisplayed = false;
            this.prepareTree(this.gui, currentDataset, 0);
            this.dataset.isDisplayed = true;
            
            //Disable input elements
            $(this.dialog).find("input").prop('disabled', true);
            $(this.dialog).find(".parameterspecificationnodetv input").prop('disabled', false);

            //Change input text to textarea
            var testingSizeElement = $('<div></div>').css({
                'position': 'absolute',
                'float': 'left',
                'white-space': 'nowrap',
                'visibility': 'hidden'
            }).appendTo($('body'));
            $(this.dialog).find('.textmetadatanodetv').find('div > div > input[type="text"]').each(function () {
                testingSizeElement.text($(this).val());
                if (testingSizeElement.width() > $(this).width()) {
                    $(this).closest('.textmetadatanodetv').addClass('textarea');
                    var textarea = $(document.createElement('textarea')).attr('readonly', true).attr('rows', 2);
                    textarea.val($(this).val());
                    $(this).replaceWith(textarea);
                }
            });

            //return "Metadata or variables to display added to tree visualiser";
            return this;
        },

        /**
         * Prepares the tree for painting it on the widget
         *
         * @param {Object} parent - Parent tree to paint
         * @param {Array} data - Data to paint
         */
        prepareTree: function (parent, data, step) {

        	
            if ('labelName' in this.options) {
                // We need to verify if this is working
                label = data.getWrappedObj().get(this.options.labelName);
            } else {
                label = data.getName();
            }
            
            while (true) {
                if (labelsInTV.indexOf(label) >= 0) {
                    label = label + " ";
                }
                else {
                    labelsInTV.push(label);
                    break;
                }
            }


            if (!this.dataset.isDisplayed) {


                //AQP: Better ask for the children or for compositetype?
                var children = data.getChildren();
                var _children = data.getHiddenChildren();
                if (children.length > 0 || _children.length > 0) {
                	this.dataset.valueDict[data.getId()] = new function () {};
                	this.dataset.valueDict[data.getId()]["folder"] = parent.addFolder(label);
                	
                	
                    //parentFolder = parent.addFolder(label);
                    //Add class to dom element depending on node metatype
                    $(this.dataset.valueDict[data.getId()]["folder"].domElement).find("li").addClass(data.getStyle());
                    //Add instancepath as data attribute. This attribute will be used in the event framework
                    $(this.dataset.valueDict[data.getId()]["folder"].domElement).find("li").data("instancepath", data.getId());


                    var parentFolderTmp = this.dataset.valueDict[data.getId()]["folder"];
                    for (var childIndex in children) {
                        if (!this.dataset.isDisplayed || (this.dataset.isDisplayed && children[childIndex].name != "ModelTree")) {
                            this.prepareTree(parentFolderTmp, children[childIndex], step);
                        }
                    }
                    if (this.options.expandNodes) {
                        parentFolderTmp.open();
                    }
                }
                else {
                	this.dataset.valueDict[data.getId()] = new function () {};
                	this.dataset.valueDict[data.getId()][label] = data.getValue();
                	this.dataset.valueDict[data.getId()]["controller"] = parent.add(this.dataset.valueDict[data.getId()], label).listen();

                    //Add class to dom element depending on node metatype
                    $(this.dataset.valueDict[data.getId()]["controller"].__li).addClass(data.getStyle());
                    //Add instancepath as data attribute. This attribute will be used in the event framework
                    $(this.dataset.valueDict[data.getId()]["controller"].__li).data("instancepath", data.getId());
                    
                    // Execute set value if it is a parameter specification
                    if(data.getMetaType() == GEPPETTO.Resources.PARAMETER_TYPE)
					{
						$(dataset.valueDict[data.getId()]["controller"].__li).find('div > div > input[type="text"]').change(function(){
							GEPPETTO.Console.executeCommand(data.getId() + ".setValue(" + $(this).val().split(" ")[0] + ")");
						});
					}
                }
                this.dataset.valueDict[data.getId()]["model"] = data;
            }
            else {
                var set = this.dataset.valueDict[data.getId()]["controller"].__gui;
                if (!set.__ul.closed) {
                	this.dataset.valueDict[data.getId()][label] = data.getValue();
                }
            }


//				if (data._metaType == "VariableNode"  | data._metaType == "DynamicsSpecificationNode" | data._metaType == "ParameterSpecificationNode" |
//						data._metaType == "TextMetadataNode" | data._metaType == "FunctionNode" | data._metaType == "HTMLMetadataNode" |
//						data._metaType == "VisualObjectReferenceNode" | data._metaType == "VisualGroupElementNode") {
//					if (!dataset.isDisplayed) {
//						dataset.valueDict[data.instancePath] = new function(){};
//						dataset.valueDict[data.instancePath][label] = this.getValueFromData(data,step);
//						dataset.valueDict[data.instancePath]["controller"] = parent.add(dataset.valueDict[data.instancePath], label).listen();
//						
//						if(data._metaType=="ParameterSpecificationNode")
//						{
//							$(dataset.valueDict[data.instancePath]["controller"].__li).find('div > div > input[type="text"]').change(function(){
//								GEPPETTO.Console.executeCommand(data.instancePath+".setValue(" + $(this).val().split(" ")[0] + ")");
//							});
//						}
//						
//						//Add class to dom element depending on node metatype
//						$(dataset.valueDict[data.instancePath]["controller"].__li).addClass(data._metaType.toLowerCase() + "tv");
//						//Add instancepath as data attribute. This attribute will be used in the event framework
//						$(dataset.valueDict[data.instancePath]["controller"].__li).data("instancepath", data.getInstancePath());
//						
//						//if no values are presentn for a group element,display theh color
//						if (data._metaType == "VisualGroupElementNode" 
//							&& dataset.valueDict[data.instancePath][label] == "null ") {
//							//set label to empty
//							dataset.valueDict[data.instancePath][label] = "";
//							
//							$(dataset.valueDict[data.instancePath]["controller"].__li).addClass(label);
//
//							//apply color to label by getting unique class and using jquery
//							var color = data.getColor().replace("0X","#");
//							$(this.dialog).find("."+label + " .c").css({"background-color": color, "width": "60%", "height": "95%"});
//						}	
//					}
//					else{
//						var set = dataset.valueDict[data.instancePath]["controller"].__gui;
//						if(!set.__ul.closed){
//							dataset.valueDict[data.instancePath][label] = this.getValueFromData(data,step);
//						}
//					}
//				}
//				else{
//					if (!dataset.isDisplayed) {
//						parentFolder = parent.addFolder(label);
//						//Add class to dom element depending on node metatype
//						$(parentFolder.domElement).find("li").addClass(data._metaType.toLowerCase() + "tv");
//						//Add instancepath as data attribute. This attribute will be used in the event framework
//						$(parentFolder.domElement).find("li").data("instancepath", data.getInstancePath());
//						
//						//if no values are presentn for a group element,display theh color
//						if (data._metaType == "VisualGroupNode") {
//							
//							$(parentFolder.domElement).find("li").addClass(label);
//							
//							$(this.dialog).find("."+label).append($('<a>').attr('class',label+"-mean"));
//							$(this.dialog).find("."+label).css("width", "100%");
//							$(this.dialog).find("."+label+"-mean").css({"float": "right", "width": "60%", "height": "90%", "color": "black"});
//
//							if (data.getMinDensity() != null){
//
//								if(data.getMinDensity() != data.getMaxDensity()){
//	
//									var lowHexColor = rgbToHex(255, Math.floor(255), 0);
//									var highHexColor = rgbToHex(255, Math.floor(255 - (255)), 0);
//									var lowcolor = lowHexColor.replace("0X","#");
//									var highcolor = highHexColor.replace("0X","#");
//
//									$(this.dialog).find("."+label+"-mean").append($('<span>').attr('class', label+"-low").append(data.getMinDensity()));
//									$(this.dialog).find("."+label+"-mean").append($('<span>').attr('class', label+"-high").append(data.getMaxDensity()));
//
//									$(this.dialog).find("."+label+"-low").css({"width": "50%", "height": "90%", "text-align": "center", "float": "left", "background-color": lowcolor});
//									$(this.dialog).find("."+label+"-high").css({"width": "50%", "height": "90%", "text-align": "center", "float": "right", "background-color": highcolor});
//									
//								} else {
//									var hex = rgbToHex(255, Math.floor(255 - (255)), 0);
//									var color = hex.replace("0X","#");
//	
//									$(this.dialog).find("."+label+"-mean").append($('<span>').attr('class', label+"-text").append(data.getMinDensity()));
//									$(this.dialog).find("."+label+"-mean").css({"text-align": "center", "background-color": color});
//									$(this.dialog).find("."+label+"-text").css({"width": "60%", "background-color": color});
//								}
//							}	
//						}
//					}
//					var children = data.getChildren();
//					if (children.length > 0){
//						var parentFolderTmp = parentFolder;
//							for (var childIndex in children){
//								if (!dataset.isDisplayed || (dataset.isDisplayed && children[childIndex].name != "ModelTree")){
//									this.prepareTree(parentFolderTmp, children[childIndex],step);
//								}
//							}
//						if (this.options.expandNodes){
//							parentFolderTmp.open();
//						}
//					}
//				}
            //}
        },

        /**
         * Updates the data that the TreeVisualiserDAT is rendering
         */
        updateData: function (step) {
        	for (var i = 0; i < this.dataset.data.length; i++){
        		this.prepareTree(this.gui, this.dataset.data[i], step);
        	}
        },

        /**
         * Expands or collapses node folder (and all the parent folder until the root node) in the widgets
         *
         * @param {Node} node - Geppetto Node which identifies the folder to be expanded/collapsed.
         * @param {Boolean} expandEndNode - If true only final node is expanded/collapsed. Otherwise the whole path is expanded/collapsed
         */
        toggleFolder: function (node, expandEndNode) {
            var instancePath = node.getInstancePath();
            if (expandEndNode) {
                this.getFolderByInstancePath(instancePath).trigger('click');
            }
            else {
                var nodePathElements = instancePath.split(".");
                var parentComponent = "";
                for (var nodePathElementsIndex in nodePathElements) {
                    this.getFolderByInstancePath(parentComponent + nodePathElements[nodePathElementsIndex]).trigger('click');
                    parentComponent += nodePathElements[nodePathElementsIndex] + ".";
                }
            }
        },

        /**
         * Returns li element which corresponds to the instance path
         *
         * @param {String} instancePath - Node instance path
         */
        getFolderByInstancePath: function (instancePath) {
            return $(this.dialog).find('li').filterByData('instancepath', instancePath);
        },

        /**
         * Clear Widget
         */
        reset: function () {
        	this.dataset = {data: [], isDisplayed: false, valueDict: {}};
            $(this.dialog).children().remove();
            this.initDATGUI();
        },

        /**
         * Refresh data in tree visualiser
         */
        refresh: function () {
            var currentDatasets = this.dataset;
            this.reset();
            for (var i = 0; i < currentDatasets.length; i++){
        		this.prepareTree(this.gui, currentDatasets.data[i], step);
        	}
        },

        initDATGUI: function () {
            this.gui = new dat.GUI({
                width: this.options.width,
                autoPlace: this.options.autoPlace
            });

            this.dialog.append(this.gui.domElement);
        }


    });
});