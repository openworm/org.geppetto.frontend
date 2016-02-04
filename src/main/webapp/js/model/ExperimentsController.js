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
 * Controller responsible to manage the experiments
 *
 * @author Matteo Cantarelli
 */
define(function (require) {
    return function (GEPPETTO) {
        /**
         * @class GEPPETTO.ExperimentController
         */
        GEPPETTO.ExperimentsController =
        {

            playExperimentReady: false,
            worker: null,
            playOptions: {},
            maxSteps: 0,
            paused: false,


            /** Update the instances of this experiment given the experiment state */
            updateExperiment: function (experiment, experimentState) {
                this.playExperimentReady = false; //we reset
                this.maxSteps = 0;
                for (var i = 0; i < experimentState.recordedVariables.length; i++) {
                    var recordedVariable = experimentState.recordedVariables[i];
                    var instancePath = this.getInstancePathFromPointer(recordedVariable.pointer, false);
                    var instance = Instances.getInstance(instancePath);
                    if (recordedVariable.hasOwnProperty("value") && recordedVariable.value != undefined) {
                        //if at least one of the varialbes has a value we consider the experiment as ready to be played
                        this.playExperimentReady = true;
                        if (recordedVariable.value.unit && recordedVariable.value.unit.unit) {
                            instance.setUnit(recordedVariable.value.unit.unit);
                        }
                        instance.setTimeSeries(recordedVariable.value.value);
                        if (recordedVariable.value.value.length > this.maxSteps) {
                            this.maxSteps = recordedVariable.value.value.length;
                        }
                    }
                }

                if (this.playExperimentReady) {
                    //creation of the worker will trigger the event for the listening widgets
                    //to update themselves
                    this.triggerPlayExperiment(experiment);
                }
            },

            play: function (experiment, options) {
                // set options
                if (options != undefined) {
                    this.playOptions = options;
                } else {
                    this.playOptions =
                    {
                        step: 1
                    };
                }
                if (experiment.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {

                    if (!this.playExperimentReady) {
                        var parameters = {};
                        parameters["experimentId"] = experiment.id;
                        parameters["projectId"] = experiment.getParent().getId();
                        //sending to the server request for data
                        GEPPETTO.MessageSocket.send("play_experiment", parameters);
                        return "Play Experiment";
                    } else {
                        this.triggerPlayExperiment();
                        return "Play Experiment";
                    }

                } else {
                    GEPPETTO.FE.infoDialog(GEPPETTO.Resources.CANT_PLAY_EXPERIMENT, "Experiment " + experiment.name + " with id " + experiment.id + " isn't completed, and can't be played.");
                }
            },

            pause: function () {
                this.paused = true;
                this.getWorker().postMessage([Events.Experiment_pause]);
                GEPPETTO.trigger(Events.Experiment_pause);
            },

            isPaused: function () {
                return this.paused;
            },

            resume: function () {
                //we'll use a worker
                if (this.paused) {
                    GEPPETTO.ExperimentsController.getWorker().postMessage([Events.Experiment_resume]);
                    GEPPETTO.trigger(Events.Experiment_resume);
                    this.paused = false;
                    return "Pause Experiment";
                }
            },

            stop: function () {
                this.terminateWorker();
                this.paused = false;
                GEPPETTO.trigger(Events.Experiment_stop);
            },

            closeCurrentExperiment:function(){
                var experiment=Project.getActiveExperiment();
                if(experiment){
                    //we clear all the listeners
                    GEPPETTO.G.listeners=[];
                }

                // clean instance tree state
                GEPPETTO.ModelFactory.cleanupInstanceTreeState();
            },

            triggerPlayExperiment: function (experiment) {

                GEPPETTO.trigger(Events.Experiment_play, {playAll: this.playOptions.playAll});

                if (this.playOptions.playAll) {
                    if (this.paused) {
                        this.stop();
                    }
                    GEPPETTO.ExperimentsController.terminateWorker();
                    GEPPETTO.trigger(Events.Experiment_update, {step: this.maxSteps-1});
                    GEPPETTO.trigger(Events.Experiment_stop);
                }
                else {

                    if (this.playOptions.step == null || undefined) {
                        this.playOptions.step = 0;
                    }

                    // create web worker
                    this.worker = new Worker("geppetto/js/ExperimentWorker.js");

                    // tells worker to update each half a second
                    this.worker.postMessage([Events.Experiment_play, GEPPETTO.getVARS().playTimerStep, this.playOptions.step]);

                    // receives message from web worker
                    this.worker.onmessage = function (event) {
                        // get current timeSteps to execute from web worker
                        var currentStep = event.data[0];

                        if (currentStep >= this.maxSteps) {
                            this.postMessage(["experiment:loop"]);
                        } else {
                            GEPPETTO.trigger(Events.Experiment_update, {step: currentStep});
                        }
                        this.postMessage(["experiment:lastStepConsumed"]);
                    }


                }
                ;
            },

            terminateWorker: function () {
                if (this.worker != undefined) {
                    this.worker.terminate();
                    this.worker = undefined;
                }
            },

            getWorker: function () {
                return this.worker;
            },


            /** Retrieves the instance path of a given pointer */
            getInstancePathFromPointer: function (pointer, types) {
                var instancePath = "";
                for (var e = 0; e < pointer.elements.length; e++) {
                    var element = pointer.elements[e];
                    var resolvedVar = GEPPETTO.ModelFactory.resolve(element.variable.$ref);
                    var resolvedType = GEPPETTO.ModelFactory.resolve(element.type.$ref);
                    instancePath += resolvedVar.getId();
                    if (types) {
                        instancePath += "(" + resolvedType.getId() + ")";
                    }
                    if (element.hasOwnProperty("index") && element.index > -1) {
                        instancePath += "[" + element.index + "]";
                    }
                    if (e < pointer.elements.length - 1) {
                        instancePath += ".";
                    }
                }
                return instancePath;
            }


        }
    }


});
