
/**
 * Listener class for widgets. Receives updates from Geppetto that need to be transmitted to all widgets.
 *
 * @author Jesus R Martinez (jesus@metacell.us)
 */
define(function (require) {

    var $ = require('jquery');

    return function (GEPPETTO) {

        /**
         * @exports Widgets/GEPPETTO.WidgetsListener
         */
        GEPPETTO.WidgetsListener = {

            /**
             * WIDGET_EVENT_TYPE
             *
             * Event types that tell widgets what to do
             *
             * @enum
             */
            WIDGET_EVENT_TYPE: {
                DELETE: "delete",
                UPDATE: "update",
                RESET_DATA: "reset",
                SELECTION_CHANGED: "select",
            },
            _subscribers: [],

            /**
             * Subscribes widget controller class to listener
             *
             * @param {Widgets/Controller} controller - Controller class to be subscribed to listener
             * @param {String} widgetID - ID of widget to register to global widgets listener
             */
            subscribe: function (controller, widgetID) {

                var addController = true;

                //traverse through existing subscribed controller to figure out whether to add new one or not
                for (var i = 0, len = this._subscribers.length; i < len; i++) {
                    if (this._subscribers[i] === controller) {
                        addController = false;
                    }
                }

                //subscribe controller only if it hasn't been already subscribed
                if (addController) {
                    this._subscribers.push(controller);

                    GEPPETTO.CommandController.log('added new observer', true);
                }

                var widgetSelector = $("#" + widgetID);

                //registers remove handler for widget
                widgetSelector.on("remove", function () {
                    //remove tags and delete object upon destroying widget
                    GEPPETTO.CommandController.removeCommands(widgetID);

                    var widgets = controller.getWidgets();
                    var componentType = controller.widgets[0].getComponentType();

                    for (var p in widgets) {
                        if (widgets[p].getId() == this.id) {
                            widgets.splice(p, 1);
                            break;
                        }
                    }

                    // remove from component factory dictionary
                    // NOTE: this will go away after widgets/components refactoring
                    var comps = GEPPETTO.ComponentFactory.getComponents()[componentType];
                    for(var c in comps){
                        if(comps[c].getId() == widgetID){
                            comps.splice(c, 1);
                            break;
                        }
                    }

                    GEPPETTO.trigger(GEPPETTO.Events.Component_destroyed, widgetID);
                });

                //register resize handler for widget
                widgetSelector.on("dialogresizestop", function (event, ui) {

                    var height = ui.size.height;
                    var width = ui.size.width;

                    GEPPETTO.CommandController.execute(widgetID + ".setSize(" + height + "," + width + ")", true);

                    var left = ui.position.left;
                    var top = ui.position.top;

                    window[widgetID].setPosition(left, top);
                });

                //register drag handler for widget
                widgetSelector.on("dialogdragstop", function (event, ui) {

                    var left = ui.position.left;
                    var top = ui.position.top;

                    GEPPETTO.CommandController.execute(widgetID + ".setPosition(" + left + "," + top + ")", true);
                });
            },

            /**
             * Unsubscribe widget controller class from lobal widgets listener
             *
             * @param {Widgets/Controller} controller - Controller class to be unsubscribed from listener
             *
             */
            unsubscribe: function (controller) {
                for (var i = 0, len = this._subscribers.length; i < len; i++) {
                    if (this._subscribers[i] === controller) {
                        this._subscribers.splice(i, 1);
                        return true;
                    }
                }
                return false;
            },

            /**
             * Update all subscribed controller classes with new changes
             *
             * @param {Object} arguments - Set arguments with information to update the widgets
             */
            update: function (event, parameters) {
                for (var i = 0, len = this._subscribers.length; i < len; i++) {
                    this._subscribers[i].update(event, parameters);
                }
            }
        };
    };
});
