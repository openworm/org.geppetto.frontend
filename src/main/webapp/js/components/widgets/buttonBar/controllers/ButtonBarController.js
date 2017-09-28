/**
 * Controller class for the button bar widget.
 *
 * @author borismarin
 */
define(function (require) {

    var AWidgetController = require('../../AWidgetController');


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
        addWidget: function (isStateless) {
            if (isStateless == undefined) {
                isStateless = false;
            }
            var that=this;

            return new Promise(resolve => {
                    require.ensure([], function (require) {
                    var BuBar = require('../ButtonBar');

                    //look for a name and id for the new widget
                    var id = that.getAvailableWidgetId("ButtonBar", that.widgets);
                    var name = id;
                    var vv = window[name] = new BuBar({
                        id: id, name: name, visible: true,
                        widgetType: GEPPETTO.Widgets.BUTTONBAR, stateless: isStateless
                    });
                    vv.help = function () {
                        return GEPPETTO.CommandController.getObjectCommands(id);
                    };
                    that.widgets.push(vv);

                    GEPPETTO.WidgetsListener.subscribe(that, id);

                    //updates help command options
                    GEPPETTO.CommandController.updateHelpCommand(vv, id, this.getFileComments("geppetto/js/components/widgets/buttonBar/ButtonBar.js"));
                    //update tags for autocompletion
                    GEPPETTO.CommandController.updateTags(vv.getId(), vv);
                    resolve(vv);
                });


        });
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
