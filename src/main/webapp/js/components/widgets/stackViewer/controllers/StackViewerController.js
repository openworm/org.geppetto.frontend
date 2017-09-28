/**
 * Controller class for the stackViewer widget.
 *
 * @author Robbie1977
 */
define(function (require) {

    var AWidgetController = require('../../AWidgetController');


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
        addWidget: function (isStateless) {
            if (isStateless == undefined) {
                // stateless by default
                isStateless = true;
            }

            var that=this;

            return new Promise(resolve => {
                    require.ensure([], function (require) {
                    var Stack = require('../StackViewer');
                    //look for a name and id for the new widget
                    var id = that.getAvailableWidgetId("StackViewer", that.widgets);
                    var name = id;
                    var vv = window[name] = new Stack({
                        id: id, name: name, visible: true,
                        widgetType: GEPPETTO.Widgets.STACKVIEWER, stateless: isStateless
                    });
                    vv.help = function () {
                        return GEPPETTO.CommandController.getObjectCommands(id);
                    };
                    that.widgets.push(vv);

                    GEPPETTO.WidgetsListener.subscribe(that, id);

                    //updates help command options
                    GEPPETTO.CommandController.updateHelpCommand(vv, id, that.getFileComments("geppetto/js/components/widgets/stackViewer/StackViewer.js"));

                    //update tags for autocompletion
                    GEPPETTO.CommandController.updateTags(vv.getId(), vv);
                    resolve(vv);
                });


        })
            ;
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
