
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
    var Connectivity = require('../Connectivity');

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
        addConnectivityWidget: function () {
            //look for a name and id for the new widget
            var id = this.getAvailableWidgetId("Connectivity", this.widgets);
            var name = id;


            //create tree visualiser widget
            var cnt = window[name] = new Connectivity({id: id, name: name, visible: false, width: 500, height: 500, controller: this});

            //create help command for connw
            cnt.help = function () {
                return GEPPETTO.Utility.getObjectCommands(id);
            };

            //store in local stack
            this.widgets.push(cnt);

            GEPPETTO.WidgetsListener.subscribe(this, id);

            //add commands help option
            GEPPETTO.Console.updateHelpCommand(cnt, id, this.getFileComments("geppetto/js/widgets/connectivity/Connectivity.js"));

            //update tags for autocompletion
            GEPPETTO.Console.updateTags(cnt.getId(), cnt);

            return cnt;
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
