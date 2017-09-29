/**
 * Controller class for variables visualiser widget.
 *
 * @author Dan Kruchinin (dkruchinin@acm.org)
 */
define(function (require) {

    var AWidgetController = require('../../AWidgetController');
    var VarVis = require('../VariableVisualiser');

    /**
     * @exports Widgets/VariableVisualiser/VariableVisualiserController
     */
    return AWidgetController.View.extend({

        initialize: function () {
            this.widgets = [];
        },

        /**
         * Creates new variable visualiser widget
         */
        addVariableVisualiserWidget: function (isStateless) {
            if(isStateless == undefined){
                isStateless = false;
            }

            //look for a name and id for the new widget
            var id = this.getAvailableWidgetId("VarVis", this.widgets);
            var name = id;
            var vv = window[name] = new VarVis({
                id: id, name: name, visible: true,
                widgetType: GEPPETTO.Widgets.VARIABLEVISUALISER, stateless: isStateless
            });
            vv.help = function () {
                return GEPPETTO.CommandController.getObjectCommands(id);
            };
            this.widgets.push(vv);

            GEPPETTO.WidgetsListener.subscribe(this, id);

            //updates help command options
            GEPPETTO.CommandController.updateHelpCommand(vv, id, this.getFileComments("geppetto/js/components/widgets/variablevisualiser/VariableVisualiser.js"));
            //update tags for autocompletion
            GEPPETTO.CommandController.updateTags(vv.getId(), vv);
            return vv;
        },

        /**
         * Receives updates from widget listener class to update variable visualiser widget(s)
         *
         * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
         */
        update: function (event, parameters) {
            //delete a widget(s)
            if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
                this.removeWidgets();
            }
            //update widgets
            else if (event == GEPPETTO.Events.Experiment_update) {
                var step = parameters.step;
                for (var i = 0; i < this.widgets.length; i++) {
                    this.widgets[i].updateVariable(step);
                }
            }
        }
    });
});
