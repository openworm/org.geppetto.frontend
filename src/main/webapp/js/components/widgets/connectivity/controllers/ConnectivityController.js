/**
 * Controller class for connectivity widget. Use to make calls to widget from inside Geppetto.
 *
 * @constructor
 *
 * @module Widgets/Connectivity
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 * @author Boris Marin
 */
define(function (require) {
    var AWidgetController = require('../../AWidgetController');


    /**
     * @exports Widgets/Connectivity/ConnectivityController
     */
    return AWidgetController.View.extend({

        initialize: function () {
            this.widgets = Array();
            this.history = [];
        },


        configureConnectivityWidget: function () {
            Connectivity.prototype.configViaGUI();
        },

        /**
         * Adds a new Connectivity Widget to Geppetto
         */
        addWidget: function (isStateless) {
            if (isStateless == undefined) {
                isStateless = false;
            }
            var that=this;

            return new Promise(resolve => {
                    require.ensure([], function (require) {
                    var Connectivity = require('../Connectivity');
                    //look for a name and id for the new widget
                    var id = that.getAvailableWidgetId("Connectivity", that.widgets);
                    var name = id;

                    //create tree visualiser widget
                    var cnt = window[name] = new Connectivity({
                        id: id, name: name, visible: false, width: 500, height: 500, controller: that,
                        widgetType: GEPPETTO.Widgets.CONNECTIVITY, stateless: isStateless
                    });

                    //create help command for connw
                    cnt.help = function () {
                        return GEPPETTO.CommandController.getObjectCommands(id);
                    };

                    //store in local stack
                    that.widgets.push(cnt);

                    GEPPETTO.WidgetsListener.subscribe(that, id);

                    //add commands help option
                    GEPPETTO.CommandController.updateHelpCommand(cnt, id, that.getFileComments("geppetto/js/components/widgets/connectivity/Connectivity.js"));

                    //update tags for autocompletion
                    GEPPETTO.CommandController.updateTags(cnt.getId(), cnt);

                    resolve(cnt);
                });

        });
        },

        /**
         * Receives updates from widget listener class to update TreeVisualizer3D widget(s)
         *
         * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
         */
        update: function (event) {
            //delete connectivity widget(s)
            if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
                this.removeWidgets();
            }
            //update connectivity widgets
            else if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.UPDATE) {
                //loop through all existing widgets
                for (var i = 0; i < this.widgets.length; i++) {
                    var cnt = this.widgets[i];
                    //update connectivity with new data set
                    cnt.updateData();
                }
            }
        }
    });
});
