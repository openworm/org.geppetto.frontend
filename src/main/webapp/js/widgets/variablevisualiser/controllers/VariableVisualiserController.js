/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2014 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/
/**
 * Controller class for variables visualiser widget.
 *
 * @author Dan Kruchinin (dkruchinin@acm.org)
 */
define(function (require) {

    var AWidgetController = require('widgets/AWidgetController');
    var VarVis = require('widgets/variablevisualiser/VariableVisualiser');

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
        addVariableVisualiserWidget: function () {
            //look for a name and id for the new widget
            var id = this.getAvailableWidgetId("VarVis", this.widgets);
            var name = id;
            var vv = window[name] = new VarVis({id: id, name: name, visible: true});
            vv.help = function () {
                return GEPPETTO.Console.getObjectCommands(id);
            };
            this.widgets.push(vv);

            GEPPETTO.WidgetsListener.subscribe(this, id);

            //updates help command options
            GEPPETTO.Console.updateHelpCommand(vv, id, this.getFileComments("geppetto/js/widgets/variablevisualiser/VariableVisualiser.js"));
            //update tags for autocompletion
            GEPPETTO.Console.updateTags(vv.getId(), vv);
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
            else if (event == Events.Experiment_update) {
                var step = parameters.step;
                for (var i = 0; i < this.widgets.length; i++) {
                    this.widgets[i].updateVariable(step);
                }
            }
        }
    });
});
