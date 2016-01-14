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

	var Widget = require('widgets/Widget');
	var Node = require('model/Node');
	var TreeVisualiserNode = require('widgets/treevisualiser/TreeVisualiserNode');
	var TreeVisualiserWrappedObject = require('widgets/treevisualiser/TreeVisualiserWrappedObject');

	return {
		TreeVisualiser: Widget.View.extend({
		
			datasets: [],
			
			initialize : function(options){
				Widget.View.prototype.initialize.call(this,options);
				
				this.datasets = [];
				this.visible = options.visible;
				this.render();
				this.setSize(options.width,options.height);
			},
			
			setData : function(state, options, dataset){
				// If no options specify by user, use default options
				if(options != null) {
					$.extend(this.options, options);
				}
	
				if (state!= null) {	
					return this.createDataset(state);
				}
				return null;
			},
			
			getDatasets: function(){
				return this.datasets;
			},
			
			createDataset: function(state){
				var stateTreeVisualiserNode = this.createTreeVisualiserNode(state);
				return {data:stateTreeVisualiserNode, isDisplayed:false};
			},
			
			createTreeVisualiserNode: function(state){
				var tvOptions = {wrappedObj : state};
				var tvn = new TreeVisualiserNode(tvOptions);
				tvn.set({ "children" : this.createTreeVisualiserNodeChildren(state)});
				return tvn;
			},
			
			createTreeVisualiserNodeChildren: function(state){
				var children = [];
				if (state.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE){
					for (var i=0; i<state.getChildren().length; i++){
						var child = state.getChildren()[i];
						if (typeof child.getTypes != "undefined" && child.getTypes().length == 1){
							if (child.getTypes()[0].getMetaType() == GEPPETTO.Resources.PARAMETER_TYPE ||
									child.getTypes()[0].getMetaType() == GEPPETTO.Resources.STATE_VARIABLE_TYPE ||
									child.getTypes()[0].getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE ||
									child.getTypes()[0].getMetaType() == GEPPETTO.Resources.DYNAMICS_TYPE ||
									child.getTypes()[0].getMetaType() == GEPPETTO.Resources.FUNCTION_TYPE ||
									child.getTypes()[0].getMetaType() == GEPPETTO.Resources.TEXT_TYPE ||
									child.getTypes()[0].getMetaType() == GEPPETTO.Resources.HTML_TYPE){
								children.push(this.createTreeVisualiserNode(child));
							}
							else{
								children.push(this.createTreeVisualiserNode(child.getTypes()[0]));
								
							}

						}
						if (typeof child.getAnonymousTypes != "undefined" && child.getAnonymousTypes().length == 1){
							children.push(this.createTreeVisualiserNode(child.getAnonymousTypes()[0]));	
						}
					}
				}
				else if (state.getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE){
					var treeVisualiserWrappedObject = new TreeVisualiserWrappedObject({"name": "size", "id": "size", "_metaType": "", "value": state.getSize()});
					var tvOptions = {wrappedObj : treeVisualiserWrappedObject};
					var tvn = new TreeVisualiserNode(tvOptions);
					children.push(tvn);
					children.push(this.createTreeVisualiserNode(state.getType()));
					
					//state.getDefaultValue()
					
				}	
				else if (state.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE){
					
				}
				return children;
				
			}
			
//			getValueFromData : function(data,step){
//				var labelValue = "";
//				if (data._metaType == "TextMetadataNode" || data._metaType == "HTMLMetadataNode"){
//					labelValue = data.getValue();
//				}
//				else if (data._metaType == "FunctionNode") {
//					labelValue = data.getExpression();
//				}
//				else if (data._metaType == "VisualObjectReferenceNode") {
//					labelValue = data.getAspectInstancePath() + " -> " + data.getVisualObjectID();
//				}
//				else if (data._metaType == "VariableNode") {
//					//we get the first value from the time series, could be more in time series array
//					if(data.getTimeSeries() != null && data.getTimeSeries().length>0){
//						labelValue = data.getTimeSeries()[step].getValue() + " " + ((data.getUnit()!=null && data.getUnit()!="null")?(" " + data.getUnit()):"");
//					}else{
//						labelValue = "";
//					}
//				}
//				else{
//					labelValue = data.getValue() + " " + ((data.getUnit()!=null && data.getUnit()!="null")?(" " + data.getUnit()):"");
//				}
//				return labelValue;
//			}
			
			
	
		})	
	};	
	
});