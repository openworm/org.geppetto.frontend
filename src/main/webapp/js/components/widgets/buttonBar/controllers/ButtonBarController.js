/**
 * Controller class for the button bar widget.
 *
 * @author borismarin
 */
define(function (require) {

    var AWidgetController = require('../../AWidgetController');
    var BuBar = require('../ButtonBar');

    /**
     * @exports Widgets/ButtonBar/ButtonBarController
     */
    return AWidgetController.View.extend({

        initialize: function () {
            this.widgets = [];
        },

        /**
         * Creates new button bar widget
         */
        addButtonBarWidget: function (isStateless) {
            if(isStateless == undefined){
                isStateless = false;
            }

            //look for a name and id for the new widget
            var id = this.getAvailableWidgetId("ButtonBar", this.widgets);
            var name = id;
            var vv = window[name] = new BuBar({
                id: id, name: name, visible: true,
                widgetType: GEPPETTO.Widgets.BUTTONBAR, stateless: isStateless
            });
            vv.help = function () {
                return GEPPETTO.Console.getObjectCommands(id);
            };
            this.widgets.push(vv);

            GEPPETTO.WidgetsListener.subscribe(this, id);

            //updates help command options
            GEPPETTO.Console.updateHelpCommand(vv, id, this.getFileComments("geppetto/js/components/widgets/buttonBar/ButtonBar.js"));
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
