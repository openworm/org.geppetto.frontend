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

            addToHistory: function (label, method, arguments) {
                var elementPresentInHistory = false;
                for (var i = 0; i < this.history.length; i++) {
                    if (this.history[i].label == label && this.history[i].method == method) {
                        elementPresentInHistory = true;
                        //moves it to the first position
                        this.history.splice(0, 0, this.history.splice(i, 1)[0]);
                        break;
                    }
                }
                if (!elementPresentInHistory) {
                    this.history.push({
                        "label": label,
                        "method": method,
                        "arguments": arguments,
                    });
                }
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
                    GEPPETTO.Console.removeCommands(widget.getId());

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

            /**
             * Get the comments of a given widget file through an Ajax call. This is used to extract the comments on the methods
             * and visualize them when using the help command.
             *
             * @param {String} file
             */
            getFileComments: function (file) {
                if (this.comments.length == 0) {
                    var fetchedComments = [];
                    //retrieve the script to get the comments for all the methods
                    $.ajax({
                        async: false,
                        type: 'GET',
                        url: file,
                        dataType: "text",
                        //at success, read the file and extract the comments
                        success: function (data) {
                            var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
                            fetchedComments = data.match(STRIP_COMMENTS);
                        },
                        error: function () {
                            console.log('error fetching file with Ajax request');
                        }
                    });

                    this.comments = fetchedComments;
                }
                return this.comments;
            }
        })
    };

});
