
/**
 * Tree Visualiser Widget
 *
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function (require) {

    var TreeVisualiserNode = require('./TreeVisualiserNode');
    var TreeVisualiserWrappedObject = require('./TreeVisualiserWrappedObject');

    return Backbone.Model.extend({
    		expandNodes : false,
    	
	    	initialize: function (options) {
	    		this.expandNodes = options.expandNodes;
	    		this.filterTypes = options.filterTypes;
	    	},

        	/**
             * Create formatted value for any kind of node
             */
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
            				formattedValue.push(Math.floor(node.getMinDensity() * 1000)/1000);
            			}
            			if (node.getMaxDensity() != undefined && node.getMinDensity() != node.getMaxDensity()){
            				formattedValue.push(Math.floor(node.getMaxDensity() * 1000)/1000);
            			}
            			break;
            		case GEPPETTO.Resources.DYNAMICS_TYPE:	
            			formattedValue = node.getInitialValues()[0].value.dynamics.expression.expression;
            			break;
//            		case GEPPETTO.Resources.FUNCTION_TYPE:
//            			formattedValue = "";
//            			break;
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
            		case GEPPETTO.Resources.IMPORT_TYPE:
                    	//AQP: Add sth! A button?
            			formattedValue = "> Type not yet resolved";
            			break;
            		default:
                    	throw "Unknown type";
            	}
            	return formattedValue;
            },
            
        	/**
             * Generate style depending on kind of node
             */
            getStyle: function(type){
            	var formattedValue = "";
            	switch (type) {
            		case GEPPETTO.Resources.PARAMETER_TYPE:
            			return "parametertypetv";
            		case GEPPETTO.Resources.STATE_VARIABLE_TYPE:
            			return "statevariabletypetv";
//            		case GEPPETTO.Resources.CONNECTION_TYPE:
//            			return null;
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
            
            /**
             * Create visualisation subtree (visual groups and visual elements) 
             */
            createVisualisationSubTree: function (compositeVisualType) {
            	var tagsNode = {};
            	var children = [];
            	if (compositeVisualType.getVisualGroups() != undefined){
	            	for (var i = 0; i < compositeVisualType.getVisualGroups().length; i++) {
	                    var visualGroup = compositeVisualType.getVisualGroups()[i];
	                    
	                    //Create Visual Group Elements for Visual Group
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
	                    
	                    //Create Visual Group and background colors if needed
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
	                    
	                    // Add to tags folder
	                    if (visualGroup.getTags().length >0){
		                    for (var j = 0; j < visualGroup.getTags().length; j++){
		                    	var tag = visualGroup.getTags()[j];
		                    	if (!(tag in tagsNode)){
		                    		var treeVisualiserWrappedObject = new TreeVisualiserWrappedObject({
		                                name: tag,
		                                id: tag,
		                                _metaType: "",
		                                path: visualGroup.getPath() + "." + tag
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
            	}	
            	return children;
            },
            
            /**
             * Create tree visualiser node 
             */
            createTreeVisualiserNode: function(options){
            	if (this.expandNodes) {
            		options["children"] = options._children;
            		options._children = [];
                }
            	return new TreeVisualiserNode(options);
            },

            /**
             * Generate tree visualiser node from geppetto node 
             */
            convertNodeToTreeVisualiserNode: function (node) {
            	
                if (node.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE && node.getType().getMetaType() != GEPPETTO.Resources.HTML_TYPE) {
                	if (node.getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE || node.getType().getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE){
                		if (node.getType().getSuperType() != undefined && !(node.getType().getSuperType() instanceof Array) && node.getType().getSuperType().getId() == 'projection') {
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

                            var treeVisualiserWrappedObject = new TreeVisualiserWrappedObject({name: "Number of Connections", id: "numberConnections", _metaType: "", path: node.getType().getPath() + ".numberConnections"});
                            projectionsChildrenNode.push(this.createTreeVisualiserNode({wrappedObj: treeVisualiserWrappedObject, formattedValue: numConnections, style:this.getStyle(GEPPETTO.Resources.TEXT_TYPE)}));

                            return this.createTreeVisualiserNode({wrappedObj: node.getType(), _children: projectionsChildrenNode, style:this.getStyle(node.getType().getMetaType())});
                        }
                        else {
                        	return this.createTreeVisualiserNode({wrappedObj: node, style:this.getStyle(node.getType().getMetaType()), _children: this.createTreeVisualiserNodeChildren(node.getType())});
                        }
                	}
                	else{
                		if(this.filterTypes == undefined || this.filterTypes.indexOf(node.getType().getMetaType()) == -1){
                			return this.createTreeVisualiserNode({wrappedObj: node, formattedValue: this.getFormattedValue(node, node.getType().getMetaType()), style:this.getStyle(node.getType().getMetaType())});
                		}
                		return null;
                	}
                }
                else if (node.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE || node.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                	var formattedValue = undefined;
                	var style = this.getStyle(node.getMetaType());
                	//AQP: Do we want to do sth with every single capability?
                	if (node.capabilities != undefined && node.capabilities.length > 0 ){
                		formattedValue = this.getFormattedValue(node, node.capabilities[0], 0);
                		style = this.getStyle(node.capabilities[0]);
                	}
                    return this.createTreeVisualiserNode({wrappedObj: node, formattedValue: formattedValue, style: style, _children: this.createTreeVisualiserNodeChildren(node)});
                }
                else if (node.getMetaType() != GEPPETTO.Resources.VARIABLE_NODE && node.getMetaType() != GEPPETTO.Resources.HTML_TYPE) {
                	return this.createTreeVisualiserNode({wrappedObj: node, _children: this.createTreeVisualiserNodeChildren(node), style: this.getStyle(node.getMetaType())});
                }
            },

            /**
             * Create tree visualiser nodes for geppetto node children 
             */
            createTreeVisualiserNodeChildren: function (state) {
                var children = [];
                if (state.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE || state.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE || state.getMetaType() == GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE) {
                	var numberCompartments = 0;
                	for (var i = 0; i < state.getChildren().length; i++) {
                        var child = state.getChildren()[i];
                        if (child.getType() != undefined && child.getType().getId() == 'compartment'){
                        	numberCompartments++;
                        }
                        else{
                        	var node = this.convertNodeToTreeVisualiserNode(child);
                            if (node != undefined)
                                children.push(node);
                        }
                        
                    }
                    if (numberCompartments > 0){
                    	var treeVisualiserWrappedObject = new TreeVisualiserWrappedObject({"name": "Number of Compartments", "id": "numberCompartments", "_metaType": "", "path": state.getPath() + ".numberCompartments"});
                        children.push(this.createTreeVisualiserNode({wrappedObj: treeVisualiserWrappedObject, formattedValue: numberCompartments, style: this.getStyle(GEPPETTO.Resources.TEXT_TYPE)}));
                    }
                    
                    if (state.getVisualType() != null){
                    	children.push(this.createTreeVisualiserNode({wrappedObj: state.getVisualType(), _children: this.createTreeVisualiserNodeChildren(state.getVisualType())}))
                    }
                }
                else if (state.getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE){
                	children = this.createVisualisationSubTree(state);
                }
                else if (state.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                	for (var i = 0; i < state.getChildren().length; i++) {
                		var child = state.getChildren()[i];
                		children.push(this.createTreeVisualiserNode({wrappedObj: child, formattedValue: "", style: "", _children: this.createTreeVisualiserNodeChildren(child)}));
                    }
                }
                else if (state.getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                    // Size
                    var treeVisualiserWrappedObject = new TreeVisualiserWrappedObject({"name": "Size", "id": "size", "_metaType": "", "path": state.getPath() + ".size"});
                    children.push(this.createTreeVisualiserNode({wrappedObj: treeVisualiserWrappedObject, formattedValue: state.getSize(), style: this.getStyle(GEPPETTO.Resources.TEXT_TYPE)}));

                    //Extracting Cell
                    children.push(this.createTreeVisualiserNode({wrappedObj: state.getType(), style: this.getStyle(state.getType().getMetaType()), _children: this.createTreeVisualiserNodeChildren(state.getType())}));
                }
                else if (state.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE) {
				    var node = this.convertNodeToTreeVisualiserNode(state);
				    if (node != undefined)
				        children.push(node);
                }
                
                return children;
            }
    });

});
