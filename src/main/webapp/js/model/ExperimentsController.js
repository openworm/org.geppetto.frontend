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
 * Factory class that figures out what kind of nodes to create with the updates received from the server. Creates the client nodes for entities, aspects, etc and updates them.
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {
    return function (GEPPETTO) {
        /**
         * @class GEPPETTO.ExperimentController
         */
        GEPPETTO.ExperimentsController =
        {

            /** Update the instances of this experiment given the experiment state */
            updateExperiment: function (experiment, experimentState) {
                var maxSteps = 0;
                for (var i = 0; i < experimentState.recordedVariables.length; i++) {
                    var recordedVariable = experimentState.recordedVariables[i];
                    if (recordedVariable.hasOwnProperty("value") && recordedVariable.value != undefined) {
                        var instancePath = this.getInstancePathFromPointer(recordedVariable.pointer, false);
                        var instance = Instances.getInstance(instancePath);

                        instance.setUnit(recordedVariable.value.unit);
                        instance.setTimeSeries(recordedVariable.value.value);
                        if (recordedVariable.value.value.length > maxSteps) {
                            maxSteps = recordedVariable.value.value.length;
                        }
                    }
                }
                experiment.maxSteps = maxSteps;
            },


            /** Plays the experiment */
            playExperiment: function (experiment) {

                if (!experiment.played) {
                    experiment.experimentUpdateWorker();
                }
                experiment.played = true;
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
                    if (element.hasOwnProperty("index")) {
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
