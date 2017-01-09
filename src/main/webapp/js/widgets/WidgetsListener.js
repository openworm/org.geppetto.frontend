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
 * Listener class for widgets. Receives updates from Geppetto that need to be transmitted to all widgets.
 *
 * @author Jesus R Martinez (jesus@metacell.us)
 */
define(function (require) {

    var $ = require('jquery');

    return function (GEPPETTO) {

        /**
         * @exports Widgets/GEPPETTO.WidgetsListener
         */
        GEPPETTO.WidgetsListener = {

            /**
             * WIDGET_EVENT_TYPE
             *
             * Event types that tell widgets what to do
             *
             * @enum
             */
            WIDGET_EVENT_TYPE: {
                DELETE: "delete",
                UPDATE: "update",
                RESET_DATA: "reset",
                SELECTION_CHANGED: "select",
            },
            _subscribers: [],

            /**
             * Subscribes widget controller class to listener
             *
             * @param {Widgets/Controller} controller - Controller class to be subscribed to listener
             * @param {String} widgetID - ID of widget to register to global widgets listener
             */
            subscribe: function (controller, widgetID) {

                var addController = true;

                //traverse through existing subscribed controller to figure out whether to add new one or not
                for (var i = 0, len = this._subscribers.length; i < len; i++) {
                    if (this._subscribers[i] === controller) {
                        addController = false;
                    }
                }

                //subscribe controller only if it hasn't been already subscribed
                if (addController) {
                    this._subscribers.push(controller);

                    GEPPETTO.Console.debugLog('added new observer');
                }

                //registers remove handler for widget
                $("#" + widgetID).on("remove", function () {
                    //remove tags and delete object upon destroying widget
                    GEPPETTO.Console.removeCommands(widgetID);

                    var widgets = controller.getWidgets();

                    for (var p in widgets) {
                        if (widgets[p].getId() == this.id) {
                            widgets.splice(p, 1);
                            break;
                        }
                    }
                });

                //register resize handler for widget
                $("#" + widgetID).on("dialogresizestop", function (event, ui) {

                    var height = ui.size.height;
                    var width = ui.size.width;

                    GEPPETTO.Console.executeImplicitCommand(widgetID + ".setSize(" + height + "," + width + ")");

                    var left = ui.position.left;
                    var top = ui.position.top;

                    window[widgetID].setPosition(left, top);
                });

                //register drag handler for widget
                $("#" + widgetID).on("dialogdragstop", function (event, ui) {

                    var left = ui.position.left;
                    var top = ui.position.top;

                    GEPPETTO.Console.executeImplicitCommand(widgetID + ".setPosition(" + left + "," + top + ")");
                });
            },

            /**
             * Unsubscribe widget controller class from lobal widgets listener
             *
             * @param {Widgets/Controller} controller - Controller class to be unsubscribed from listener
             *
             */
            unsubscribe: function (controller) {
                for (var i = 0, len = this._subscribers.length; i < len; i++) {
                    if (this._subscribers[i] === controller) {
                        this._subscribers.splice(i, 1);
                        return true;
                    }
                }
                return false;
            },

            /**
             * Update all subscribed controller classes with new changes
             *
             * @param {Object} arguments - Set arguments with information to update the widgets
             */
            update: function (event, parameters) {
                for (var i = 0, len = this._subscribers.length; i < len; i++) {
                    this._subscribers[i].update(event, parameters);
                }
            }
        };
    };
});
