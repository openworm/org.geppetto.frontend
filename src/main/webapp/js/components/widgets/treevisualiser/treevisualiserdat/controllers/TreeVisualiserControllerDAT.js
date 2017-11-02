
/**
 * Controller class for treevisualiser widget. Use to make calls to widget from
 * inside Geppetto.
 *
 * @module Widgets/TreeVisualizerControllerDAT
 *
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function (require) {
    var AWidgetController = require('../../../AWidgetController');


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
        addWidget: function (isStateless) {
            if (isStateless == undefined) {
                // stateless by default
                isStateless = true;
            }

            var that=this;

            return new Promise(resolve => {
                    require.ensure([], function (require) {


                    var TreeVisualiserDAT = require('../TreeVisualiserDAT');
                    //look for a name and id for the new widget
                    var id = that.getAvailableWidgetId("TreeVisualiserDAT", that.widgets);
                    var name = id;

                    // create tree visualiser widget
                    var tvdat = window[name] = new TreeVisualiserDAT({
                        id: id, name: name, visible: true, width: 260, height: 350,
                        widgetType: GEPPETTO.Widgets.TREEVISUALISERDAT, stateless: isStateless
                    });
                    // create help command for plot
                    tvdat.help = function () {
                        return GEPPETTO.CommandController.getObjectCommands(id);
                    };
                    // store in local stack
                    that.widgets.push(tvdat);

                    GEPPETTO.WidgetsListener.subscribe(that, id);

                    // updates helpc command output
                    GEPPETTO.CommandController.updateHelpCommand(tvdat, id, that.getFileComments("geppetto/js/components/widgets/treevisualiser/treevisualiserdat/TreeVisualiserDAT.js"));
                    //update tags for autocompletion
                    GEPPETTO.CommandController.updateTags(tvdat.getId(), tvdat);

                    resolve(tvdat);
                });
        });
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
            else if (event == GEPPETTO.Events.Select) {
                //loop through all existing widgets
                for (var i = 0; i < this.widgets.length; i++) {
                    var treeVisualiserDAT = this.widgets[i];

                    if (_.find(treeVisualiserDAT.registeredEvents, function (el) {
                            return el.id === event;
                        })) {
                        var selected = GEPPETTO.SceneController.getSelection();
                        treeVisualiserDAT.reset();
                        //update treevisualiser with new data set
                        treeVisualiserDAT.setData(selected[0]);
                    }
                }
            }
            // update treevisualiser widgets
            else if (event == GEPPETTO.Events.Experiment_update) {
                // loop through all existing widgets
                for (var i = 0; i < treeVisualisersDAT.length; i++) {
                    var treeVisualiserDAT = treeVisualisersDAT[i];

                    // update treevisualiser with new data set
                    treeVisualiserDAT.updateData(parameters.step);
                }
            }
            // update treevisualiser widgets
            else if (event == GEPPETTO.Events.ModelTree_populated || event == GEPPETTO.Events.SimulationTree_populated) {
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
                    action: ["GEPPETTO.SceneController.deselectAll();", node.getPath() + ".select()"],
                }];

                groups.push(entity);
            }
           
           if (node.getMetaType() == GEPPETTO.Resources.VISUAL_GROUP_NODE){
        	   var visualGroup = [{
                   label: "Show Visual Groups",
                   action: ["GEPPETTO.SceneController.deselectAll();", node.getPath() + ".show(true)"]
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
                       action: ["GEPPETTO.SceneController.deselectAll();", node.getPath() + ".applyVisualGroup(" + node.getPath() + ".getVisualGroups()[" + visualGroupIndex + "], true)"],
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