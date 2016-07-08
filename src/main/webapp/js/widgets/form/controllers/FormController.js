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
 * Controller class for treevisualiser widget. Use to make calls to widget from
 * inside Geppetto.
 *
 * @module Widgets/TreeVisualizerControllerDAT
 *
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function (require) {
    var AWidgetController = require('widgets/AWidgetController');
    var Form = require('widgets/form/Form');

    /**
     * @exports Widgets/Connectivity/TreeVisualiserControllerDATController
     */
    return AWidgetController.View.extend({

        initialize: function () {
            this.widgets = [];
        },

        /**
         * Adds a new TreeVisualizerDAT Widget to Geppetto
         */
        addFormWidget: function () {
            //look for a name and id for the new widget
            var id = this.getAvailableWidgetId("Form", this.widgets);
            var name = id;

            // create tree visualiser widget
            var formWidget = window[name] = new Form({
                id: id,
                name: name,
                visible: true,
                width: 260,
                height: 350
            });
            // create help command for plot
            formWidget.help = function () {
                return GEPPETTO.Utility.getObjectCommands(id);
            };
            // store in local stack
            this.widgets.push(formWidget);

            GEPPETTO.WidgetsListener.subscribe(this, id);

            // updates helpc command output
            GEPPETTO.Console.updateHelpCommand(formWidget, id, this.getFileComments("geppetto/js/widgets/form/Form.js"));
            //update tags for autocompletion
            GEPPETTO.Console.updateTags(formWidget.getId(), formWidget);

            return formWidget;
        },

        /**
         * Receives updates from widget listener class to update TreeVisualizerDAT widget(s)
         *
         * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
         */
        update: function (event, parameters) {
            var formWidgets = this.getWidgets();
            // delete treevisualiser widget(s)
            if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
                this.removeWidgets();
            }
            else if (event == Events.Select) {
                //loop through all existing widgets
                for (var i = 0; i < this.widgets.length; i++) {
                    var formWidget = this.widgets[i];

                    if (_.find(formWidget.registeredEvents, function (el) {
                            return el.id === event;
                        })) {
                        var selected = G.getSelection();
                        formWidget.reset();
                        //update treevisualiser with new data set
                        formWidget.setData(selected[0]);
                    }
                }
            }
            // update treevisualiser widgets
            else if (event == Events.Experiment_update) {
                // loop through all existing widgets
                for (var i = 0; i < formWidgets.length; i++) {
                    var formWidget = formWidgets[i];

                    // update treevisualiser with new data set
                    formWidget.updateData(parameters.step);
                }
            }
            // update treevisualiser widgets
            else if (event == Events.ModelTree_populated || event == Events.SimulationTree_populated) {
                // loop through all existing widgets
                for (var i = 0; i < formWidgets.length; i++) {
                    var formWidget = formWidgets[i];

                    var ev = _.find(formWidget.registeredEvents, function (el) {
                        return el.id === event;
                    });
                    if (typeof ev !== 'undefined') {
                        if (typeof ev.callback === 'undefined') {
                            //TODO: We need the event data here so we can decide if we would like to refresh or not
                            formWidget.refresh();
                        }
                        else {
                            ev.callback();
                        }

                    }

                }
            }
        },

        /**
         * Retrieve commands for a specific variable node
         *
         * @param {Node} node - Geppetto Node used for extracting commands
         * @returns {Array} Set of commands associated with this node
         */
        getCommands: function (node) {
            var groups = [];
            return groups;
        },
    });
});