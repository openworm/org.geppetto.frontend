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
 *
 * @module Widgets/WIDGETNAME
 * @author yourname
 */
define(function (require) {

    var Widget = require('widgets/Widget');
    var $ = require('jquery');

    return Widget.View
        .extend({
            variable: null,
            options: null,

            /**
             * Initialises button bar
             *
             * @param {Object}
             *            options - Object with options for the widget
             */
            /**
             * Initialize the popup widget
             */
            initialize: function (options) {
                Widget.View.prototype.initialize.call(this, options);
                this.render();
                this.setSize(100, 300);
                this.customHandlers = [];

                //in case you need some styling add it to the CSS $("#" + this.id).addClass("yourStyle");

            },


            /**
             * Sets the content of this widget
             * This is a sample method of the widget's API, in this case the user would use the widget by passing an instance to a setData method
             * Customise/remove/add more depending on what widget you are creating
             *
             * @command setData(anyInstance)
             * @param {Object} anyInstance - An instance of any type
             */
            setData: function (anyInstance) {
                this.controller.addToHistory(anyInstance.getName(),"setData",[anyInstance]);

                return this;
            },

        });
});
