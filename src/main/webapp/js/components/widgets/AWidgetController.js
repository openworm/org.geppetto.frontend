
/**
 *
 * Base widget controller, all widget controllers extend this
 * @module Widgets/Widget
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {

    var Backbone = require('backbone');
    var $ = require('jquery');
    return {
        /**
         * Creates base view for widget
         */
        View: Backbone.View.extend({

            widgets: [],
            on: true,
            registeredEvents: null,
            comments: [],
            history: [],
            staticHistoryMenu: [],

            constructor: function () {
                // Call the original constructor
                Backbone.View.apply(this, arguments);
                registeredEvents = [];
            },

            /**
             * Returns all plotting widgets objects
             *
             * @returns {Array} Array containing all plots
             */
            getWidgets: function () {
                return this.widgets;
            },

            addToHistory: function (label, method, args, id) {
                var elementPresentInHistory = false;
                var widget = this.getWidgetById(id);

                for (var i = 0; i < this.history.length; i++) {
                    if (this.history[i].label == label && this.history[i].method == method) {
                        elementPresentInHistory = true;
                        //moves it to the first position
                        if(widget.updateHistoryPosition){
                        	this.history.splice(0, 0, this.history.splice(i, 1)[0]);
                        }
                        break;
                    }
                }
                if (!elementPresentInHistory) {
                    this.history.unshift({
                        "label": label,
                        "method": method,
                        "arguments": args,
                    });
                    
                    this.staticHistoryMenu.push({
        				"label": label,
        				"method": method,
        				"arguments": args,
        			});
                }
                
                widget.updateNavigationHistoryBar();
            },

            /**
             * Toggles variable visualiser widget on and off
             */
            toggle: function () {
                if (this.widgets.length > 0) {
                    this.on = !this.on;
                    for (var w in this.widgets) {
                        var widget = this.widgets[w];
                        if (!this.on) {
                            widget.hide();
                        } else {
                            widget.show();
                        }
                    }
                }
            },

            /**
             * Removes existing plotting widgets
             */
            removeWidgets: function () {
                //remove all existing widgets
                for (var i = 0; i < this.widgets.length; i++) {
                    var widget = this.widgets[i];

                    //remove commands
                    GEPPETTO.CommandController.removeCommands(widget.getId());

                    widget.destroy();

                    i--;
                }

                this.widgets = [];
            },

            /**
             * Get an available id for an specific widget
             *
             * @module WidgetUtility
             * @param {String} prefix
             * @param {Array} widgetsList
             * @returns {String} id - Available id for a widget
             */
            getAvailableWidgetId: function (prefix, widgetsList) {
                var index = 0;
                var id = "";
                var available;

                do {
                    index++;
                    id = prefix + index;
                    available = true;

                    for (var p in widgetsList) {
                        if (widgetsList[p].getId() == id) {
                            available = false;
                            break;
                        }
                    }
                }
                while (available == false);

                return id;
            },

            getWidgetById : function(id){
            	for (var i = 0; i< this.widgets.length; i++) {
                    var widget = this.widgets[i];
                    if(widget.getId()==id){
                    	return widget;
                    }
                }
            	
            	return null;
            },
            
            /**
             * Get the comments of a given widget file through an Ajax call. This is used to extract the comments on the methods
             * and visualize them when using the help command.
             *
             * @param {String} file
             */
            getFileComments: function (file) {
                if (this.comments.length == 0) {
                    var that = this;
                    //retrieve the script to get the comments for all the methods
                    $.ajax({
                        async: true,
                        type: 'GET',
                        url: file,
                        dataType: "text",
                        //at success, read the file and extract the comments
                        success: function (data) {
                            var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
                            that.comments = data.match(STRIP_COMMENTS);
                        },
                        error: function () {
                            console.log('error fetching file with Ajax request');
                        }
                    });

                }
                return this.comments;
            }
        })
    };

});
