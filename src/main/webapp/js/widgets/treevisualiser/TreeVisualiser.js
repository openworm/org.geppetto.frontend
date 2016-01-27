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
define(function (require) {

    var Widget = require('widgets/Widget');
    var Node = require('model/Node');
    var TreeVisualiserNode = require('widgets/treevisualiser/TreeVisualiserNode');
    var TreeVisualiserWrappedObject = require('widgets/treevisualiser/TreeVisualiserWrappedObject');

    return {
        TreeVisualiser: Widget.View.extend({

            datasets: [],

            initialize: function (options) {
                Widget.View.prototype.initialize.call(this, options);

                this.dataset = {data: [], isDisplayed: false, valueDict: {}};
                this.visible = options.visible;
                this.render();
                this.setSize(options.width, options.height);
            },

            setData: function (state, options, dataset) {
                // If no options specify by user, use default options
                if (options != null) {
                    $.extend(this.options, options);
                }

                if (state != null) {
                    return this.createDataset(state);
                }
                return null;
            },

            getDatasets: function () {
                return this.datasets;
            },

            createDataset: function (state) {
            	return this.convertNodeToTreeVisualiserNode(state);
            },

            getFormattedValue: function(node, type, step){
            	var formattedValue = "";
            	switch (type) {
            		case GEPPETTO.Resources.PARAMETER_TYPE:
            		case GEPPETTO.Resources.STATE_VARIABLE_TYPE:
            			formattedValue = node.getInitialValues()[0].value.value + " " + node.getInitialValues()[0].value.unit.unit;
            			break;
            		case GEPPETTO.Resources.VISUAL_GROUP_ELEMENT_NODE:
            			formattedValue = (node.getValue()!=null)?(node.getValue() + " " + node.getUnit()):"";
            			break;
            		case GEPPETTO.Resources.VISUAL_GROUP_NODE:
            			formattedValue = [];
            			if (node.getMinDensity() != undefined){
            				//AQP: Is this the best way
            				formattedValue.push(Math.floor(node.getMinDensity() * 1000)/1000);
            			}
            			if (node.getMaxDensity() != undefined && node.getMinDensity() != node.getMaxDensity()){
            				formattedValue.push(Math.floor(node.getMaxDensity() * 1000)/1000);
            			}
            			break;
            		case GEPPETTO.Resources.CONNECTION_TYPE:
                        //AQP: This is probably not needed as we are not going to show the connections
            			formattedValue = 'Connection';
            			break;
            		case GEPPETTO.Resources.DYNAMICS_TYPE:	
            			formattedValue = node.getInitialValues()[0].value.dynamics.expression.expression;
            			break;
            		case GEPPETTO.Resources.FUNCTION_TYPE:
            			console.log('function');
                    	//AQP: Review this case!
            			formattedValue = "";
            			break;
            		case GEPPETTO.Resources.TEXT_TYPE:	
            			formattedValue = node.getInitialValues()[0].value.text;
            			break;
            		case GEPPETTO.Resources.POINTER_TYPE:
                    	//AQP: Add sth! A button?
            			formattedValue = "> " + node.getInitialValues()[0].getElements()[0].getType().getName();
            			break;
            		case GEPPETTO.Resources.STATE_VARIABLE_CAPABILITY:
                        if(node.getTimeSeries() != null && node.getTimeSeries().length>0)
                			formattedValue = node.getTimeSeries()[step] + " " + ((node.getUnit()!=null && node.getUnit()!="null")?(" " + node.getUnit()):"");
                        break;
            		case GEPPETTO.Resources.VISUAL_CAPABILITY:
            			formattedValue = "";
            			break;
            		case GEPPETTO.Resources.PARAMETER_CAPABILITY:
            			formattedValue = "";
            			break;
            		case GEPPETTO.Resources.CONNECTION_CAPABILITY:
            			formattedValue = "";
            			break;
            		default:
                    	throw "Unknown type";
            	}
            	return formattedValue;
            },
            
            getStyle: function(type){
            	var formattedValue = "";
            	switch (type) {
            		case GEPPETTO.Resources.PARAMETER_TYPE:
            			return "parametertypetv";
            		case GEPPETTO.Resources.STATE_VARIABLE_TYPE:
            			return "statevariabletypetv";
            		case GEPPETTO.Resources.CONNECTION_TYPE:
            			//AQP: Probably it is not needed
            			return null;
            		case GEPPETTO.Resources.DYNAMICS_TYPE:
            			return "dynamicstypetv";
            		case GEPPETTO.Resources.FUNCTION_TYPE:
            			return "functiontypetv";
            		case GEPPETTO.Resources.TEXT_TYPE:
            			return "texttypetv";
            		case GEPPETTO.Resources.POINTER_TYPE:
            			return "pointertypetv";
            		case GEPPETTO.Resources.STATE_VARIABLE_CAPABILITY:
            			return "stateinstancetv";
            		case GEPPETTO.Resources.VISUAL_CAPABILITY:
            			//AQP: currently no css for this
            			return "visualinstancetv";
            		case GEPPETTO.Resources.PARAMETER_CAPABILITY:
            			//AQP: currently no css for this
            			return "parameterinstancetv";
            		case GEPPETTO.Resources.CONNECTION_CAPABILITY:
            			//AQP: currently no css for this
            			return "connectioninstancetv";
            		case GEPPETTO.Resources.COMPOSITE_TYPE_NODE:
            			return "foldertv";
            		case GEPPETTO.Resources.ARRAY_INSTANCE_NODE:
            			return "arrayinstancetv";
            		case GEPPETTO.Resources.INSTANCE_NODE:	
            			return "instancefoldertv";
            		case GEPPETTO.Resources.ARRAY_TYPE_NODE:
            			return "arraytypetv";
            		case GEPPETTO.Resources.VISUAL_GROUP_ELEMENT_NODE:
            			return "visualgroupelementtv";

            	}
            	return null;
            },
            
            createVisualisationSubTree: function (compositeVisualType) {
            	var tagsNode = {};
            	var children = [];
            	for (var i = 0; i < compositeVisualType.getVisualGroups().length; i++) {
                    var visualGroup = compositeVisualType.getVisualGroups()[i];
                    
                    var nodeChildren = [];
                    for (var j=0; j < visualGroup.getVisualGroupElements().length; j++){
                    	var visualGroupElement = visualGroup.getVisualGroupElements()[j];
                    	
                    	var nodeChild = this.createTreeVisualiserNode({wrappedObj: visualGroupElement, formattedValue: this.getFormattedValue(visualGroupElement, visualGroupElement.getMetaType()),
                    		style:this.getStyle(visualGroupElement.getMetaType())});
                    	
                    	if (visualGroupElement.getColor() != undefined){
                    		nodeChild.set({"backgroundColors":[visualGroupElement.getColor()]});
                    	}
                    	
                    	nodeChildren.push(nodeChild);
                    }
                    
                    var node = this.createTreeVisualiserNode({wrappedObj: visualGroup, _children: nodeChildren, style:this.getStyle(visualGroup.getMetaType()), formattedValue: this.getFormattedValue(visualGroup, visualGroup.getMetaType())});
                    var backgroundColors = [];
                	if (visualGroup.getLowSpectrumColor() != undefined){
                		backgroundColors.push(visualGroup.getLowSpectrumColor());
                	}
                    if (visualGroup.getHighSpectrumColor() != undefined && visualGroup.getMaxDensity() != undefined && visualGroup.getMinDensity() != visualGroup.getMaxDensity()){
                		backgroundColors.push(visualGroup.getHighSpectrumColor());
                	}
                    if (backgroundColors.length > 0){
                    	node.set({"backgroundColors":backgroundColors});
                    }
                    
                    if (visualGroup.getTags().length >0){
	                    for (var j = 0; j < visualGroup.getTags().length; j++){
	                    	var tag = visualGroup.getTags()[j];
	                    	if (!(tag in tagsNode)){
	                    		var treeVisualiserWrappedObject = new TreeVisualiserWrappedObject({
	                                name: tag,
	                                id: tag,
	                                _metaType: ""
	                            });
	                    		//AQP: style?
	                    		tagsNode[tag] = this.createTreeVisualiserNode({wrappedObj: treeVisualiserWrappedObject, _children: []});
	                    		children.push(tagsNode[tag]);
	                    	}
	                    	tagsNode[tag].getHiddenChildren().push(node);
	                    }
                    }
                    else{
                    	children.push(node);
                    }
                    
                }
            	return children;
            },
            
            createTreeVisualiserNode: function(options){
            	if (this.options.expandNodes) {
            		options["children"] = options._children;
            		options._children = [];
                }
            	return new TreeVisualiserNode(options);
            },
            
            convertNodeToTreeVisualiserNode: function (node) {
            	
                if (node.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE && node.getType().getMetaType() != GEPPETTO.Resources.HTML_TYPE) {
                	if (node.getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE || node.getType().getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE){
                		if (node.getType().getSuperType() != undefined && node.getType().getSuperType().getId() == 'projection') {
                            var projectionChildren = node.getType().getChildren();
                            var numConnections = 0;
                            var projectionsChildrenNode = [];
                            for (var j = 0; j < projectionChildren.length; j++) {
                                if (projectionChildren[j].getTypes()[0].getSuperType() != undefined && projectionChildren[j].getTypes()[0].getSuperType().getId() == 'connection') {
                                    numConnections++;
                                }
                                else {
                                    projectionsChildrenNode.push(this.convertNodeToTreeVisualiserNode(projectionChildren[j]));
                                }
                            }

                            var treeVisualiserWrappedObject = new TreeVisualiserWrappedObject({name: "Number of Connections", id: "numberConnections", _metaType: ""});
                            projectionsChildrenNode.push(this.createTreeVisualiserNode({wrappedObj: treeVisualiserWrappedObject, formattedValue: numConnections, style:this.getStyle(GEPPETTO.Resources.TEXT_TYPE)}));

                            return this.createTreeVisualiserNode({wrappedObj: node.getType(), _children: projectionsChildrenNode, style:this.getStyle(node.getType().getMetaType())});
                        }
                        else {
                        	return this.createTreeVisualiserNode({wrappedObj: node.getType(), style:this.getStyle(node.getType().getMetaType()), _children: this.createTreeVisualiserNodeChildren(node.getType())});
                        }
                	}
                	else{
                		return this.createTreeVisualiserNode({wrappedObj: node, formattedValue: this.getFormattedValue(node, node.getType().getMetaType()), style:this.getStyle(node.getType().getMetaType())});
                	}
                }
                else if (node.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE || node.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                	var formattedValue = undefined;
                	var style = this.getStyle(node.getMetaType());
                	//AQP: Do we want to do sth with every single capability?
                	if (node.get("capabilities") != undefined && node.get("capabilities").length > 0 ){
                		formattedValue = this.getFormattedValue(node, node.get("capabilities")[0], 0);
                		style = this.getStyle(node.get("capabilities")[0]);
                	}
                    return this.createTreeVisualiserNode({wrappedObj: node, formattedValue: formattedValue, style: style, _children: this.createTreeVisualiserNodeChildren(node)});
                }
                else if (node.getMetaType() != GEPPETTO.Resources.VARIABLE_NODE && node.getMetaType() != GEPPETTO.Resources.HTML_TYPE) {
                	return this.createTreeVisualiserNode({wrappedObj: node, _children: this.createTreeVisualiserNodeChildren(node), style: this.getStyle(node.getMetaType())});
                }
            },

            createTreeVisualiserNodeChildren: function (state) {
                var children = [];
                if (state.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE || state.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE
                		|| state.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                    for (var i = 0; i < state.getChildren().length; i++) {
                        var child = state.getChildren()[i];
                        var node = this.convertNodeToTreeVisualiserNode(child);
                        if (node != undefined)
                            children.push(node);
                    }
                }
                else if (state.getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE){
                	children = this.createVisualisationSubTree(state);
                }
                else if (state.getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {

                    // Size
                    var treeVisualiserWrappedObject = new TreeVisualiserWrappedObject({
                        "name": "Size",
                        "id": "size",
                        "_metaType": ""
                    });
                    children.push(this.createTreeVisualiserNode({wrappedObj: treeVisualiserWrappedObject, formattedValue: state.getSize(), style: this.getStyle(GEPPETTO.Resources.TEXT_TYPE)}));

                    // Array Type: Cell
                    var cellNode = this.createTreeVisualiserNode({wrappedObj: state.getType(), style: this.getStyle(state.getType().getMetaType())});
                    var cellNodeChildren = this.createTreeVisualiserNodeChildren(state.getType());
                    
                    var cellVisualTypes = this.createTreeVisualiserNode({wrappedObj: state.getType().getVisualType(), _children: this.createTreeVisualiserNodeChildren(state.getType().getVisualType())});
                    
                    cellNodeChildren.push(cellVisualTypes);
                    
                    
                    
                    cellNode.set({"_children": cellNodeChildren});
                    
                    children.push(cellNode);

                    
                    
                    //state.getDefaultValue()

                }
                else if (state.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE) {
				    var node = this.convertNodeToTreeVisualiserNode(state);
				    if (node != undefined)
				        children.push(node);
                }
                
                return children;
            }
        })
    };

});