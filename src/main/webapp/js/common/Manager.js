/**
 * Client class use to handle Geppetto workflows
 *
 * @module Manager
 * @author Matteo Cantarelli
 */
define(function (require) {


    function Manager(options) {

    }

    Manager.prototype = {

        constructor: Manager,

        /**
         *
         * @param payload
         */
        persistProject: function (projectID, activeExperimentID) {
            window.Project.id = parseInt(projectID);
            if (window.Project.getActiveExperiment() != null || undefined) {
                var oldActiveExperiment = window.Project.getActiveExperiment().id;
                window.Project.getActiveExperiment().id = parseInt(activeExperimentID);
            }
            window.Project.persisted = true;
            window.Project.readOnly = false;

            GEPPETTO.trigger(GEPPETTO.Events.Project_persisted);
            GEPPETTO.CommandController.log("The project has been persisted  [id=" + projectID + "].");
        },

        /**
         *
         * @param payload
         */
        loadProject: function (project, persisted) {
            // we remove anything from any previous loaded project if there was one
            GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.LOADING_PROJECT);
            if (Project) {
                Project.initialize();
            }
            GEPPETTO.G.listeners = [];

            window.Project = GEPPETTO.ProjectFactory.createProjectNode(project, persisted);
            window.Project.readOnly = !persisted;

            GEPPETTO.trigger(GEPPETTO.Events.Project_loaded);
            GEPPETTO.CommandController.log(GEPPETTO.Resources.PROJECT_LOADED);
        },

        /**
         *
         * @param payload
         */
        loadModel: function (model) {


            console.timeEnd(GEPPETTO.Resources.PARSING_MODEL);

            console.time(GEPPETTO.Resources.CREATING_MODEL);
            GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.CREATING_MODEL);
            // build Geppetto model here (once off operation when project is loaded)
            window.Model = GEPPETTO.ModelFactory.createGeppettoModel(model, true, true);
            console.timeEnd(GEPPETTO.Resources.CREATING_MODEL);

            console.time(GEPPETTO.Resources.CREATING_INSTANCES);
            GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.CREATING_INSTANCES);
            // build instance tree here (instance tree will be populated with state info for each experiment)
            window.Instances = GEPPETTO.ModelFactory.createInstances(window.Model);
            this.augmentInstancesArray(window.Instances);
            console.timeEnd(GEPPETTO.Resources.CREATING_INSTANCES);

            GEPPETTO.trigger(GEPPETTO.Events.Model_loaded);
            GEPPETTO.CommandController.log(GEPPETTO.Resources.MODEL_LOADED);

            // populate control panel with instances
            GEPPETTO.trigger(GEPPETTO.Events.Instances_created, window.Instances);

            console.timeEnd(GEPPETTO.Resources.LOADING_PROJECT);
            GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
        },

        /**
         * Fetch variable
         *
         * @param variableId
         * @param datasourceId
         */
        fetchVariable: function (variableId, datasourceId, callback) {
            if (!window.Model.hasOwnProperty(variableId)) {
                var params = {};
                params["projectId"] = Project.getId();
                params["variableId"] = variableId;
                params["dataSourceId"] = datasourceId;

                var requestID = GEPPETTO.MessageSocket.send("fetch_variable", params, callback);

                GEPPETTO.trigger('spin_logo');

            } else {
                GEPPETTO.CommandController.log(GEPPETTO.Resources.VARIABLE_ALREADY_EXISTS);
                // the variable already exists, run the callback
                callback();
            }
        },

        /**
         * Adds fetched variable to model
         *
         * @param rawModel
         */
        addVariableToModel: function (rawModel) {
            console.time(GEPPETTO.Resources.ADDING_VARIABLE);
            // STEP 1: merge model - expect a fully formed Geppetto model to be merged into current one
            var diffReport = GEPPETTO.ModelFactory.mergeModel(rawModel);
            // STEP 2: add new instances for new variables if any
            var newInstances = GEPPETTO.ModelFactory.createInstancesFromDiffReport(diffReport);
            // STEP: 3 update components
            GEPPETTO.trigger(GEPPETTO.Events.Instances_created, newInstances);
            console.timeEnd(GEPPETTO.Resources.ADDING_VARIABLE);
            GEPPETTO.CommandController.log(GEPPETTO.Resources.VARIABLE_ADDED);
        },

        /**
         * Resolve import type
         *
         * @param typePath
         */
        resolveImportType: function (typePaths, callback) {
            if (typeof typePaths == "string") {
                typePaths = [typePaths];
            }
            var params = {};
            params["projectId"] = Project.getId();
            // replace client naming first occurrence - the server doesn't know about it
            var paths = [];
            for (var i = 0; i < typePaths.length; i++) {
                paths.push(typePaths[i].replace(GEPPETTO.Resources.MODEL_PREFIX_CLIENT + ".", ''));
            }
            params["paths"] = paths;

            var requestID = GEPPETTO.MessageSocket.send("resolve_import_type", params, callback);

            GEPPETTO.trigger('spin_logo');
        },

        /**
         * Swap resolved import type with actual type
         *
         * @param rawModel
         */
        swapResolvedType: function (rawModel) {
            console.time(GEPPETTO.Resources.IMPORT_TYPE_RESOLVED);
            
            // STEP 1: merge model - expect a fully formed Geppetto model to be merged into current one
            var diffReport = GEPPETTO.ModelFactory.mergeModel(rawModel, true);
            // STEP 2: add new instances for new types if any
            var newInstances = GEPPETTO.ModelFactory.createInstancesFromDiffReport(diffReport);
            // STEP: 3 update components
            GEPPETTO.trigger(GEPPETTO.Events.Instances_created, newInstances);

            console.timeEnd(GEPPETTO.Resources.IMPORT_TYPE_RESOLVED);
            GEPPETTO.CommandController.log(GEPPETTO.Resources.IMPORT_TYPE_RESOLVED);
        },

        /**
         *
         * @param typePath
         * @param callback
         */
        resolveImportValue: function (typePath, callback) {
            var params = {};
            params["experimentId"] = Project.getActiveExperiment().getId();
            params["projectId"] = Project.getId();
            // replace client naming first occurrence - the server doesn't know about it
            params["path"] = typePath.replace(GEPPETTO.Resources.MODEL_PREFIX_CLIENT + ".", '');

            var requestID = GEPPETTO.MessageSocket.send("resolve_import_value", params, callback);

            GEPPETTO.trigger('spin_logo');
        },

        /**
         * Swap resolved import value with actual type
         *
         * @param rawModel
         */
        swapResolvedValue: function (rawModel) {
            
            // STEP 1: merge model - expect a fully formed Geppetto model to be merged into current one
            var diffReport = GEPPETTO.ModelFactory.mergeValue(rawModel, true);
            GEPPETTO.CommandController.log(GEPPETTO.Resources.IMPORT_VALUE_RESOLVED);
        },

        /**
         * Augments the instances array with some utilities methods for ease of access
         */
        augmentInstancesArray: function (instances) {
            // create global shortcuts to top level instances
            for (var i = 0; i < instances.length; i++) {
                // NOTE: tampering with the window object like this is probably a horrible idea
                window[instances[i].getId()] = instances[i];
                window.Instances[instances[i].getId()] = instances[i];
            }

            // add method to add instances to window.Instances
            instances.addInstances = function (instancePaths) {
                if (!(instancePaths.constructor === Array)) {
                    // if it's not an array throw it into an array with a single element
                    instancePaths = [instancePaths];
                }

                GEPPETTO.ModelFactory.addInstances(instancePaths, window.Instances, window.Model);
            };

            instances.getInstance = function (instancePath, create, override) {
                if (create == undefined) {
                    create = true;
                }

                var instances = [];
                var InstanceVarName = "Instances.";
                var arrayParameter = true;

                if (!(instancePath.constructor === Array)) {
                    instancePath = [instancePath];
                    arrayParameter = false;
                }

                // check if we have any [*] for array notation and replace with exploded paths
                for (var j = 0; j < instancePath.length; j++) {
                    if (instancePath[j].indexOf('[*]') > -1) {
                        var arrayPath = instancePath[j].substring(0, instancePath[j].indexOf('['));
                        var subArrayPath = instancePath[j].substring(instancePath[j].indexOf(']') + 1, instancePath[j].length);
                        var arrayInstance = Instances.getInstance(arrayPath);
                        var arraySize = arrayInstance.getSize();

                        // remove original * entry
                        instancePath.splice(j, 1);
                        // add exploded elements
                        for (var x = 0; x < arraySize; x++) {
                            instancePath.push(arrayPath + '[' + x + ']' + subArrayPath);
                        }
                    }
                }


                for (var i = 0; i < instancePath.length; i++) {
                    try {
                        var potentialVar = eval(InstanceVarName + instancePath[i]);
                        if (potentialVar != undefined) {
                            if (override) {
                                GEPPETTO.ModelFactory.deleteInstance(instances[i]);
                                Instances.addInstances(instancePath[i]);
                                instances.push(eval(InstanceVarName + instancePath[i]));
                            }
                            else {
                                instances.push(potentialVar);
                            }
                        }
                        else {
                            if (create) {
                                Instances.addInstances(instancePath[i]);
                                instances.push(eval(InstanceVarName + instancePath[i]));
                            }
                        }
                    } catch (e) {
                        if (create) {
                            try {

                                Instances.addInstances(instancePath[i]);
                                instances[i] = eval(InstanceVarName + instancePath[i]);
                            }
                            catch (e) {
                                throw ("The instance " + instancePath[i] + " does not exist in the current model");
                            }
                        }
                    }
                }

                if (instances.length == 1 && !arrayParameter) {
                    //if we received an array we want to return an array even if there's only one element
                    return instances[0];
                } else {
                    return instances;
                }
            };
        },

        /**
         *
         * @param payload
         */
        loadExperiment: function (experimentId, recordedVariables, setParameters) {
            console.time(GEPPETTO.Resources.LOADING_EXPERIMENT);

            var experiment = undefined;

            for (var e in window.Project.getExperiments()) {
                if (window.Project.getExperiments()[e].getId() == experimentId) {
                    experiment = window.Project.getExperiments()[e];
                    break;
                }
            }

            if (experiment == undefined) {
                throw ("Could not find the experiment with id " + experimentId);
            }

            GEPPETTO.CommandController.createTags("Project.getActiveExperiment()", GEPPETTO.Utility.extractMethodsFromObject(experiment, true));

            window.Project.setActiveExperiment(experiment);
            GEPPETTO.ExperimentsController.updateExperiment(experiment, recordedVariables, setParameters);
            console.timeEnd(GEPPETTO.Resources.LOADING_EXPERIMENT);

            GEPPETTO.trigger(GEPPETTO.Events.Experiment_loaded);
            GEPPETTO.ViewController.resolveViews();

            // after applying views, run script if any
            if(window.Project.getActiveExperiment()!=null && window.Project.getActiveExperiment()!=undefined){
            	if (window.Project.getActiveExperiment().getScript() != undefined) {
            		G.runScript(window.Project.getActiveExperiment().getScript());
            	}
            }
        },

        /**
         *
         * @param experiment
         * @returns {*}
         */
        createExperiment: function (experiment) {
            var newExperiment = GEPPETTO.ProjectFactory.createExperimentNode(experiment);
            window.Project.getExperiments().push(newExperiment);
            newExperiment.setParent(window.Project);
            newExperiment.setActive();

            GEPPETTO.ExperimentsController.closeCurrentExperiment();
            window.Project.setActiveExperiment(newExperiment);
            GEPPETTO.CommandController.log(GEPPETTO.Resources.EXPERIMENT_CREATED);
            GEPPETTO.trigger(GEPPETTO.Events.Experiment_created, newExperiment);

            return newExperiment;
        },

        /**
         * Creates experiment batch on project model
         *
         * @param experiments
         */
        createExperimentBatch: function (experiments) {
            for (var i = 0; i < experiments.length; i++) {
                var newExperiment = GEPPETTO.ProjectFactory.createExperimentNode(experiments[i]);
                window.Project.getExperiments().push(newExperiment);
                newExperiment.setParent(window.Project);
                GEPPETTO.trigger(GEPPETTO.Events.Experiment_created, newExperiment);
            }
            GEPPETTO.CommandController.log(GEPPETTO.Resources.EXPERIMENT_BATCH_CREATED);
        },

        /**
         *
         * @param data
         */
        deleteExperiment: function (data) {
            var experiment = null;
            var experiments = window.Project.getExperiments();
            for (var e in experiments) {
                if (experiments[e].getId() == data.id) {
                    experiment = experiments[e];
                    var index = window.Project.getExperiments().indexOf(experiment);
                    window.Project.getExperiments().splice(index, 1);
                }
            }
            var activeExperiment = window.Project.getActiveExperiment();
            if (activeExperiment != null || undefined) {
                if (activeExperiment.getId() == experiment.getId()) {
                    window.Project.activeExperiment = null;
                }
            }
            GEPPETTO.trigger(GEPPETTO.Events.Experiment_deleted, experiment);
        },

        updateExperimentsStatus: function(experimentsStatus){
            var experiments = window.Project.getExperiments();
            for (var key in experimentsStatus) {
                var projectID = experimentsStatus[key].projectID;
                var status = experimentsStatus[key].status;
                var experimentID = experimentsStatus[key].experimentID;

                //changing status in matched experiment
                for (var e in experiments) {
                	if (experiments[e].getId() == experimentID) {
                		if (experiments[e].getStatus() != status) {
                			if (experiments[e].getStatus() == GEPPETTO.Resources.ExperimentStatus.RUNNING &&
                					status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                				experiments[e].setDetails("");
                				experiments[e].setStatus(status);
                				GEPPETTO.trigger(GEPPETTO.Events.Experiment_completed, experimentID);
                			} else if (status == GEPPETTO.Resources.ExperimentStatus.ERROR) {
                				experiments[e].setStatus(status);
                				GEPPETTO.trigger(GEPPETTO.Events.Experiment_failed, experimentID);
                			} else if (experiments[e].getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN &&
                					status == GEPPETTO.Resources.ExperimentStatus.RUNNING) {
                				experiments[e].setStatus(status);
                				GEPPETTO.trigger(GEPPETTO.Events.Experiment_running, experimentID);
                			}else if (experiments[e].getStatus() == GEPPETTO.Resources.ExperimentStatus.QUEUED &&
                					status == GEPPETTO.Resources.ExperimentStatus.RUNNING) {
                				experiments[e].setStatus(status);
                				GEPPETTO.trigger(GEPPETTO.Events.Experiment_running, experimentID);
                			}else if (status == GEPPETTO.Resources.ExperimentStatus.QUEUED) {
                    			experiments[e].setStatus(status);
                    			GEPPETTO.trigger(GEPPETTO.Events.Experiment_running, experimentID);
                    		}else if (status == GEPPETTO.Resources.ExperimentStatus.RUNNING) {
                    			experiments[e].setStatus(status);
                    			GEPPETTO.trigger(GEPPETTO.Events.Experiment_running, experimentID);
                    		} 
                		}
                	}
                }
            }
            GEPPETTO.trigger(GEPPETTO.Events.Experiment_status_check);
        }


    }

    return Manager;

});
