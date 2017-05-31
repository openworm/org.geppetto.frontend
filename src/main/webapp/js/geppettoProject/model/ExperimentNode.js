/**
 * Client class for Experiment node.
 *
 * @module model/ExperimentNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(['backbone'], function(require) {

    return Backbone.Model.extend({
        name: "",
        description: "",
        details: "",
        id: "",
        lastModified: "",
        status: null,
        parent: null,
        variables: null,
        parameters: null,
        script: "",
        view: {},
        writePermission: null,
        login: null,
        runPermission: null,
        downloadPermission: null,
        state: null,

        /**
         * Initializes this experiment with passed attributes
         *
         * @param {Object}
         *            options - Object with options attributes to initialize node
         */
        initialize: function(options) {
            this.name = options.name;
            this.id = options.id;
            this.status = options.status;
            this.description = options.description;
            this.details = options.details;
            this.lastModified = options.lastModified;
            this.variables = [];
            this.setParameters = {};
            this.simulatorConfigurations = {};
            this.parameters = [];
            this.script = options.script;
            this.state = null;
            this.writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
            this.login = GEPPETTO.UserController.isLoggedIn();
            this.runPermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.RUN_EXPERIMENT);
            this.downloadPermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.DOWNLOAD);
        },

        /**
         * Gets the name of the node
         *
         * @command ExperimentNode.getName()
         * @returns {String} Name of the node
         *
         */
        getName: function() {
            return this.name;
        },

        /**
         * Gets error details with this experiment
         *
         * @command ExperimentNode.getDetails()
         * @returns {String} Error while running experiment
         *
         */
        getDetails: function() {
            return this.details;
        },

        setDetails: function(details) {
            this.details = details;
        },

        /**
         * Sets the name of the node
         *
         * @command ExperimentNode.setName()
         *
         */
        setDescription: function(newdescription) {
            if (this.writePermission && this.getParent().persisted && this.login) {
                this.saveExperimentProperties({
                    "description": newdescription
                });
                this.description = newdescription;
            } else {
                return GEPPETTO.Utility.persistedAndWriteMessage(this);
            }
        },

        /**
         * Gets the name of the node
         *
         * @command ExperimentNode.getName()
         * @returns {String} Name of the node
         *
         */
        getDescription: function() {
            return this.description;
        },

        /**
         * Gets the name of the node
         *
         * @command ExperimentNode.getLastModified()
         * @returns {String} The time and date of when the experiment was modified last
         *
         */
        getLastModified: function() {
            return this.lastModified;
        },

        /**
         * Gets the script associated with this expeirment
         *
         * @command ExperimentNode.getScript()
         * @returns {String} The script associated with this experiment
         *
         */
        getScript: function() {
            return this.script;
        },

        /**
         * Sets the script of the node
         *
         * @command ExperimentNode.setScript()
         *
         */
        setScript: function(script) {
            if (this.writePermission && this.getParent().persisted && this.login) {
                this.saveExperimentProperties({
                    "script": script
                });
                this.script = script;
            } else {
                return GEPPETTO.Utility.persistedAndWriteMessage(this);
            }
        },

        /**
         * Sets the name of the node
         *
         * @command ExperimentNode.setName()
         *
         */
        setName: function(newname) {
            if (this.writePermission && this.getParent().persisted && this.login) {
                this.saveExperimentProperties({
                    "name": newname
                });
                this.name = newname;
                GEPPETTO.trigger(GEPPETTO.Events.Experiment_renamed);
            } else {
                return GEPPETTO.Utility.persistedAndWriteMessage(this);
            }
        },

        /**
         * Get the id associated with node
         *
         * @command ExperimentNode.getId()
         * @returns {String} ID of node
         */
        getId: function() {
            return this.id;
        },

        setParent: function(parent) {
            this.parent = parent;
        },

        getParent: function() {
            return this.parent;
        },

        /**
         * Get current status of this experiment
         *
         * @command ExperimentNode.getStatus()
         * @returns {String} Status of experiment
         */
        getStatus: function() {
            return this.status;
        },

        setStatus: function(status) {
            this.status = status;
        },

        /**
         * Run experiment
         *
         * @command ExperimentNode.run()
         */
        run: function(callback) {
            if (this.writePermission && this.getParent().persisted && this.login && this.runPermission && !this.getParent().isReadOnly()) {
                if (this.status == GEPPETTO.Resources.ExperimentStatus.DESIGN ||  this.status == GEPPETTO.Resources.ExperimentStatus.ERROR) {

                    this.setStatus(GEPPETTO.Resources.ExperimentStatus.QUEUED);
                    GEPPETTO.trigger(GEPPETTO.Events.Experiment_running);
                    var parameters = {};
                    parameters["experimentId"] = this.id;
                    parameters["projectId"] = this.getParent().getId();
                    GEPPETTO.MessageSocket.send("run_experiment", parameters, callback);
                }
            } else {
                var message = GEPPETTO.Utility.persistedAndWriteMessage(this);
                if (!this.runPermission) {
                    message = message + " and " + GEPPETTO.Resources.RUN_PRIVILEGES_NOT_SUPPORTED;
                }
                return message;
            }
        },

        /**
         * Sets experiment status to active
         *
         * @command ExperimentNode.run()
         */
        setActive: function() {
            GEPPETTO.ExperimentsController.setActive(this);
        },

        /**
         * Play experiment. Takes a JS object as parameter where two options can be set, but not together: steps or playAll.
         * If experiment is to be play all at once: {playAll : true} If experiment is
         * to be played by timeSteps: {steps : 1} where the value can be something else than 1.
         *
         * @command ExperimentNode.play()
         */
        play: function(options) {
            var activeExperiment = window.Project.getActiveExperiment();
            if (activeExperiment != null || undefined) {
                if (activeExperiment.getId() == this.getId()) {
                    GEPPETTO.ExperimentsController.play(this, options);
                } else {
                    return GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + "Can't play experiment that isn't active";
                }
            }

        },

        playAll: function() {
            var activeExperiment = window.Project.getActiveExperiment();
            if (activeExperiment != null || undefined) {
                if (activeExperiment.getId() == this.getId()) {
                    this.play({
                        playAll: true
                    });
                } else {
                    return GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + "Can't play experiment that isn't active";
                }
            }
        },

        pause: function() {
            var activeExperiment = window.Project.getActiveExperiment();
            if (activeExperiment != null || undefined) {
                if (activeExperiment.getId() == this.getId()) {
                    GEPPETTO.ExperimentsController.pause();
                    return this;
                } else {
                    return GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + "Can't pause experiment that isn't active";
                }
            }
        },

        stop: function() {
            var activeExperiment = window.Project.getActiveExperiment();
            if (activeExperiment != null || undefined) {
                if (activeExperiment.getId() == this.getId()) {
                    GEPPETTO.ExperimentsController.stop();
                    return this;
                } else {
                    return GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + "Can't stop experiment that isn't active";
                }
            }
        },

        resume: function() {
            var activeExperiment = window.Project.getActiveExperiment();
            if (activeExperiment != null || undefined) {
                if (activeExperiment.getId() == this.getId()) {
                    GEPPETTO.ExperimentsController.resume();
                    return this;
                } else {
                    return GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + "Can't resume experiment that isn't active";
                }
            }
        },


        saveExperimentProperties: function(properties) {
            if (this.writePermission && this.getParent().persisted && this.login && !this.getParent().isReadOnly()) {
                var parameters = {};
                parameters["experimentId"] = this.id;
                parameters["projectId"] = this.getParent().getId();
                parameters["properties"] = properties;
                GEPPETTO.MessageSocket.send("save_experiment_properties", parameters);
            } else {
                return GEPPETTO.Utility.persistedAndWriteMessage(this);
            }
        },


        /**
         * Gets the watched variables for this experiment.
         *
         * @command ExperimentNode.getWatchedVariables(asObjs)
         * @returns {List<String>} - List of watched variables for given name
         */
        getWatchedVariables: function(asObjs, time) {
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

        getSetParameters: function() {
            return this.setParameters;
        },

        /**
         * Download results Ffor recording file
         *
         * @command ExperimentNode.downloadResults(recording)
         */
        downloadResults: function(aspectPath, format) {
            if (this.downloadPermission && this.login) {
                if (this == window.Project.getActiveExperiment()) {
                    if (this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                        var parameters = {};
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
            } else {
                var message = GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + GEPPETTO.Resources.USER_NOT_LOGIN;
                if (!this.login) {
                    return message;
                } else {
                    message = GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + GEPPETTO.Resources.DOWNLOAD_PRIVILEGES_NOT_SUPPORTED;
                }

                return message;
            }
        },

        /**
         * Clones and experiment
         *
         * @command ExperimentNode.clone()
         * @returns {ExperimentNode} Creates a new ExperimentNode
         */
        clone: function(callback) {
            if (this.writePermission && this.getParent().persisted && this.login && !this.getParent().isReadOnly()) {
                var parameters = {};
                parameters["projectId"] = this.getParent().getId();
                parameters["experimentId"] = this.id;
                GEPPETTO.MessageSocket.send("clone_experiment", parameters, callback);
            } else {
                return GEPPETTO.Utility.persistedAndWriteMessage(this);
            }
        },

        deleteExperiment: function(callback) {
            if (this.writePermission && this.getParent().persisted && this.login) {
                var parameters = {};
                parameters["experimentId"] = this.id;
                parameters["projectId"] = this.getParent().getId();
                GEPPETTO.MessageSocket.send("delete_experiment", parameters, callback);

                return this;
            } else {
                return GEPPETTO.Utility.persistedAndWriteMessage(this);
            }
        },

        uploadModel: function(aspectPath, format) {
            if (this.writePermission && this.getParent().persisted && this.login) {
                if (this == window.Project.getActiveExperiment()) {
                    if (this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                        var parameters = {};
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
            } else {
                return GEPPETTO.Utility.persistedAndWriteMessage(this);
            }
        },

        uploadResults: function(aspectPath, format) {
            if (this.writePermission && this.getParent().persisted && this.login) {
                if (this == window.Project.getActiveExperiment()) {
                    if (this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                        var parameters = {};
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
            } else {
                return GEPPETTO.Utility.persistedAndWriteMessage(this);
            }
        },

        /**
         * Set experiment view
         *
         * @param view
         */
        setView: function(view){
            this.set('view', JSON.stringify(view));
            GEPPETTO.ExperimentsController.setView(view);
        },

        /**
         * Gets experiment view
         *
         * @returns {exports.view|{}}
         */
        getView: function(){
            var viewObject = this.get('view');
            var views = undefined;

            if(viewObject != undefined){
                views = JSON.parse(viewObject);
            }

            return views;
        },

        /**
         * Print out formatted node
         */
        print: function() {
            return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n";
        },

        addSimulatorConfiguration: function(aspect, simulatorConfiguration) {
            this.simulatorConfigurations[aspect] = simulatorConfiguration;
        }

    });
});