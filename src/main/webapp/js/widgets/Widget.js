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
 * Base Widget Class, all widgets extend this class.
 * @module Widgets/Widget
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {

    var Backbone = require('backbone');
    var $ = require('jquery');
    return {

        /**
         * Not yet implemented, used for local storage and history.
         */
        Model: Backbone.Model.extend({}),

        /**
         * Creates base view for widget
         */
        View: Backbone.View.extend({

            id: null,
            dialog: null,
            visible: true,
            destroyed: false,
            size: {height: 300, width: 350},
            position: {left: "50%", top: "50%"},
            registeredEvents: null,


            /**
             * Initializes the widget
             *
             * @param {String} id - id of widget
             * @param {String} name - name of widget
             * @param {String} visibility - visibility of widget window
             */
            initialize: function (options) {
                this.id = options.id;
                this.name = options.name;
                this.controller = options.controller;
                this.visible = options.visible;
                this.contextMenu = new GEPPETTO.ContextMenuView();
                this.historyMenu = new GEPPETTO.ContextMenuView();
                this.registeredEvents = [];
            },

            /**
             * Destroy the widget, remove it from DOM
             *
             * @command destroy()
             * @returns {String} - Action Message
             */
            destroy: function () {
                $("#" + this.id).remove();
                this.destroyed=true;
                return this.name + " destroyed";
            },

            /**
             *
             * Hides the widget
             *
             * @command hide()
             * @returns {String} - Action Message
             */
            hide: function () {
                $("#" + this.id).dialog('close');

                this.visible = false;

                return "Hiding " + this.name + " widget";
            },

            /**
             *  Opens widget dialog
             *
             * @command show()
             * @returns {String} - Action Message
             */
            show: function () {
                $("#" + this.id).dialog('open');
                this.visible = true;

                //Unfocused close button
                $(".ui-dialog-titlebar-close").blur();

                return this;
            },

            /**
             * Gets the name of the widget
             *
             * @command getName()
             * @returns {String} - Name of widget
             */
            getName: function () {
                return this.name;
            },

            /**
             * Sets the name of the widget
             * @command setName(name)
             * @param {String} name - Name of widget
             */
            setName: function (name) {
                this.name = name;

                // set name to widget window
                $("#" + this.id).dialog("option", "title", this.name);

                return this;
            },

            /**
             * @command setPosition(left,top)
             * @param {Integer} left -Left position of the widget
             * @param {Integer} top - Top position of the widget
             */
            setPosition: function (left, top) {

                this.position.left = left;
                this.position.top = top;

                $("#" + this.id).dialog(
                    'option', 'position', {
                        my: "left+" + this.position.left + " top+" + this.position.top,
                        at: "left top",
                        of: $(window)
                    });
                return this;
            },

            /**
             * Sets the size of the widget
             * @command setSize(h,w)
             * @param {Integer} h - Height of the widget
             * @param {Integer} w - Width of the widget
             */
            setSize: function (h, w) {
                this.size.height = h;
                this.size.width = w;
                $("#" + this.id).dialog({height: this.size.height, width: this.size.width});

                return this;
            },

            /**
             * @command setMinHeight(h)
             * @param {Integer} h - Minimum Height of the widget
             */
            setMinHeight: function (h) {
                $("#" + this.id).dialog('option', 'minHeight', h);
                return this;
            },

            /**
             * @command setMinWidth(w)
             * @param {Integer} w - Minimum Width of the widget
             */
            setMinWidth: function (w) {
                $("#" + this.id).dialog('option', 'minWidth', w);
                return this;
            },

            /**
             * @command setMinSize(h,w)
             * @param {Integer} h - Minimum Height of the widget
             * @param {Integer} w - Minimum Width of the widget
             */
            setMinSize: function (h, w) {
                this.setMinHeight(h);
                this.setMinWidth(w);
                return this;
            },

            /**
             * @command setResizable(true|false)
             * @param {Boolean} true|false - enables / disables resizability
             */
            setResizable: function (resize) {
                $("#" + this.id).dialog('option', 'resizable', resize);
                return this;
            },

            /**
             * @command setAutoWidth()
             */
            setAutoWidth: function () {
                $("#" + this.id).dialog('option', 'width', 'auto');
                return this;
            },

            /**
             * @command setAutoHeigth()
             */
            setAutoHeight: function () {
                $("#" + this.id).dialog('option', 'height', 'auto');
                return this;
            },


            /**
             * Returns the position of the widget
             * @command getPosition()
             * @returns {Object} - Position of the widget
             */
            getPosition: function () {
                return this.position;
            },

            /**
             * Returns the size of the widget
             * @command getSize()
             * @returns {Object} - Size of the widget
             */
            getSize: function () {
                return this.size;
            },

            /**
             * Gets the ID of the widget
             *
             * @command getId()
             * @returns {String} - ID of widget
             */
            getId: function () {
                return this.id;
            },

            /**
             * Returns whether widget is visible or not
             *
             * @command isVisible()
             * @returns {Boolean} - Widget visibility state
             */
            isVisible: function () {
                return this.visible;
            },

            /**
             * Search obj for the value of node within using path.
             * E.g. If obj = {"tree":{"v":1}} and path is "tree.v", it will
             * search within the obj to find the value of "tree.v", returning object
             * containing {value : val, unit : unit, scale : scale}.
             */
            getState: function (tree, state) {
                var paths = state.split('.')
                    , current = tree
                    , i;

                for (i = 0; i < paths.length; ++i) {
                    //get index from node if it's array
                    var index = paths[i].match(/[^[\]]+(?=])/g);

                    if (index == null) {
                        if (current[paths[i]] == undefined) {
                            return undefined;
                        } else {
                            current = current[paths[i]];
                        }
                    }
                    else {
                        var iNumber = index[0].replace(/[\[\]']+/g, "");

                        //take index and brackets out of the equation for now
                        var node = paths[i].replace(/ *\[[^]]*\] */g, "");

                        if (current[node][parseInt(iNumber)] == undefined) {
                            return undefined;
                        } else {
                            current = current[node][parseInt(iNumber)];
                        }
                    }
                }
                return current;
            },

            getHistoryItems: function () {
                var data = [];
                for (var i = 0; i < this.controller.history.length; i++) {
                    var action = this.getId() + "[" + this.getId() + ".controller.history[" + i + "].method].apply(" + this.getId() + ", " + this.getId() + ".controller.history[" + i + "].arguments)";
                    data.push({
                        "label": this.controller.history[i].label,
                        "action": [action],
                        "icon": "fa-history",
                        "position": i
                    })
                }
                return data;
            },

            showHistoryMenu: function (event) {
                var that = this;
                if (this.controller.history.length > 0) {

                    this.historyMenu.show({
                        top: event.pageY,
                        left: event.pageX + 1,
                        groups: that.getHistoryItems(),
                        data: that
                    });
                }

                if (event != null) {
                    event.preventDefault();
                }
                return false;
            },

            showContextMenu: function (event, data) {
                var handlers = GEPPETTO.MenuManager.getCommandsProvidersFor(data.getMetaType());

                if (handlers.length > 0) {
                    var groups = [];
                    for (var handlerIndex = 0; handlerIndex < handlers.length; handlerIndex++) {
                        groups = groups.concat(handlers[handlerIndex](data));
                    }

                    this.contextMenu.show({
                        top: event.pageY,
                        left: event.pageX + 1,
                        groups: groups,
                        //registeredItems: registeredItems,
                        data: data
                    });
                }

                if (event != null) {
                    event.preventDefault();
                }

                return false;
            },

            /**
             * hides / shows the title bar
             */
            showTitleBar: function (show) {
                if (show) {
                    $("#" + this.id).parent().find(".ui-dialog-titlebar").show();
                } else {
                    $("#" + this.id).parent().find(".ui-dialog-titlebar").hide();
                }
            },

            /**
             * hides / shows the exit button
             */
            showCloseButton: function (show) {
                if (show) {
                    $("#" + this.id).parent().find(".ui-dialog-titlebar-close").show();
                } else {
                    $("#" + this.id).parent().find(".ui-dialog-titlebar-close").hide();
                }
            },

            addButtonToTitleBar: function(button){
            	var dialogParent = this.$el.parent();
            	dialogParent.find("div.ui-dialog-titlebar").prepend(button);
            	$(button).addClass("widget-title-bar-button");
            },
            
            addHelpButton: function () {
            	var that=this;
                this.addButtonToTitleBar($("<div class='fa fa-question'></div>").click(function () {
                    GEPPETTO.ComponentFactory.addComponent('MDMODAL', {
                        title: that.id.slice(0,-1) + ' help',
                        content: that.getHelp(),
                        show: true
                    }, document.getElementById("modal-region"));
                }));
            },

            /**
             * makes the widget draggable or not
             */
            setDraggable: function (draggable) {
                if (draggable) {
                    $("#" + this.id).parent().draggable({disabled: false});
                    // NOTE: this will wipe any class applied to the widget...
                    this.setClass('');
                } else {
                    $("#" + this.id).parent().draggable({disabled: true});
                    this.setClass('noStyleDisableDrag');
                }
            },

            /**
             * Inject CSS for custom behaviour
             */
            setClass: function (className) {
                $("#" + this.id).dialog({dialogClass: className});
            },

            /**
             * Renders the widget dialog window
             */
            render: function () {
            	
            	var that = this;
            	
                //create the dialog window for the widget
                this.dialog = $("<div id=" + this.id + " class='dialog' title='" + this.name + " Widget'></div>").dialog(
                    {
                        resizable: true,
                        draggable: true,
                        top: 10,
                        height: 300,
                        width: 350,
                        close: function (event, ui) {
                            if (event.originalEvent &&
                                $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length) {
                                that.destroy();
                            }
                        }
                    });

                this.$el = $("#" + this.id);
                var dialogParent = this.$el.parent();
                

                //add history
                this.addButtonToTitleBar($("<div class='fa fa-history'></div>").click(function (event) {
                    that.showHistoryMenu(event);
                    event.stopPropagation();
                }));

                //remove the jQuery UI icon
                dialogParent.find("button.ui-dialog-titlebar-close").html("");
                dialogParent.find("button").append("<i class='fa fa-close'></i>");


                //Take focus away from close button
                dialogParent.find("button.ui-dialog-titlebar-close").blur();

                //add help button
                this.addHelpButton();

            },

            /**
             * Register event with widget
             *
             * @command registerEvent(event)
             */
            registerEvent: function (event, callback) {
                this.registeredEvents.push({id: event, callback: callback});
            },

            /**
             * Unregister event with widget
             *
             * @command unregisterEvent(event)
             */
            unregisterEvent: function (event) {
                this.registeredEvents = _.reject(this.registeredEvents, function (el) {
                    return el.id === event
                });
            },

            getHelp: function(){
                return '### Inline help not yet available for this widget! \n\n' +
                'Try the <a href="http://docs.geppetto.org/en/latest/usingwidgets.html" target="_blank">online documentation</a> instead.';
            }
        })
    }
        ;

})
;
