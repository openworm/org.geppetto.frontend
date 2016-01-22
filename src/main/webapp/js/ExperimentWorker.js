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
 * Web worker for counting steps
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
var lastExecutedStep = 0;
var isPaused = false;
var play = false;
var lastStepConsumed = true;
var step = 1;


onmessage = function (e) {
    if (e.data[0] == "experiment:pause") {
        isPaused = true;
    } else if (e.data[0] == "experiment:resume") {
        isPaused = false;
    } else if (e.data[0] == "experiment:lastStepConsumed") {
        lastStepConsumed = true;
    } else if (e.data[0] == "experiment:loop") {
        lastExecutedStep = 0;
        postMessage([lastExecutedStep, step]);
    } else if (e.data[0] == "experiment:play") {
        play = true;
        var timer = e.data[1];
        step = e.data[2];

        setInterval(function () {
            if (!isPaused && lastStepConsumed) {
                lastExecutedStep = lastExecutedStep + step;
                //console.log("New step "+lastExecutedStep+" now triggering the event");
                postMessage([lastExecutedStep]);
                lastStepConsumed = false;
            }
        }, timer);
    }
};