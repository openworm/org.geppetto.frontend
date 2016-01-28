/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
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
 * UI flows controller
 *
 *  @author Giovanni Idili
 */
define(function (require) {

    return function (GEPPETTO) {

        $ = require('jquery');

        /**
         * Create the container for holding the canvas
         *
         * @class GEPPETTO.Flows
         */
        GEPPETTO.Flows =
        {
            // any variables here
            whatever: null,

            /*
             * Handles flow on run experiment
             */
            onRun: function (callbackCommand) {
                // TODO: check if anything is being recorded
                // TODO: if not, bring up spotlight configured with following suggestions:
                // - Record all state variables
                // - Record all state variables within types (show all grouping options)
                // TODO: after spotlight selection execute run ==> pass to spotlight as a callback
            },

            /*
             * Handles flow on play recording
             */
            onPlay: function (callbackCommand) {
                // TODO: check if a plot is already up or light up functions are set
                // TODO: if not, bring up spotlight configured with following suggestions:
                // - Plot all recorded variables
                // TODO: after spotlight selection is picked execute play ==> pass to spotlight as a callback

                // NOTE: what happens on step by step play, the same?
            },
        };

    };
});
