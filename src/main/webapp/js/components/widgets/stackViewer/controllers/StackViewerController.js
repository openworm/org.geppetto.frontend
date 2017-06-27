/**
 * Controller class for the stackViewer widget.
 *
 * @author Robbie1977
 */
define(function (require) {

    var AWidgetController = require('../../AWidgetController');
    var Stack = require('../StackViewer');

    /**
     * @exports Widgets/stackViewer/stackViewerController
     */
    return AWidgetController.View.extend({

        initialize: function () {
            this.widgets = Array();
            this.history = [];
        },

        /**
         * Creates new stack viewer widget
         */
        addStackViewerWidget: function (isStateless) {
            if(isStateless == undefined){
                // stateless by default
                isStateless = true;
            }

            //look for a name and id for the new widget
            var id = this.getAvailableWidgetId("StackViewer", this.widgets);
            var name = id;
            var vv = window[name] = new Stack({
                id: id, name: name, visible: true,
                widgetType: GEPPETTO.Widgets.STACKVIEWER, stateless: isStateless
            });
            vv.help = function () {
                return GEPPETTO.Console.getObjectCommands(id);
            };
            this.widgets.push(vv);

            GEPPETTO.WidgetsListener.subscribe(this, id);

            //updates help command options
            GEPPETTO.Console.updateHelpCommand(vv, id, this.getFileComments("geppetto/js/components/widgets/stackViewer/StackViewer.js"));

            //update tags for autocompletion
            GEPPETTO.Console.updateTags(vv.getId(), vv);
            return vv;
        },

        /**
         * Receives updates from widget listener class to update Button Bar widget(s)
         *
         * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
         */
        update: function (event) {
            //delete a widget(s)
            if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
                this.removeWidgets();
            }

            //reset widget's datasets
            else if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.RESET_DATA) {
                //pass
            }

            //update widgets
            else if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.UPDATE) {
                //pass
            }
        }
    });
});
