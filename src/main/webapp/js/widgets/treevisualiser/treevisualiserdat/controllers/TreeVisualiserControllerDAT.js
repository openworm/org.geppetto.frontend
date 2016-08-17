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
    var TreeVisualiserDAT = require('widgets/treevisualiser/treevisualiserdat/TreeVisualiserDAT');

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
        addTreeVisualiserDATWidget: function () {
            //look for a name and id for the new widget
            var id = this.getAvailableWidgetId("TreeVisualiserDAT", this.widgets);
            var name = id;

            // create tree visualiser widget
            var tvdat = window[name] = new TreeVisualiserDAT({
                id: id,
                name: name,
                visible: true,
                width: 260,
                height: 350
            });
            // create help command for plot
            tvdat.help = function () {
                return GEPPETTO.Utility.getObjectCommands(id);
            };
            // store in local stack
            this.widgets.push(tvdat);

            GEPPETTO.WidgetsListener.subscribe(this, id);

            // updates helpc command output
            GEPPETTO.Console.updateHelpCommand(tvdat, id, this.getFileComments("geppetto/js/widgets/treevisualiser/treevisualiserdat/TreeVisualiserDAT.js"));
            //update tags for autocompletion
            GEPPETTO.Console.updateTags(tvdat.getId(), tvdat);

            return tvdat;
        },

        /**
         * Receives updates from widget listener class to update TreeVisualizerDAT widget(s)
         *
         * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
         */
        update: function (event, parameters) {
            var treeVisualisersDAT = this.getWidgets();
            // delete treevisualiser widget(s)
            if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
                this.removeWidgets();
            }
            else if (event == Events.Select) {
                //loop through all existing widgets
                for (var i = 0; i < this.widgets.length; i++) {
                    var treeVisualiserDAT = this.widgets[i];

                    if (_.find(treeVisualiserDAT.registeredEvents, function (el) {
                            return el.id === event;
                        })) {
                        var selected = G.getSelection();
                        treeVisualiserDAT.reset();
                        //update treevisualiser with new data set
                        treeVisualiserDAT.setData(selected[0]);
                    }
                }
            }
            // update treevisualiser widgets
            else if (event == Events.Experiment_update) {
                // loop through all existing widgets
                for (var i = 0; i < treeVisualisersDAT.length; i++) {
                    var treeVisualiserDAT = treeVisualisersDAT[i];

                    // update treevisualiser with new data set
                    treeVisualiserDAT.updateData(parameters.step);
                }
            }
            // update treevisualiser widgets
            else if (event == Events.ModelTree_populated || event == Events.SimulationTree_populated) {
                // loop through all existing widgets
                for (var i = 0; i < treeVisualisersDAT.length; i++) {
                    var treeVisualiserDAT = treeVisualisersDAT[i];

                    var ev = _.find(treeVisualiserDAT.registeredEvents, function (el) {
                        return el.id === event;
                    });
                    if (typeof ev !== 'undefined') {
                        if (typeof ev.callback === 'undefined') {
                            //TODO: We need the event data here so we can decide if we would like to refresh or not
                            treeVisualiserDAT.refresh();
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
            var group1 = [{
                label: "Open with DAT Widget",
                action: ["G.addWidget(Widgets.TREEVISUALISERDAT).setData(" + node.getPath() + ")"],
            }];


            var availableWidgets = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.TREEVISUALISERDAT).getWidgets();
            if (availableWidgets.length > 0) {
                var group1Add = {
                    label: "Add to DAT Widget",
                    position: 0
                };

                var subgroups1Add = [];
                for (var availableWidgetIndex in availableWidgets) {
                    var availableWidget = availableWidgets[availableWidgetIndex];
                    subgroups1Add = subgroups1Add.concat([{
                        label: "Add to " + availableWidget.name,
                        action: [availableWidget.id + ".setData(" + node.getPath() + ")"],
                        position: availableWidgetIndex
                    }]);
                }
                group1Add["groups"] = [subgroups1Add];

                group1.push(group1Add);
            }

            var groups = [group1];

           if (node.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE && node.getWrappedObj().getVisualType() != undefined) {
                var entity = [{
                    label: "Select Visual Component",
                    action: ["G.unSelectAll();", node.getPath() + ".select()"],
                }];

                groups.push(entity);
            }
           
           if (node.getMetaType() == GEPPETTO.Resources.VISUAL_GROUP_NODE){
        	   var visualGroup = [{
                   label: "Show Visual Groups",
                   action: ["G.unSelectAll();", node.getPath() + ".show(true)"]
               }];
        	   
        	   groups.push(visualGroup);
           }
           
           if (node.getWrappedObj().capabilities != null && node.getWrappedObj().capabilities.length > 0 && node.getWrappedObj().capabilities.indexOf('VisualGroupCapability') != -1){
        	   var visualGroup = [{
                   label: "Show Visual Groups"
               }];

        	   var subgroups1Add = [];
               for (var visualGroupIndex in node.getWrappedObj().getVisualGroups()) {
                   subgroups1Add = subgroups1Add.concat([{
                       label: "Show " + node.getWrappedObj().getVisualGroups()[visualGroupIndex].getName(),
                       action: ["G.unSelectAll();", node.getPath() + ".applyVisualGroup(" + node.getPath() + ".getVisualGroups()[" + visualGroupIndex + "], true)"],
                       position: visualGroupIndex
                   }]);
               }
               visualGroup[0]["groups"] = [subgroups1Add];

               groups.push(visualGroup);
           }

            return groups;
        },
    });
});