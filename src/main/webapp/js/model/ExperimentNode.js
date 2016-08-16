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
 * Client class for Experiment node.
 *
 * @module model/ExperimentNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {

    return Backbone.Model.extend(
        {

            name: "",
            description: "",
            id: "",
            lastModified: "",
            status: null,
            parent: null,
            variables: null,
            parameters: null,
            script: "",

            /**
             * Initializes this experiment with passed attributes
             *
             * @param {Object}
             *            options - Object with options attributes to initialize node
             */
            initialize: function (options) {
                this.name = options.name;
                this.id = options.id;
                this.status = options.status;
                this.description = options.description;
                this.lastModified = options.lastModified;
                this.variables = [];
                this.simulatorConfigurations = {};
                this.parameters = [];
                this.script = options.script;
            },

            /**
             * Gets the name of the node
             *
             * @command ExperimentNode.getName()
             * @returns {String} Name of the node
             *
             */
            getName: function () {
                return this.name;
            },

            /**
             * Sets the name of the node
             *
             * @command ExperimentNode.setName()
             *
             */
            setDescription: function (newdescription) {
                this.saveExperimentProperties(
                    {
                        "description": newdescription
                    });
                this.description = newdescription;
            },

            /**
             * Gets the name of the node
             *
             * @command ExperimentNode.getName()
             * @returns {String} Name of the node
             *
             */
            getDescription: function () {
                return this.description;
            },

            /**
             * Gets the name of the node
             *
             * @command ExperimentNode.getLastModified()
             * @returns {String} The time and date of when the experiment was modified last
             *
             */
            getLastModified: function () {
                return this.lastModified;
            },

            /**
             * Gets the script associated with this expeirment
             *
             * @command ExperimentNode.getScript()
             * @returns {String} The script associated with this experiment
             *
             */
            getScript: function () {
                return this.script;
            },

            /**
             * Sets the script of the node
             *
             * @command ExperimentNode.setScript()
             *
             */
            setScript: function (script) {
                this.saveExperimentProperties(
                    {
                        "script": script
                    });
                this.script = script;
            },

            /**
             * Sets the name of the node
             *
             * @command ExperimentNode.setName()
             *
             */
            setName: function (newname) {
                this.saveExperimentProperties(
                    {
                        "name": newname
                    });
                this.name = newname;
            },

            /**
             * Get the id associated with node
             *
             * @command ExperimentNode.getId()
             * @returns {String} ID of node
             */
            getId: function () {
                return this.id;
            },

            setParent: function (parent) {
                this.parent = parent;
            },

            getParent: function () {
                return this.parent;
            },

            /**
             * Get current status of this experiment
             *
             * @command ExperimentNode.getStatus()
             * @returns {String} Status of experiment
             */
            getStatus: function () {
                return this.status;
            },

            setStatus: function (status) {
                this.status = status;
            },

            /**
             * Run experiment
             *
             * @command ExperimentNode.run()
             */
            run: function () {
                if (this.status == GEPPETTO.Resources.ExperimentStatus.DESIGN) {
                    GEPPETTO.trigger(Events.Experiment_running);
                    var parameters =
                    {};
                    parameters["experimentId"] = this.id;
                    parameters["projectId"] = this.getParent().getId();
                    GEPPETTO.MessageSocket.send("run_experiment", parameters);
                }
            },

            /**
             * Sets experiment status to active
             *
             * @command ExperimentNode.run()
             */
            setActive: function () {
            	GEPPETTO.ExperimentsController.setActive(this);
            },

            /**
             * Play experiment. Takes a JS object as parameter where two options can be set, but not together: steps or playAll.
             * If experiment is to be play all at once: {playAll : true} If experiment is
             * to be played by timeSteps: {steps : 1} where the value can be something else than 1.
             *
             * @command ExperimentNode.play()
             */
            play: function (options) {

                GEPPETTO.ExperimentsController.play(this, options);

            },

            playAll: function () {
                this.play(
                    {
                        playAll: true
                    });
            },

            pause: function () {
                GEPPETTO.ExperimentsController.pause();
                return this;
            },

            stop: function () {
                GEPPETTO.ExperimentsController.stop();
                return this;
            },

            resume: function () {
                GEPPETTO.ExperimentsController.resume();
                return this;
            },


            saveExperimentProperties: function (properties) {
                var parameters =
                {};
                parameters["experimentId"] = this.id;
                parameters["projectId"] = this.getParent().getId();
                parameters["properties"] = properties;
                GEPPETTO.MessageSocket.send("save_experiment_properties", parameters);
            },


            /**
             * Gets the watched variables for this experiment.
             *
             * @command ExperimentNode.getWatchedVariables(asObjs)
             * @returns {List<String>} - List of watched variables for given name
             */
            getWatchedVariables: function (asObjs, time) {
                if (asObjs === undefined) {
                    asObjs = false;
                }
                if (time === undefined) {
                    time = true;
                }

                var watchedVariables = [];
                if (asObjs) {
                    watchedVariables = GEPPETTO.ModelFactory.instances.getInstance(this.variables);
                    if (!$.isArray(watchedVariables)) {
                        //we always want it to be an array
                        watchedVariables = [watchedVariables];
                    }
                    if (!time) {
                        var timeIndex = -1;
                        for (var i = 0; i < watchedVariables.length; i++) {
                            if (watchedVariables[i].getId() == "time") {
                                //TODO Check also if it's a root variable, there might be another time variable somewhere in the tree
                                timeIndex = i;
                                break;
                            }
                        }
                        if (timeIndex != -1) {
                            watchedVariables.splice(timeIndex, 1); //we remove the time variable
                        }
                    }
                } else {
                    watchedVariables = this.variables;
                }

                return watchedVariables;
            },


            /**
             * Download results for recording file
             *
             * @command ExperimentNode.downloadResults(recording)
             */
            downloadResults: function (aspectPath, format) {
                if (this == window.Project.getActiveExperiment()) {
                    if (this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                        var parameters =
                        {};
                        parameters["format"] = format;
                        parameters["aspectPath"] = aspectPath;
                        parameters["experimentId"] = this.id;
                        parameters["projectId"] = this.getParent().getId();
                        GEPPETTO.MessageSocket.send("download_results", parameters);

                        return "Sending request to download results.";
                    } else {
                        return "Experiment must be completed before attempting to download results";
                    }
                } else {
                    return "Experiment must be set to active before requesting results";
                }
            },

            /**
             * Clones and experiment
             *
             * @command ExperimentNode.clone()
             * @returns {ExperimentNode} Creates a new ExperimentNode
             */
            clone: function () {
                var parameters = {};
                parameters["projectId"] = this.getParent().getId();
                parameters["experimentId"] = this.id;
                GEPPETTO.MessageSocket.send("clone_experiment", parameters);
            },
            
            deleteExperiment: function () {
                var parameters =
                {};
                parameters["experimentId"] = this.id;
                parameters["projectId"] = this.getParent().getId();
                GEPPETTO.MessageSocket.send("delete_experiment", parameters);

                return this;
            },

            uploadModel: function (aspectPath, format) {
                if (this == window.Project.getActiveExperiment()) {
                    if (this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                        var parameters =
                        {};
                        parameters["format"] = format;
                        parameters["aspectPath"] = aspectPath;
                        parameters["experimentId"] = this.id;
                        parameters["projectId"] = this.getParent().getId();
                        GEPPETTO.MessageSocket.send("upload_model", parameters);

                        return "Sending request to upload results.";
                    } else {
                        return "Unable to upload model for an experimet that hasn't been completed";
                    }
                } else {
                    return "Experiment isn't active, make it active before continuing upload";
                }
            },

            uploadResults: function (aspectPath, format) {
                if (this == window.Project.getActiveExperiment()) {
                    if (this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                        var parameters =
                        {};
                        parameters["format"] = format;
                        parameters["aspectPath"] = aspectPath;
                        parameters["experimentId"] = this.id;
                        parameters["projectId"] = this.getParent().getId();
                        GEPPETTO.MessageSocket.send("upload_results", parameters);

                        return "Sending request to upload results.";
                    } else {
                        return GEPPETTO.Resources.EXPERIMENT_NOT_COMPLETED_UPLOAD;
                    }
                } else {
                    return GEPPETTO.Resources.UNACTIVE_EXPERIMENT_UPLOAD;
                }
            },

            /**
             * Print out formatted node
             */
            print: function () {
                return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n";
            },

            addSimulatorConfiguration: function (aspect, simulatorConfiguration) {
                this.simulatorConfigurations[aspect] = simulatorConfiguration;
            }

        });
});
