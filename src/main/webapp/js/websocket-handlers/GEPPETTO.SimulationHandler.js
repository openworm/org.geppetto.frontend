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
 * Handles incoming messages associated with Simulation
 */
define(function (require) {
    return function (GEPPETTO) {

        var messageTypes = {
            /*
             * Messages handle by SimulatorHandler
             */
            EXPERIMENT_UPDATE: "experiment_update",
            SIMULATION_CONFIGURATION: "project_configuration",
            PROJECT_LOADED: "project_loaded",
            MODEL_LOADED: "geppetto_model_loaded",
            PROJECT_PROPS_SAVED: "project_props_saved",
            EXPERIMENT_PROPS_SAVED: "experiment_props_saved",
            EXPERIMENT_CREATED: "experiment_created",
            EXPERIMENT_LOADING: "experiment_loading",
            EXPERIMENT_LOADED: "experiment_loaded",
            VARIABLE_FETCHED: "variable_fetched",
            IMPORT_TYPE_RESOLVED: "import_type_resolved",
            PLAY_EXPERIMENT: "play_experiment",
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
            DROPBOX_LINKED: "dropbox_linked",
            DROPBOX_UNLINKED: "dropbox_unlinked",
            RESULTS_UPLOADED: "results_uploaded",
            MODEL_UPLOADED: "model_uploaded",
            UPDATE_MODEL_TREE: "update_model_tree",
            DOWNLOAD_MODEL: "download_model",
            DOWNLOAD_RESULTS: "download_results"
        };

        var messageHandler = {};
        var callbackHandler = {};

        messageHandler[messageTypes.PROJECT_LOADED] = function (payload) {
            GEPPETTO.SimulationHandler.loadProject(payload);
        };

        messageHandler[messageTypes.MODEL_LOADED] = function (payload) {
            GEPPETTO.SimulationHandler.loadModel(payload);
        };

        messageHandler[messageTypes.EXPERIMENT_CREATED] = function (payload) {
            var newExperiment = GEPPETTO.SimulationHandler.createExperiment(payload);
        };
        messageHandler[messageTypes.EXPERIMENT_LOADING] = function (payload) {
            GEPPETTO.trigger('show_spinner', GEPPETTO.Resources.LOADING_EXPERIMENT);
        };

        messageHandler[messageTypes.EXPERIMENT_LOADED] = function (payload) {
            GEPPETTO.SimulationHandler.loadExperiment(payload);

            GEPPETTO.trigger(Events.Experiment_loaded);

            if (window.Project.getActiveExperiment().getScript() != undefined) {
                G.runScript(window.Project.getActiveExperiment().getScript());
            }
        };

        messageHandler[messageTypes.VARIABLE_FETCHED] = function (payload) {
        	GEPPETTO.trigger('spin_logo');
            GEPPETTO.SimulationHandler.addVariableToModel(payload);
            GEPPETTO.trigger('stop_spin_logo');
        };

        messageHandler[messageTypes.IMPORT_TYPE_RESOLVED] = function (payload) {
        	GEPPETTO.trigger('spin_logo');
            GEPPETTO.SimulationHandler.swapResolvedType(payload);
            GEPPETTO.trigger('stop_spin_logo');
        };

        messageHandler[messageTypes.PLAY_EXPERIMENT] = function (payload) {

            var experimentState = JSON.parse(payload.update);
            var experiment = window.Project.getActiveExperiment();

            GEPPETTO.ExperimentsController.updateExperiment(experiment, experimentState);

        };

        messageHandler[messageTypes.EXPERIMENT_STATUS] = function (payload) {
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
                            if (window.Project.getActiveExperiment() != null || undefined) {
                                if (window.Project.getActiveExperiment().getId() == experimentID) {
                                    if (experiments[e].getStatus() == GEPPETTO.Resources.ExperimentStatus.RUNNING &&
                                        status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                                        GEPPETTO.trigger(Events.Experiment_completed);
                                    }
                                }
                            }
                            experiments[e].setStatus(status);
                        }
                    }
                }
            }
            GEPPETTO.trigger(Events.Experiment_status_check);
        };

        messageHandler[messageTypes.PROJECT_PERSISTED] = function (payload) {
            GEPPETTO.SimulationHandler.persistProject(payload);
        };

        messageHandler[messageTypes.PROJECT_CONFIGURATION] = function (payload) {
            GEPPETTO.trigger('project:configloaded', payload.configuration);

        };

        messageHandler[messageTypes.EXPERIMENT_DELETED] = function (payload) {
            GEPPETTO.SimulationHandler.deleteExperiment(payload);
        };

        messageHandler[messageTypes.WATCHED_VARIABLES_SET] = function (payload) {
            GEPPETTO.Console.log("The list of variables to watch was successfully updated.");
        };

        //handles the case where service doesn't support feature and shows message
        messageHandler[messageTypes.NO_FEATURE] = function () {
            //Updates the simulation controls visibility
            GEPPETTO.FE.infoDialog(GEPPETTO.Resources.NO_FEATURE, payload.message);
        };

        //received model tree from server
        messageHandler[messageTypes.UPDATE_MODEL_TREE] = function (payload) {
            GEPPETTO.Console.log("The model parameters were successfully updated.");

        };

        //received supported outputs from server
        messageHandler[messageTypes.GET_SUPPORTED_OUTPUTS] = function (payload) {
            var supportedOutputs = JSON.parse(payload.get_supported_outputs);
            GEPPETTO.Console.log(supportedOutputs);
        };

        messageHandler[messageTypes.PROJECT_PROPS_SAVED] = function (payload) {
            GEPPETTO.Console.log("Project saved succesfully");
        };
        
        messageHandler[messageTypes.EXPERIMENT_PROPS_SAVED] = function (payload) {
            GEPPETTO.Console.log("Experiment saved succesfully");
        };

        messageHandler[messageTypes.DROPBOX_LINKED] = function (payload) {
            GEPPETTO.Console.log("Dropbox linked successfully");
        };

        messageHandler[messageTypes.DROPBOX_UNLINKED] = function (payload) {
            GEPPETTO.Console.log("Dropbox unlinked succesfully");
        };

        messageHandler[messageTypes.DOWNLOAD_RESULTS] = function (payload) {
            GEPPETTO.Console.log("Results downloaded succesfully");
        };

        messageHandler[messageTypes.DOWNLOAD_MODEL] = function (payload) {
            GEPPETTO.Console.log("Model downloaded succesfully");
        };

        messageHandler[messageTypes.RESULTS_UPLOADED] = function (payload) {
            GEPPETTO.Console.log("Results uploaded succesfully");
        };

        messageHandler[messageTypes.MODEL_UPLOADED] = function (payload) {
            GEPPETTO.Console.log("Model uploaded succesfully");
        };

        GEPPETTO.SimulationHandler = {
            onMessage: function (parsedServerMessage) {
                // parsed message has a type and data fields - data contains the payload of the message
                // Switch based on parsed incoming message type
                if (messageHandler.hasOwnProperty(parsedServerMessage.type)) {
                    messageHandler[parsedServerMessage.type](JSON.parse(parsedServerMessage.data));

                    // run callback if any
                    if(parsedServerMessage.requestID != undefined){
	                    if (callbackHandler[parsedServerMessage.requestID] != undefined) {
	                        callbackHandler[parsedServerMessage.requestID]();
	                        delete callbackHandler[parsedServerMessage.requestID];
	                    }
                    }
                }
            },

            persistProject: function (payload) {
                var message = JSON.parse(payload.update);
                var projectID = message.projectID;
                var activeExperimentID = message.activeExperimentID;

                window.Project.id = parseInt(projectID);
                var oldActiveExperiment = window.Project.getActiveExperiment().id;
                window.Project.getActiveExperiment().id = parseInt(activeExperimentID);
                window.Project.persisted = true;
                
                //TODO: Why replace id?
                //GEPPETTO.FE.updateExperimentId(oldActiveExperiment, window.Project.getActiveExperiment().id);

                GEPPETTO.trigger(Events.Project_persisted);
                GEPPETTO.Console.log("The project has been persisted  [id=" + projectID + "].");
            },

            loadProject: function (payload) {
                // we remove anything from any previous loaded project if there was one
                if (Project) {
                    Project.initialize();
                }
                GEPPETTO.G.listeners = [];
                var project = JSON.parse(payload.project_loaded);

                window.Project = GEPPETTO.ProjectFactory.createProjectNode(project);

                if (window.location.search.indexOf("load_project_from_url") != -1) {
                    window.Project.persisted = false;
                }

                GEPPETTO.Init.initEventListeners();
                GEPPETTO.trigger(Events.Project_loaded);
                GEPPETTO.Console.log(GEPPETTO.Resources.PROJECT_LOADED);
            },

            loadModel: function (payload) {

                console.time(GEPPETTO.Resources.PARSING_MODEL);
                GEPPETTO.trigger('show_spinner', GEPPETTO.Resources.PARSING_MODEL);

                var model = JSON.parse(payload.geppetto_model_loaded);

                console.timeEnd(GEPPETTO.Resources.PARSING_MODEL);

                console.time(GEPPETTO.Resources.CREATING_MODEL);
                GEPPETTO.trigger('show_spinner', GEPPETTO.Resources.CREATING_MODEL);
                // build Geppetto model here (once off operation when project is loaded)
                window.Model = GEPPETTO.ModelFactory.createGeppettoModel(model, true, true);
                console.timeEnd(GEPPETTO.Resources.CREATING_MODEL);

                console.time(GEPPETTO.Resources.CREATING_INSTANCES);
                GEPPETTO.trigger('show_spinner', GEPPETTO.Resources.CREATING_INSTANCES);
                // build instance tree here (instance tree will be populated with state info for each experiment)
                window.Instances = GEPPETTO.ModelFactory.createInstances(window.Model);
                this.augmentInstancesArray(window.Instances);
                console.timeEnd(GEPPETTO.Resources.CREATING_INSTANCES);

                console.time(GEPPETTO.Resources.CREATING_SCENE);
                GEPPETTO.trigger('show_spinner', GEPPETTO.Resources.CREATING_SCENE);
                // build scene here from Geppetto model populating visual objects in the instance tree
                // Updates the simulation controls visibility
                var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());

                if (webGLStarted) {
                    // we call it only the first time
                    GEPPETTO.SceneController.animate();
                }
                GEPPETTO.SceneController.buildScene(window.Instances, window.Model);
                console.timeEnd(GEPPETTO.Resources.CREATING_SCENE);
                GEPPETTO.trigger(Events.Model_loaded);
                GEPPETTO.Console.log(GEPPETTO.Resources.MODEL_LOADED);

                // populate control panel with instances
                GEPPETTO.FE.refresh(window.Instances);

                console.timeEnd(GEPPETTO.Resources.LOADING_PROJECT);
                GEPPETTO.trigger("hide:spinner");
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

                    var requestID = GEPPETTO.MessageSocket.send("fetch_variable", params);

                    GEPPETTO.trigger('spin_logo');

                    // add callback with request id if any
                    if (callback != undefined) {
                        callbackHandler[requestID] = callback;
                    }
                } else {
                    GEPPETTO.Console.log(GEPPETTO.Resources.VARIABLE_ALREADY_EXISTS);
                }
            },

            /**
             * Adds fetched variable to model
             *
             * @param payload
             */
            addVariableToModel: function (payload) {
                var rawModel = JSON.parse(payload.variable_fetched);

                console.time(GEPPETTO.Resources.ADDING_VARIABLE);

                // STEP 1: merge model - expect a fully formed Geppetto model to be merged into current one
                var diffReport = GEPPETTO.ModelFactory.mergeModel(rawModel);

                // STEP 2: add new instances for new variables if any
                var newInstances = GEPPETTO.ModelFactory.createInstancesFromDiffReport(diffReport);

                // STEP: 3 update scene
                GEPPETTO.SceneController.updateSceneWithNewInstances(newInstances);

                // STEP: 4 update components
                GEPPETTO.FE.refresh(newInstances);

                console.timeEnd(GEPPETTO.Resources.ADDING_VARIABLE);

                GEPPETTO.Console.log(GEPPETTO.Resources.VARIABLE_ADDED);
            },

            /**
             * Resolve import type
             *
             * @param typePath
             */
            resolveImportType: function (typePaths, callback) {
                if(typeof typePaths == "string"){
                    typePaths=[typePaths];
                }
                var params = {};
                params["projectId"] = Project.getId();
                // replace client naming first occurrence - the server doesn't know about it
                var paths=[];
                for(var i=0;i<typePaths.length;i++){
                    paths.push(typePaths[i].replace(GEPPETTO.Resources.MODEL_PREFIX_CLIENT+".", ''));
                }
                params["paths"] = paths;

                var requestID = GEPPETTO.MessageSocket.send("resolve_import_type", params);

                GEPPETTO.trigger('spin_logo');

                // add callback with request id if any
                if (callback != undefined) {
                    callbackHandler[requestID] = callback;
                }
            },

            /**
             * Swap resolved import type with actual type
             *
             * @param payload
             */
            swapResolvedType: function (payload) {
            	console.time(GEPPETTO.Resources.IMPORT_TYPE_RESOLVED);
                var rawModel = JSON.parse(payload.import_type_resolved);

                // STEP 1: merge model - expect a fully formed Geppetto model to be merged into current one
                var diffReport = GEPPETTO.ModelFactory.mergeModel(rawModel, true);

                // STEP 2: add new instances for new types if any
                var newInstances = GEPPETTO.ModelFactory.createInstancesFromDiffReport(diffReport);

                // STEP 3: update scene
                GEPPETTO.SceneController.updateSceneWithNewInstances(newInstances);

                // STEP: 4 update components
                GEPPETTO.FE.refresh(newInstances);

                console.timeEnd(GEPPETTO.Resources.IMPORT_TYPE_RESOLVED);
                GEPPETTO.Console.log(GEPPETTO.Resources.IMPORT_TYPE_RESOLVED);
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

                instances.getInstance = function (instancePath, create) {
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
                            instances[i] = eval(InstanceVarName + instancePath[i]);
                            if (instances[i] == undefined) {
                                if (create) {
                                    Instances.addInstances(instancePath[i]);
                                    instances[i] = eval(InstanceVarName + instancePath[i]);
                                }
                            }
                        } catch (e) {
                            if (create) {
                                Instances.addInstances(instancePath[i]);
                                instances[i] = eval(InstanceVarName + instancePath[i]);
                            }
                        }
                        if (instances[i] == undefined && create) {
                            throw( "The instance " + instancePath[i] + " does not exist in the current model" );
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

            loadExperiment: function (payload) {
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

                window.Project.setActiveExperiment(experiment);
                GEPPETTO.ExperimentsController.updateExperiment(experiment, message);
                console.timeEnd(GEPPETTO.Resources.LOADING_EXPERIMENT);
            },

            createExperiment: function (payload) {
                var experiment = JSON.parse(payload.experiment_created);

                var newExperiment = GEPPETTO.ProjectFactory.createExperimentNode(experiment);
                window.Project.getExperiments().push(newExperiment);
                newExperiment.setParent(window.Project);
                newExperiment.setActive();
                GEPPETTO.Console.log(GEPPETTO.Resources.EXPERIMENT_CREATED);
                
                GEPPETTO.trigger(Events.Experiment_created, newExperiment);

                return newExperiment;
            },

            deleteExperiment: function (payload) {
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
                GEPPETTO.trigger(Events.Experiment_deleted, experiment);
            }
        };

        GEPPETTO.SimulationHandler.MESSAGE_TYPE = messageTypes;
    };

    /**
     * Utility function for formatting output of list variable operations
     * NOTE: move from here under wherever it makes sense
     *
     * @param vars - array of variables
     */
    function formatListVariableOutput(vars, indent) {
        var formattedNode = null;

        // vars is always an array of variables
        for (var i = 0; i < vars.length; i++) {
            var name = vars[i].name;

            if (vars[i].aspect != "aspect") {
                var size = null;
                if (typeof(vars[i].size) != "undefined") {
                    // we know it's an array
                    size = vars[i].size;
                }

                // print node
                var arrayPart = (size != null) ? "[" + size + "]" : "";
                var indentation = "   ���";
                for (var j = 0; j < indent; j++) {
                    indentation = indentation.replace("���", " ") + "   ��� ";
                }
                formattedNode = indentation + name + arrayPart;

                // is type simple variable? print type
                if (typeof(vars[i].type.variables) == "undefined") {
                    // we know it's a simple type
                    var type = vars[i].type.type;
                    formattedNode += ":" + type;
                }

                // print current node
                GEPPETTO.Console.log(formattedNode);

                // recursion check
                if (typeof(vars[i].type.variables) != "undefined") {
                    // we know it's a complex type - recurse! recurse!
                    formatListVariableOutput(vars[i].type.variables, indent + 1);
                }
            }
            else {
                formattedNode = name;
                // print current node
                GEPPETTO.Console.log(formattedNode);
            }
        }
    }
});
