
/**
 * Tree Visualiser Widget
 *
 * @module Widgets/TreeVisualizerDAT
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */

define(function (require) {

    var TreeVisualiser = require('../TreeVisualiser');
    require("./TreeVisualiserDAT.less");
    var dat = require("./vendor/dat.gui.min");
    var $ = require('jquery');

    // Icons to display on hover
    var aIcons = $("<a id='tvIcons'><icon class='fa fa-sign-in'/></a>");
    // div to verify if textfield should be change to textarea
    var testingSizeElement = $('<div></div>').css({'position': 'absolute','float': 'left','white-space': 'nowrap','visibility': 'hidden'}).appendTo($('body'));

    return TreeVisualiser.TreeVisualiser.extend({

        /**
         * Initializes the TreeVisualiserDAT given a set of options
         *
         * @param {Object} options - Object with options for the TreeVisualiserDAT widget
         */
        initialize: function (options) {
            TreeVisualiser.TreeVisualiser.prototype.initialize.call(this, options);

            // Initialise default options
            this.options = { width: "auto", autoPlace: false, expandNodes: false};

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
            'contextmenu .cr.number': 'manageRightClickEvent',
            'click .title': 'manageLeftClickEvent',
            'click .cr.string': 'manageLeftClickEvent',
            'click .cr.number': 'manageLeftClickEvent',
            'mouseenter .title': 'manageHover',
            'mouseenter .cr.string': 'manageHover',
            'mouseenter .cr.number': 'manageHover',
            'mouseleave .title': 'manageUnhover',
            'mouseleave .cr.string': 'manageUnhover',
            'mouseleave .cr.number': 'manageUnhover'

        },

        getTriggeredElement: function(event){
        	if ($(event.target).is('li')){
        		return $(event.target);
        	}
        	else{
        		return $(event.target).closest('li');
        	}
        },

        manageHover: function(event){
        	var liElement = this.getTriggeredElement(event);
        	var nodeInstancePath = liElement.data("instancepath");
            if (nodeInstancePath != null || undefined) {
            	var node = this.dataset.valueDict[nodeInstancePath]["model"];
            	var that = this;
            	aIcons.click(function(event){that.showContextMenu(event, node);event.stopPropagation();});
            	liElement.prepend(aIcons);
            }
        },

        manageUnhover: function(event){
        	var liElement = this.getTriggeredElement(event);
        	var nodeInstancePath = liElement.data("instancepath");
        	aIcons.remove();
        },

        /**
         * Register right click event with widget
         *
         * @param {WIDGET_EVENT_TYPE} event - Handles right click event on widget
         */
        manageLeftClickEvent: function (event) {
        	var liElement = this.getTriggeredElement(event);
        	var nodeInstancePath = liElement.data("instancepath");

            if (nodeInstancePath != null || undefined) {
                //Read node from instancepath data property attached to dom element

                var node = this.dataset.valueDict[nodeInstancePath]["model"];
                if (node.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE && node.getWrappedObj().getType().getMetaType() == GEPPETTO.Resources.POINTER_TYPE){
                    GEPPETTO.CommandController.execute("G.addWidget(Widgets.TREEVISUALISERDAT).setData(" + node.getPath() + ")");
                }
                else{
                	this.dataset.isDisplayed = false;
                	if (node.getChildren().length == 0 && node.getHiddenChildren().length > 0){
        	            node.set({"children": node.getHiddenChildren()});
        	            for (var childIndex in node.getChildren()){
        	            	var nodeChild = node.getChildren()[childIndex];
        	            	if (nodeChild.getChildren().length > 0){
        	            		nodeChild.set({"_children": nodeChild.getChildren()});
        	            	}
        	            	nodeChild.set({"children": []});
        	            	this.prepareTree(this.dataset.valueDict[nodeInstancePath]["folder"], nodeChild, 0);
        	            }

        	            this.customiseLayout(this.dataset.valueDict[nodeInstancePath]["folder"].domElement);
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
        	var liElement = this.getTriggeredElement(event);
        	var nodeInstancePath = liElement.data("instancepath");
            if (nodeInstancePath != null || undefined) {
            	var node = this.dataset.valueDict[nodeInstancePath]["model"];

                //Read node from instancepath data property attached to dom element
                this.showContextMenu(event, node);
            }
        },

        /**
         * Sets the data used inside the TreeVisualiserDAT for rendering.
         *
         * @param {Array} state - Array of variables used to display inside TreeVisualiserDAT
         * @param {Object} options - Set of options passed to widget to customise it
         */
        setData: function (state, options) {
        	if (state == undefined){
        		return "Data can not be added to " + this.name + ". Data does not exist in current experiment.";
        	}
            labelsInTV = {};

            // If data is an array, let's iterate and call setdata
            if (state instanceof Array) {
                var that = this;
                $.each(state, function (d) {
                    that.setData(state[d], options);
                });
            }
            else{
	            //Call setData for parent class (TreeVisualiser)
	            var currentDataset = TreeVisualiser.TreeVisualiser.prototype.setData.call(this, state, options);

	            //Initialise nodes
	            this.initialiseGUIElements(currentDataset);
        	}

            return this;
        },

        initialiseGUIElements: function(currentDataset){
        	//Add to data variable
        	this.dataset.data.push(currentDataset);

        	//Generate DAT nodes
            this.dataset.isDisplayed = false;
            this.prepareTree(this.gui, currentDataset, 0);
            this.dataset.isDisplayed = true;

            // Customise layout: make text field non-editable, convert text field into text area...
            this.customiseLayout($(this.dialog));

        },

        customiseLayout: function(folder){
        	//Disable input elements
            $(folder).find("input").prop('disabled', true);

            //Change textfield to textarea if it is too big
            $(folder).find('.texttypetv').find('div > div > input[type="text"]').each(function () {
                testingSizeElement.text($(this).val());
                if (testingSizeElement.width() > $(this).width()) {
                    $(this).closest('.texttypetv').addClass('textarea');
                    var textarea = $(document.createElement('textarea')).attr('readonly', true).attr('rows', 2);
                    textarea.val($(this).val());
                    $(this).replaceWith(textarea);
                }
            });
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

            var children = data.getChildren();
            var _children = data.getHiddenChildren();

            if (!this.dataset.isDisplayed) {

            	//Ugly hack: DAT doesn't allow nodes with the same name
            	var isDuplicated = true;
            	while (isDuplicated) {
            		isDuplicated = false;
            		for (var key in labelsInTV){
            			if (labelsInTV[key] == label){
            				label = label + " ";
            				isDuplicated = true;
            				break;
            			}
            		}
                }
            	labelsInTV[data.getPath()] = label;

                if (children.length > 0 || _children.length > 0) {
                	this.dataset.valueDict[data.getPath()] = new function () {};
                	this.dataset.valueDict[data.getPath()]["folder"] = parent.addFolder(labelsInTV[data.getPath()]);

                    //Add class to dom element depending on node metatype
                    $(this.dataset.valueDict[data.getPath()]["folder"].domElement).find("li").addClass(data.getStyle());
                    //Add instancepath as data attribute. This attribute will be used in the event framework
                    $(this.dataset.valueDict[data.getPath()]["folder"].domElement).find("li").data("instancepath", data.getPath());

                    var parentFolderTmp = this.dataset.valueDict[data.getPath()]["folder"];
                    for (var childIndex in children) {
                        if (!this.dataset.isDisplayed || (this.dataset.isDisplayed && children[childIndex].name != "ModelTree")) {
                            this.prepareTree(parentFolderTmp, children[childIndex], step);
                        }
                    }

                    if (data.getBackgroundColors().length > 0){
                    	$(this.dataset.valueDict[data.getPath()]["folder"].domElement).find("li").append($('<a id="backgroundSections">').css({"z-index":1, "float": "right", "width": "60%", "height": "90%", "color": "black", "position":"absolute", "top": 0, "right": 0}));
	                    for (var index in data.getBackgroundColors()){
	                    	 var color = data.getBackgroundColors()[index].replace("0X","#");
	                    	 $(this.dataset.valueDict[data.getPath()]["folder"].domElement).find("li").find('#backgroundSections').append($('<span>').css({"float":"left","width": 100/data.getBackgroundColors().length + "%", "background-color": color, "height": "90%"}).html("&nbsp"));
	                    }
                    }

                    if (data.getValue().length > 0){
                    	$(this.dataset.valueDict[data.getPath()]["folder"].domElement).find("li").css({"position": "relative"});
                    	$(this.dataset.valueDict[data.getPath()]["folder"].domElement).find("li").append($('<a id="contentSections">').css({"z-index":2, "text-align": "center", "float": "right", "width": "60%", "height": "90%", "color": "black", "position":"absolute", "top": 0, "right": 0}));
	                    for (var index in data.getValue()){
	                    	 $(this.dataset.valueDict[data.getPath()]["folder"].domElement).find("li").find('#contentSections').append($('<span>').css({"float":"left","width": 100/data.getBackgroundColors().length + "%", "height": "90%"}).html(data.getValue()[index]));
	                    }
                    }

                }
                else {
                	this.dataset.valueDict[data.getPath()] = new function () {};
                	this.dataset.valueDict[data.getPath()][labelsInTV[data.getPath()]] = data.getValue();
                	this.dataset.valueDict[data.getPath()]["controller"] = parent.add(this.dataset.valueDict[data.getPath()], labelsInTV[data.getPath()]).listen();

                    //Add class to dom element depending on node metatype
                    $(this.dataset.valueDict[data.getPath()]["controller"].__li).addClass(data.getStyle());
                    //Add instancepath as data attribute. This attribute will be used in the event framework
                    $(this.dataset.valueDict[data.getPath()]["controller"].__li).data("instancepath", data.getPath());

                    // Execute set value if it is a parameter specification
                    if(data.getMetaType() == GEPPETTO.Resources.PARAMETER_TYPE)
					{
						$(dataset.valueDict[data.getPath()]["controller"].__li).find('div > div > input[type="text"]').change(function(){
                            GEPPETTO.CommandController.execute(data.getPath() + ".setValue(" + $(this).val().split(" ")[0] + ")");
						});
					}


                    if (data.getBackgroundColors().length > 0){
	                    var color = data.getBackgroundColors()[0].replace("0X","#");
	                    $(this.dataset.valueDict[data.getPath()]["controller"].__li).find(".c").css({"background-color": color, "height": "90%"});
                    }


                }

                if (this.options.expandNodes){
                	parent.open();
				}
                this.dataset.valueDict[data.getPath()]["model"] = data;
            }
            else {
                if (children.length > 0 || _children.length > 0) {
                	for (var childIndex in children){
						this.prepareTree(parent, children[childIndex],step);
					}
                }
                else if (data.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE){
                	var set = this.dataset.valueDict[data.getPath()]["controller"].__gui;
	                if (!set.__ul.closed) {
	                	this.dataset.valueDict[data.getPath()][labelsInTV[data.getPath()]] = this.treeVisualiserController.getFormattedValue(data.getWrappedObj(), data.getWrappedObj().capabilities[0], step);
	                }
                }
            }

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
            var currentDatasets = this.dataset.data;
            this.reset();
            for (var i = 0; i < currentDatasets.length; i++){
            	this.initialiseGUIElements(currentDatasets[i]);
        	}
        },

        /**
         * Initialising GUI with default values
         */
        initDATGUI: function () {
            this.gui = new dat.GUI({
                width: this.options.width,
                autoPlace: this.options.autoPlace
            });

            this.dialog.append(this.gui.domElement);
        }


    });
});
