
/**
 * Controller class for popup widget. Use to make calls to widget from inside Geppetto.
 *
 * @author Jesus R Martinez (jesus@metacell.us)
 */
define(function (require) {
    var Popup = require('../Popup');
    var AWidgetController = require('../../AWidgetController');

    /**
     * @exports Widgets/Popup/PopupsController
     */
    return AWidgetController.View.extend({

        initialize: function (config) {
            this.widgets = Array();
            this.history = [];
            if(config!=null || undefined){
            	this.buttonBarConfig = config.buttonBarConfiguration;
            }
        },

        /**
         * Creates popup widget
         */
        addPopupWidget: function () {
            //look for a name and id for the new widget
            var id = this.getAvailableWidgetId("Popup", this.widgets);
            var name = id;

            //create popup widget
            var p = window[name] = new Popup({id: id, name: name, visible: true, controller: this});
            p.setController(this);
            p.setSize(394,490);
            //create help command for plot
            p.help = function () {
                return GEPPETTO.Console.getObjectCommands(id);
            };

            //store in local stack
            this.widgets.push(p);


            GEPPETTO.WidgetsListener.subscribe(this, id);

            //add commands to console autocomplete and help option
            GEPPETTO.Console.updateHelpCommand(p, id, this.getFileComments("geppetto/js/components/widgets/popup/Popup.js"));

            //update tags for autocompletion
            GEPPETTO.Console.updateTags(p.getId(), p);

            return p;
        },

        /**
         * Receives updates from widget listener class to update popup widget(s)
         *
         * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
         */
        update: function (event) {
            //delete popup widget(s)
            if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
                this.removeWidgets();
            }
        }
    });
});
