/**
 * Controller responsible to manage the experiments
 * TODO: Move to controllers folder
 * @author Matteo Cantarelli
 */
define(function (require) {
    return function (GEPPETTO) {

        var AParameterCapability = require('../geppettoModel/capabilities/AParameterCapability');
        var AStateVariableCapability = require('../geppettoModel/capabilities/AStateVariableCapability');

        ExperimentStateEnum = {
            STOPPED: 0,
            PLAYING: 1,
            PAUSED: 2
        };

        /**
         * @class GEPPETTO.ExperimentController
         */
        GEPPETTO.ExperimentsController =
            {

                playExperimentReady: false,
                worker: null,
                playOptions: { playAll: true },
                maxSteps: 0,
                externalExperiments: {},
                state: ExperimentStateEnum.STOPPED,
                step: 0,
                playTimerStep: 5, // timer step in milliseconds
                playLoop: false,
                suppressDeleteExperimentConfirmation: false,

                isPlayExperimentReady: function () {
                    return this.playExperimentReady;
                },

                /** Update the instances of this experiment given the experiment state */
                updateExperiment: function (experiment, experimentState) {

                    this.playExperimentReady = false; //we reset
                    this.maxSteps = 0;
                    if (experimentState.recordedVariables) {
                        for (var i = 0; i < experimentState.recordedVariables.length; i++) {
                            var recordedVariable = experimentState.recordedVariables[i];
                            var instancePath = this.getInstancePathFromPointer(recordedVariable.pointer, false);
                            var instance = Instances.getInstance(instancePath);
                            instance.setWatched(true, false);
                            if (recordedVariable.hasOwnProperty("value") && recordedVariable.value != undefined) {
                                //if at least one of the varialbes has a value we consider the experiment as ready to be played
                                this.playExperimentReady = true;
                                instance.setTimeSeries(recordedVariable.value.value);
                                if (recordedVariable.value.value.length > this.maxSteps) {
                                    this.maxSteps = recordedVariable.value.value.length;
                                }
                            }
                        }
                    }
                    if (experimentState.setParameters) {
                        for (var i = 0; i < experimentState.setParameters.length; i++) {
                            var setParameter = experimentState.setParameters[i];
                            if (setParameter.hasOwnProperty("value") && setParameter.value != undefined) {
                                var path = setParameter.pointer.path;
                                var firstToken = path.split(".")[0];
                                var parameter = undefined;
                                try {
                                    var firstEntity = eval(GEPPETTO.Resources.MODEL_PREFIX_CLIENT + "." + firstToken);
                                    if (firstEntity.getMetaType() == GEPPETTO.Resources.LIBRARY_NODE) {
                                        parameter = eval(GEPPETTO.Resources.MODEL_PREFIX_CLIENT + "." + path);
                                    } else {
                                        throw "Path unrecognised: " + path;
                                    }
                                } catch (e) {
                                    //it's not a static parameter, it's an instance
                                    parameter = Instances.getInstance(path);
                                }
                                parameter.setValue(setParameter.value.value, false);
                            }
                        }
                    }
                    if (this.playExperimentReady) {
                        //creation of the worker will trigger the event for the listening widgets
                        //to update themselves
                        this.triggerPlayExperiment(experiment);
                    }

                    GEPPETTO.trigger(GEPPETTO.Events.Experiment_updated);
                },

                /* 
                 * This method adds external experiment state (different from the active one) to a map.
                 * This happens whether they are from the same project or from an external one.
                 * ExternalInstance are used to hold the data
                 */
                addExternalExperimentState: function (experimentState) {
                    if (this.externalExperiments[experimentState.projectId] == undefined) {
                        this.externalExperiments[experimentState.projectId] = {};
                    }
                    if (this.externalExperiments[experimentState.projectId][experimentState.experimentId] == undefined) {
                        this.externalExperiments[experimentState.projectId][experimentState.experimentId] = {};
                    }
                    for (var i = 0; i < experimentState.recordedVariables.length; i++) {
                        var recordedVariable = experimentState.recordedVariables[i];
                        var instancePath = recordedVariable.pointer.path;
                        var instance = GEPPETTO.ModelFactory.createExternalInstance(instancePath, experimentState.projectId, experimentState.experimentId);
                        instance.extendApi(AStateVariableCapability);
                        instance.setWatched(true, false);
                        if (recordedVariable.hasOwnProperty("value") && recordedVariable.value != undefined) {
                            instance.setTimeSeries(recordedVariable.value.value);
                            instance.setUnit(recordedVariable.value.unit.unit);
                        }
                        this.externalExperiments[experimentState.projectId][experimentState.experimentId][instancePath] = instance;
                    }
                    if (experimentState.setParameters) {
                        for (var i = 0; i < experimentState.setParameters.length; i++) {
                            var setParameter = experimentState.setParameters[i];
                            var instancePath = setParameter.pointer.path;
                            var instance = GEPPETTO.ModelFactory.createExternalInstance(instancePath, experimentState.projectId, experimentState.experimentId);
                            instance.extendApi(AParameterCapability);
                            if (setParameter.hasOwnProperty("value") && setParameter.value != undefined) {
                                instance.setValue(setParameter.value.value, false);
                            }
                            this.externalExperiments[experimentState.projectId][experimentState.experimentId][instancePath] = instance;
                        }
                    }

                },

                getExternalInstance: function (projectId, experimentId, instancePath) {
                    if (this.externalExperiments[projectId] == undefined) {
                        return undefined;
                    }
                    if (this.externalExperiments[projectId][experimentId] == undefined) {
                        return undefined;
                    }
                    return this.externalExperiments[projectId][experimentId][instancePath];
                },

                setActive: function (experiment) {
                    GEPPETTO.ExperimentsController.closeCurrentExperiment();
                    var parameters = {};
                    parameters["experimentId"] = experiment.id;
                    parameters["projectId"] = experiment.getParent().getId();

                    GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.LOADING_EXPERIMENT);
                    // before wiping widgets stop view monitoring otherwise we may wipe the experiment view
                    GEPPETTO.ViewController.clearViewMonitor();
                    // wipe widgets
                    GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE);
                    GEPPETTO.MessageSocket.send("load_experiment", parameters);
                },

                /**
                 * Sets parameters for this experiment.
                 *
                 * @command ExperimentNode.setParameters(parameters)
                 * @returns {ExperimentNode} ExperimentNode for given name
                 */
                setParameters: function (newParameters) {
                    if (Project.getActiveExperiment().status == GEPPETTO.Resources.ExperimentStatus.DESIGN) {
                        var modelParameters = {};
                        for (var index in newParameters) {
                            var path = newParameters[index].getPath().replace(GEPPETTO.Resources.MODEL_PREFIX_CLIENT + ".", "");
                            modelParameters[path] = newParameters[index].getValue();
                            Project.getActiveExperiment().getSetParameters()[path] = newParameters[index].getValue();
                        }
                        Project.getActiveExperiment().parameters = [];
                        var parameters = {};
                        parameters["experimentId"] = Project.getActiveExperiment().getId();
                        parameters["projectId"] = Project.getId();
                        parameters["modelParameters"] = modelParameters;

                        GEPPETTO.MessageSocket.send("set_parameters", parameters);

                    }
                },

                /**
                 * Sets view for this experiment / project.
                 *
                 * @command ExperimentsController.setView(view)
                 */
                setView: function (view) {
                    var activeExperiment = (window.Project.getActiveExperiment() != null && window.Project.getActiveExperiment() != undefined);
                    var setView = false;

                    if (Project.persisted && GEPPETTO.UserController.persistence) {
                        setView = true;
                    } else if (GEPPETTO.Main.localStorageEnabled && (typeof (Storage) !== "undefined")) {
                        // store view in local storage for this project/experiment/user
                        if (!activeExperiment) {
                            // no experiment active - save at project level
                            localStorage.setItem("{0}_{1}_view".format(window.location.origin, Project.getId()), JSON.stringify(view));
                        } else {
                            // experiment active - save at experiment level
                            localStorage.setItem("{0}_{1}_{2}_view".format(window.location.origin, Project.getId(), window.Project.getActiveExperiment().getId()), JSON.stringify(view));
                        }
                        setView = true;
                    } else if (GEPPETTO.UserController.persistence && GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT)) {
                        setView = true;
                    }

                    if (setView && GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT)) {
                        var parameters = {};
                        var experimentId = activeExperiment ? Project.getActiveExperiment().getId() : -1;
                        parameters["experimentId"] = experimentId;
                        parameters["projectId"] = Project.getId();
                        parameters["view"] = JSON.stringify(view);

                        GEPPETTO.MessageSocket.send("set_experiment_view", parameters);
                    }
                },

                watchVariables: function (variables, watch) {
                    var watchedVariables = [];
                    for (var i = 0; i < variables.length; i++) {
                        watchedVariables.push(variables[i].getInstancePath());
                        variables[i].setWatched(watch, false);
                    }
                    if (Project.getActiveExperiment() != null) {
                        if (Project.getActiveExperiment().status == GEPPETTO.Resources.ExperimentStatus.DESIGN) {
                            var parameters = {};
                            parameters["experimentId"] = Project.getActiveExperiment().id;
                            parameters["projectId"] = Project.getId();
                            parameters["variables"] = watchedVariables;
                            parameters["watch"] = watch;
                            GEPPETTO.MessageSocket.send("set_watched_variables", parameters);
                        }
                    }

                    for (var v = 0; v < variables.length; v++) {
                        if (Project.getActiveExperiment() != null) {
                            var index = Project.getActiveExperiment().variables.indexOf(variables[v].getInstancePath());
                            if (index == -1 && watch == true) {
                                Project.getActiveExperiment().variables.push(variables[v].getInstancePath());
                            } else if (index != -1 && watch == false) {
                                Project.getActiveExperiment().variables.splice(index, 1);
                            }
                        }
                    }
                },

                isWatched: function (variables) {
                    var watched = true;
                    for (var i = 0; i < variables.length; i++) {
                        if (!variables[i].isWatched()) {
                            watched = false;
                            break;
                        }
                    }
                    return watched;
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
                        // playExperimentReady true even if some variables
                        // do not have value, so if playAll then we get state here
                        if (!this.playExperimentReady) {
                            this.getExperimentState(experiment.getParent().getId(), experiment.id, null);
                            return "Play Experiment";
                        } else {
                            this.triggerPlayExperiment();
                            return "Play Experiment";
                        }

                    } else {
                        GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.CANT_PLAY_EXPERIMENT, "Experiment " + experiment.name + " with id " + experiment.id + " isn't completed, and can't be played.");
                    }
                },

                getExperimentState: function (projectId, experimentId, instances, callback) {
                    var parameters = {};
                    parameters["projectId"] = projectId;
                    parameters["experimentId"] = experimentId;
                    if (instances != null) {
                        parameters["variables"] = instances;
                    }
                    //sending to the server request for data
                    GEPPETTO.MessageSocket.send("get_experiment_state", parameters, callback);
                    GEPPETTO.trigger('spin_logo');
                },

                pause: function () {
                    this.state = ExperimentStateEnum.PAUSED;
                    this.getWorker().postMessage([GEPPETTO.Events.Experiment_pause]);
                    GEPPETTO.trigger(GEPPETTO.Events.Experiment_pause);
                },

                isPaused: function () {
                    return this.state == ExperimentStateEnum.PAUSED;
                },

                isPlaying: function () {
                    return this.state == ExperimentStateEnum.PLAYING;
                },

                isStopped: function () {
                    return this.state == ExperimentStateEnum.STOPPED;
                },

                resume: function () {
                    //we'll use a worker
                    if (this.isPaused()) {
                        this.state = ExperimentStateEnum.PLAYING;
                        GEPPETTO.ExperimentsController.getWorker().postMessage([GEPPETTO.Events.Experiment_resume]);
                        GEPPETTO.trigger(GEPPETTO.Events.Experiment_resume);
                        return "Pause Experiment";
                    }
                },

                stop: function () {
                    this.terminateWorker();
                    this.state = ExperimentStateEnum.STOPPED;
                    GEPPETTO.trigger(GEPPETTO.Events.Experiment_stop);
                },

                closeCurrentExperiment: function () {
                    var experiment = Project.getActiveExperiment();
                    if (experiment) {
                        //we clear all the listeners
                        GEPPETTO.G.listeners = [];
                    }

                    // clean instance tree state
                    GEPPETTO.ModelFactory.cleanupInstanceTreeState();

                    this.playExperimentReady = false;
                },

                triggerPlayExperiment: function (experiment) {

                    if (this.playOptions.playAll) {
                        this.stop();
                    } else {
                        if (!this.isPaused()) {
                            this.stop();
                        }
                    }

                    this.state = ExperimentStateEnum.PLAYING;
                    GEPPETTO.trigger(GEPPETTO.Events.Experiment_play, this.playOptions);

                    if (this.playOptions.playAll) {
                        GEPPETTO.ExperimentsController.terminateWorker();
                        GEPPETTO.trigger(GEPPETTO.Events.Experiment_update, {
                            step: this.maxSteps - 1,
                            playAll: true
                        });
                        this.stop();
                    }
                    else {
                        if (this.playOptions.step == null || undefined) {
                            this.playOptions.step = 0;
                        }

                        // create web worker
                        this.worker = new Worker("geppetto/js/geppettoProject/ExperimentWorker.js");

                        // tells worker to update each half a second
                        this.worker.postMessage([GEPPETTO.Events.Experiment_play, GEPPETTO.ExperimentsController.playTimerStep, this.playOptions.step]);

                        var that = this;
                        // receives message from web worker
                        this.worker.onmessage = function (event) {
                            // get current timeSteps to execute from web worker
                            var currentStep = event.data[0];

                            if (currentStep >= that.maxSteps) {
                                this.postMessage(["experiment:loop"]);
                                if (!that.playLoop) {
                                    Project.getActiveExperiment().stop();
                                    Project.getActiveExperiment().playAll();
                                }
                            } else {
                                GEPPETTO.trigger(GEPPETTO.Events.Experiment_update, {
                                    step: currentStep,
                                    playAll: false
                                });
                            }
                            this.postMessage(["experiment:lastStepConsumed"]);
                        }


                    }
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
                },

                /**
                 * Check if an instance path represent a watched or external instance
                 *
                 * @param projectId
                 * @param experimentId
                 * @param path
                 * @returns {boolean}
                 */
                isLocalWatchedInstanceOrExternal: function (projectId, experimentId, path) {
                    var watchedOrExternal = false;

                    if (projectId == window.Project.getId() && experimentId == window.Project.getActiveExperiment().getId()) {
                        // local, check if experiment completed and variable watched
                        if (window.Project.getActiveExperiment().getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                            var watchList = window.Project.getActiveExperiment().getWatchedVariables();
                            for (var i = 0; i < watchList.length; i++) {
                                if (watchList[i] == path) {
                                    watchedOrExternal = true;
                                    break;
                                }
                            }
                        }
                    } else {
                        // if project/experiment ids don't match it's external
                        watchedOrExternal = true;
                    }

                    return watchedOrExternal;
                }
            }
    }
});
