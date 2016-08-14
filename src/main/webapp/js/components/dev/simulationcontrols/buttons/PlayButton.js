/*******************************************************************************
 *
 * Copyright (c) 2011, 2016 OpenWorm.
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

define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('mixins/TutorialMixin'), require('mixins/Button')],

        popoverTitle: 'Play Experiment',

        popoverContent: "Once you have loaded a simulation, it's time to see it in action by pressing Start. Click it now to see the simulation in action",

        componentDidMount: function () {
            GEPPETTO.on('start:tutorial', (function () {
                GEPPETTO.once('experiment:loaded', (function () {
                    if (GEPPETTO.tutorialEnabled) {
                        this.showPopover;
                    }
                }).bind(this));
            }).bind(this));
        },

        getDefaultProps: function () {
            return {
                label: 'Play',
                className: 'pull-right',
                icon: 'fa fa-play',
                onClick: function () {

                    if (GEPPETTO.ExperimentsController.isPaused()) {
                        GEPPETTO.Console.executeCommand("Project.getActiveExperiment().resume();");
                    }
                    else {
                        if (GEPPETTO.isKeyPressed("shift")) {
                            GEPPETTO.Flows.onPlay("Project.getActiveExperiment().play();");
                        }
                        else {
                            GEPPETTO.Flows.onPlay("Project.getActiveExperiment().playAll();");
                        }
                    }

                }
            };
        }

    });
});