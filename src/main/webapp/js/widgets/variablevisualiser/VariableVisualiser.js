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
 * Variable visualiser Widget class
 * @module Widgets/VariableVisualiser
 * @author Dan Kruchinin (dkruchinin@acm.org)
 */
define(function (require) {

    var Widget = require('widgets/Widget');
    var $ = require('jquery');

    return Widget.View.extend({
        root: null,
        variable: null,
        options: null,
        default_width: 350,
        default_height: 120,

        /**
         * Initialises viriables visualiser with a set of options
         *
         * @param {Object} options - Object with options for the widget
         */
        initialize: function (options) {
            this.id = options.id;
            this.name = options.name;
            this.options = options;

            if (!('width' in options)) {
                options.width = this.default_width;
            }
            if (!('height' in options)) {
                options.height = this.default_height;
            }

            this.render();
            this.setSize(options.height, options.width);
            this.dialog.append("<div class='varvis_header'></div><div class='varvis_body'></div>");
        },

        /**
         * Takes time series data and shows it as a floating point variable changing in time.
         *
         * @command addVariable(state, options)
         * @param {Object} state - time series data (a geppetto simulation variable)
         * @param {Object} options - options for the plotting widget, if null uses default
         */
        setVariable: function (state, options) {
            this.variable = {
                name: state.getInstancePath(),
                state: state
            };

            if (this.root == null) {
                this.root = $("#" + this.id)
            }

            this.setHeader(this.variable.name);
            this.updateVariable(0, false);
            return "Variable visualisation added to widget";
        },


        /**
         * Clear variable
         *
         * @command removeVariable(state)
         *
         * @param {Object} state - geppetto similation variable to remove
         */
        clearVariable: function () {
    		if (this.variable == null) {
    			return;
    		}

    		this.variable = null;
    		this.setHeader("");
    		this.setBody("");
        },

        /**
         * Updates variable values
         */
        updateVariable: function (step) {
			if (typeof step != 'undefined' && (this.variable.state.getTimeSeries()!=null || undefined)) {
				if(this.variable.state.getTimeSeries().length>step){
					this.setBody(this.variable.state.getTimeSeries()[step].toFixed(4) + this.variable.state.getUnit());
				}
			}
 
        },

        /**
         * Change name of the variable (if there's one)
         *
         * @param newName - the new name
         */
        renameVariable: function (newName) {
            if (this.variable != null) {
                this.variable.name = newName;
                this.setHeader(newName);
            }
        },


        /**
         * @private
         */
        setHeader: function (content) {
            this.getSelector("varvis_header").html(content);
        },

        /**
         * @private
         */
        setBody: function (content) {
            this.getSelector("varvis_body").html(content);
        },

        /**
         * @private
         */
        getSelector: function (name) {
            return $(this.root.selector + " ." + name);
        }
    });
});
