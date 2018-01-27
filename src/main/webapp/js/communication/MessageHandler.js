/**
 * Handles incoming messages associated with Simulation
 */
define(function(require) {
    return function(GEPPETTO) {

        var messageTypes = {
            EXPERIMENT_UPDATE: "experiment_update",
            SIMULATION_CONFIGURATION: "project_configuration",
            PROJECT_LOADED: "project_loaded",
            DOWNLOAD_PROJECT : "download_project",
            MODEL_LOADED: "geppetto_model_loaded",
            PROJECT_PROPS_SAVED: "project_props_saved",
            EXPERIMENT_PROPS_SAVED: "experiment_props_saved",
            EXPERIMENT_CREATED: "experiment_created",
            EXPERIMENT_CLONED: "experiment_cloned",
            EXPERIMENT_BATCH_CREATED: "experiment_batch_created",
            EXPERIMENT_LOADING: "experiment_loading",
            EXPERIMENT_LOADED: "experiment_loaded",
            VARIABLE_FETCHED: "variable_fetched",
            IMPORT_TYPE_RESOLVED: "import_type_resolved",
            IMPORT_VALUE_RESOLVED: "import_value_resolved",
            GET_EXPERIMENT_STATE: "get_experiment_state",
            SET_WATCHED_VARIABLES: "set_watched_variables",
            WATCHED_VARIABLES_SET: "watched_variables_set",
            CLEAR_WATCH: "clear_watch",
            EXPERIMENT_OVER: "experiment_over",
            GET_MODEL_TREE: "get_model_tree",
            GET_SIMULATION_TREE: "get_simulation_tree",
            SET_PARAMETERS: "set_parameters",
            NO_FEATURE: "no_feature",
            EXPERIMENT_STATUS: "experiment_status",
            GET_SUPPORTED_OUTPUTS: "get_supported_outputs",
            EXPERIMENT_DELETED: "experiment_deleted",
            PROJECT_PERSISTED: "project_persisted",
            PROJECT_PERSISTENCE_STATE: "project_persistence_state",
            DROPBOX_LINKED: "dropbox_linked",
            DROPBOX_UNLINKED: "dropbox_unlinked",
            GET_DROPBOX_TOKEN: "get_dropbox_token",
            RESULTS_UPLOADED: "results_uploaded",
            MODEL_UPLOADED: "model_uploaded",
            UPDATE_MODEL_TREE: "update_model_tree",
            DOWNLOAD_MODEL: "download_model",
            DOWNLOAD_RESULTS: "download_results",
            ERROR_RUNNING_EXPERIMENT: "error_running_experiment",
            PROJECT_MADE_PUBLIC: "project_made_public"
        };

        var messageHandler = {};

        messageHandler[messageTypes.PROJECT_LOADED] = function(payload) {
            GEPPETTO.SimulationHandler.loadProject(payload);
        };

        messageHandler[messageTypes.GET_DROPBOX_TOKEN] = function(payload) {
            GEPPETTO.UserController.setDropboxToken(payload.get_dropbox_token);
        }

        messageHandler[messageTypes.MODEL_LOADED] = function(payload) {
            GEPPETTO.SimulationHandler.loadModel(payload);
            if(Project.getActiveExperiment()=="" || Project.getActiveExperiment()==null || Project.getActiveExperiment()==undefined){
            	GEPPETTO.ViewController.resolveViews();	
            }
        };

        messageHandler[messageTypes.EXPERIMENT_CREATED] = function(payload) {
            GEPPETTO.SimulationHandler.createExperiment(payload);
            GEPPETTO.CommandController.log("Experiment created succesfully");
        };

        messageHandler[messageTypes.EXPERIMENT_BATCH_CREATED] = function(payload) {
            GEPPETTO.SimulationHandler.createExperimentBatch(payload);
        };

        messageHandler[messageTypes.ERROR_RUNNING_EXPERIMENT] = function(payload) {
            var error = JSON.parse(payload.error_running_experiment);
            var experiments = window.Project.getExperiments();
            var experimentID = error.id;

            //changing status in matched experiment
            for (var e in experiments) {
                if (experiments[e].getId() == experimentID) {
                    experiments[e].setDetails(error);
                    break;
                }
            }

            GEPPETTO.trigger('geppetto:error', error.msg);
            GEPPETTO.ModalFactory.errorDialog(GEPPETTO.Resources.ERROR, error.message, error.code, error.exception);
            GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
        };

        messageHandler[messageTypes.EXPERIMENT_LOADING] = function(payload) {
            GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.LOADING_EXPERIMENT);
        };

        messageHandler[messageTypes.PROJECT_MADE_PUBLIC] = function(payload) {
            var data = JSON.parse(payload.update);
            window.Project.isPublicProject = data.isPublic;
            GEPPETTO.trigger(GEPPETTO.Events.Project_made_public);
            console.log("Project was made public");
        };

        messageHandler[messageTypes.EXPERIMENT_LOADED] = function(payload) {
            GEPPETTO.SimulationHandler.loadExperiment(payload);
            GEPPETTO.trigger(GEPPETTO.Events.Experiment_loaded);

            GEPPETTO.ViewController.resolveViews();

            // after applying views, run script if any
            if(window.Project.getActiveExperiment()!=null && window.Project.getActiveExperiment()!=undefined){
            	if (window.Project.getActiveExperiment().getScript() != undefined) {
            		G.runScript(window.Project.getActiveExperiment().getScript());
            	}
            }
        };

        messageHandler[messageTypes.VARIABLE_FETCHED] = function(payload) {
            GEPPETTO.trigger('spin_logo');
            GEPPETTO.SimulationHandler.addVariableToModel(payload);
            GEPPETTO.trigger('stop_spin_logo');
        };

        messageHandler[messageTypes.IMPORT_TYPE_RESOLVED] = function(payload) {
            GEPPETTO.trigger('spin_logo');
            GEPPETTO.SimulationHandler.swapResolvedType(payload);
            GEPPETTO.trigger('stop_spin_logo');
        };

        messageHandler[messageTypes.IMPORT_VALUE_RESOLVED] = function(payload) {
            GEPPETTO.SimulationHandler.swapResolvedValue(payload);
            GEPPETTO.trigger('stop_spin_logo');
        };

        messageHandler[messageTypes.GET_EXPERIMENT_STATE] = function(payload) {

            var experimentState = JSON.parse(payload.update);
            var experiment = window.Project.getActiveExperiment();

            if (
                experimentState.projectId == window.Project.getId() &&
                experiment != undefined &&
                experimentState.experimentId == experiment.getId()) {
                //if we fetched data for the current project/experiment 
                GEPPETTO.ExperimentsController.updateExperiment(experiment, experimentState);
            } else {
                GEPPETTO.ExperimentsController.addExternalExperimentState(experimentState);
            }

            GEPPETTO.trigger("stop_spin_logo");
        };

        messageHandler[messageTypes.EXPERIMENT_STATUS] = function(payload) {
            var experimentStatus = JSON.parse(payload.update);

            var experiments = window.Project.getExperiments();
            for (var key in experimentStatus) {
                var projectID = experimentStatus[key].projectID;
                var status = experimentStatus[key].status;
                var experimentID = experimentStatus[key].experimentID;

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
        };

        messageHandler[messageTypes.PROJECT_PERSISTED] = function(payload) {
            GEPPETTO.SimulationHandler.persistProject(payload);
            GEPPETTO.CommandController.log("Project persisted");
            GEPPETTO.trigger("stop_spin_persist");
        };

        messageHandler[messageTypes.PROJECT_CONFIGURATION] = function(payload) {
            GEPPETTO.trigger('project:configloaded', payload.configuration);

        };

        messageHandler[messageTypes.EXPERIMENT_DELETED] = function(payload) {
            GEPPETTO.SimulationHandler.deleteExperiment(payload);
            GEPPETTO.CommandController.log("Experiment deleted succesfully");
        };

        messageHandler[messageTypes.WATCHED_VARIABLES_SET] = function(payload) {
            GEPPETTO.trigger(GEPPETTO.Events.Experiment_updated);
            GEPPETTO.CommandController.log("The list of variables to watch was successfully updated.");
        };

        //handles the case where service doesn't support feature and shows message
        messageHandler[messageTypes.NO_FEATURE] = function() {
            //Updates the simulation controls visibility
            GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.NO_FEATURE, payload.message);
        };

        //received model tree from server
        messageHandler[messageTypes.UPDATE_MODEL_TREE] = function(payload) {
            GEPPETTO.trigger(GEPPETTO.Events.Experiment_updated);
            GEPPETTO.CommandController.log("The model parameters were successfully updated.");
        };

        //received supported outputs from server
        messageHandler[messageTypes.GET_SUPPORTED_OUTPUTS] = function(payload) {
            var supportedOutputs = JSON.parse(payload.get_supported_outputs);
            GEPPETTO.CommandController.log(supportedOutputs);
        };

        messageHandler[messageTypes.PROJECT_PROPS_SAVED] = function(payload) {
            GEPPETTO.CommandController.log("Project saved succesfully");
            GEPPETTO.trigger(GEPPETTO.Events.Project_properties_saved);
        };
        
        messageHandler[messageTypes.SET_PARAMETERS] = function(payload) {
            GEPPETTO.CommandController.log("Set parameters succesfully");
            GEPPETTO.trigger(GEPPETTO.Events.Parameters_set);
        };

        messageHandler[messageTypes.EXPERIMENT_PROPS_SAVED] = function(payload) {
            GEPPETTO.CommandController.log("Experiment saved succesfully");
            var data = JSON.parse(payload.update);
            var experiment = window.Project.getExperimentById(data.id);

            //Updates status. Used for when experiment failed, and user modified the parameters 
            //right after, the status changes back to DESIGN from ERROR
            if (experiment.getStatus() != data.status) {
                experiment.setStatus(data.status);
            }
            
            GEPPETTO.trigger(GEPPETTO.Events.Experiment_properties_saved);
        };

        messageHandler[messageTypes.DROPBOX_LINKED] = function(payload) {
            GEPPETTO.CommandController.log("Dropbox linked successfully",true);
			GEPPETTO.ModalFactory.infoDialog("Success", "Dropbox linked successfully");
        };

        messageHandler[messageTypes.DROPBOX_UNLINKED] = function(payload) {
            GEPPETTO.CommandController.log("Dropbox unlinked succesfully",true);
        };

        messageHandler[messageTypes.DOWNLOAD_RESULTS] = function(payload) {
            GEPPETTO.CommandController.log("Results downloaded succesfully",true);
        };

        messageHandler[messageTypes.DOWNLOAD_MODEL] = function(payload) {
            GEPPETTO.CommandController.log("Model downloaded succesfully",true);
        };
        
        messageHandler[messageTypes.DOWNLOAD_PROJECT] = function (payload) {
        	GEPPETTO.trigger(GEPPETTO.Events.Project_downloaded);
            GEPPETTO.CommandController.log("Project downloaded succesfully",true);
        };

        messageHandler[messageTypes.RESULTS_UPLOADED] = function(payload) {
            GEPPETTO.CommandController.log("Results uploaded succesfully",true);
        };

        messageHandler[messageTypes.MODEL_UPLOADED] = function(payload) {
            GEPPETTO.CommandController.log("Model uploaded succesfully",true);
        };

        GEPPETTO.SimulationHandler = {
            onMessage: function(parsedServerMessage) {
                // parsed message has a type and data fields - data contains the payload of the message
                // Switch based on parsed incoming message type
                if (messageHandler.hasOwnProperty(parsedServerMessage.type)) {
                    messageHandler[parsedServerMessage.type](JSON.parse(parsedServerMessage.data));
                }
            },

            /**
             *
             * @param payload
             */
            persistProject: function(payload) {
                var message = JSON.parse(payload.update);
                var projectID = message.projectID;
                var activeExperimentID = message.activeExperimentID;

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
            loadProject: function(payload) {
                // we remove anything from any previous loaded project if there was one
                GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.LOADING_PROJECT);
                if (Project) {
                    Project.initialize();
                }
                GEPPETTO.G.listeners = [];
                var update = JSON.parse(payload.project_loaded);
                var project = update.project;
                var persisted = update.persisted;
                window.Project = GEPPETTO.ProjectFactory.createProjectNode(project, persisted);
                window.Project.readOnly = !update.persisted;


                GEPPETTO.trigger(GEPPETTO.Events.Project_loaded);
                GEPPETTO.CommandController.log(GEPPETTO.Resources.PROJECT_LOADED);
            },

            /**
             *
             * @param payload
             */
            loadModel: function(payload) {

                console.time(GEPPETTO.Resources.PARSING_MODEL);
                GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.PARSING_MODEL);

                var model = JSON.parse(payload.geppetto_model_loaded);

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
            fetchVariable: function(variableId, datasourceId, callback) {
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
             * @param payload
             */
            addVariableToModel: function(payload) {
                var rawModel = JSON.parse(payload.variable_fetched);

                console.time(GEPPETTO.Resources.ADDING_VARIABLE);

                // STEP 1: merge model - expect a fully formed Geppetto model to be merged into current one
                var diffReport = GEPPETTO.ModelFactory.mergeModel(rawModel);

                // STEP 2: add new instances for new variables if any
                var newInstances = GEPPETTO.ModelFactory.createInstancesFromDiffReport(diffReport);



                // STEP: 4 update components
                GEPPETTO.trigger(GEPPETTO.Events.Instances_created, newInstances);

                console.timeEnd(GEPPETTO.Resources.ADDING_VARIABLE);

                GEPPETTO.CommandController.log(GEPPETTO.Resources.VARIABLE_ADDED);
            },

            /**
             * Resolve import type
             *
             * @param typePath
             */
            resolveImportType: function(typePaths, callback) {
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
             * @param payload
             */
            swapResolvedType: function(payload) {
                console.time(GEPPETTO.Resources.IMPORT_TYPE_RESOLVED);
                var rawModel = JSON.parse(payload.import_type_resolved);

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
            resolveImportValue: function(typePath, callback) {
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
             * @param payload
             */
            swapResolvedValue: function(payload) {
                var rawModel = JSON.parse(payload.import_value_resolved);

                // STEP 1: merge model - expect a fully formed Geppetto model to be merged into current one
                var diffReport = GEPPETTO.ModelFactory.mergeValue(rawModel, true);

                GEPPETTO.CommandController.log(GEPPETTO.Resources.IMPORT_VALUE_RESOLVED);
            },

            /**
             * Augments the instances array with some utilities methods for ease of access
             */
            augmentInstancesArray: function(instances) {
                // create global shortcuts to top level instances
                for (var i = 0; i < instances.length; i++) {
                    // NOTE: tampering with the window object like this is probably a horrible idea
                    window[instances[i].getId()] = instances[i];
                    window.Instances[instances[i].getId()] = instances[i];
                }

                // add method to add instances to window.Instances
                instances.addInstances = function(instancePaths) {
                    if (!(instancePaths.constructor === Array)) {
                        // if it's not an array throw it into an array with a single element
                        instancePaths = [instancePaths];
                    }

                    GEPPETTO.ModelFactory.addInstances(instancePaths, window.Instances, window.Model);
                };

                instances.getInstance = function(instancePath, create, override) {
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
                            if(potentialVar!=undefined){
                                if (override) {
                                    GEPPETTO.ModelFactory.deleteInstance(instances[i]);
                                    Instances.addInstances(instancePath[i]);
                                    instances.push(eval(InstanceVarName + instancePath[i]));
                                }
                                else{
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
                                try{

                                    Instances.addInstances(instancePath[i]);
                                    instances[i] = eval(InstanceVarName + instancePath[i]);
                                }
                                catch(e){
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
            loadExperiment: function(payload) {
                console.time(GEPPETTO.Resources.LOADING_EXPERIMENT);

                var message = JSON.parse(payload.experiment_loaded);

                var experimentId = message.experimentId;
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
                GEPPETTO.ExperimentsController.updateExperiment(experiment, message);
                console.timeEnd(GEPPETTO.Resources.LOADING_EXPERIMENT);
            },

            /**
             *
             * @param payload
             * @returns {*}
             */
            createExperiment: function(payload) {
                var experiment = JSON.parse(payload.experiment_created);

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
             * @param payload
             */
            createExperimentBatch: function(payload) {
                var experiments = JSON.parse(payload.experiment_batch_created);

                for(var i=0; i<experiments.length; i++){
                    var newExperiment = GEPPETTO.ProjectFactory.createExperimentNode(experiments[i]);
                    window.Project.getExperiments().push(newExperiment);
                    newExperiment.setParent(window.Project);
                    GEPPETTO.trigger(GEPPETTO.Events.Experiment_created, newExperiment);
                }

                GEPPETTO.CommandController.log(GEPPETTO.Resources.EXPERIMENT_BATCH_CREATED);
            },

            /**
             *
             * @param payload
             */
            deleteExperiment: function(payload) {
                var data = JSON.parse(payload.update);
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
            }
        };

        GEPPETTO.SimulationHandler.MESSAGE_TYPE = messageTypes;
    };


});
