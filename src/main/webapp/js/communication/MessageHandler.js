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
            var message = JSON.parse(payload.project_loaded);
            GEPPETTO.Manager.loadProject(message.project, message.persisted);
        };

        messageHandler[messageTypes.GET_DROPBOX_TOKEN] = function(payload) {
            GEPPETTO.UserController.setDropboxToken(payload.get_dropbox_token);
        }

        messageHandler[messageTypes.MODEL_LOADED] = function(payload) {
            console.time(GEPPETTO.Resources.PARSING_MODEL);
            GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.PARSING_MODEL);

            var model = JSON.parse(payload.geppetto_model_loaded);
            GEPPETTO.Manager.loadModel(model);
            if(Project.getActiveExperiment()=="" || Project.getActiveExperiment()==null || Project.getActiveExperiment()==undefined){
            	GEPPETTO.ViewController.resolveViews();	
            }
        };

        messageHandler[messageTypes.EXPERIMENT_CREATED] = function(payload) {
            var experiment = JSON.parse(payload.experiment_created);
            GEPPETTO.Manager.createExperiment(experiment);
            GEPPETTO.CommandController.log("Experiment created succesfully");
        };

        messageHandler[messageTypes.EXPERIMENT_BATCH_CREATED] = function(payload) {
            var experiments = JSON.parse(payload.experiment_batch_created);
            GEPPETTO.Manager.createExperimentBatch(experiments);
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
            var experimentState = JSON.parse(payload.experiment_loaded);
            GEPPETTO.Manager.loadExperiment(experimentState.experimentId, experimentState);
        };

        messageHandler[messageTypes.VARIABLE_FETCHED] = function(payload) {
            GEPPETTO.trigger('spin_logo');
            var rawModel = JSON.parse(payload.variable_fetched);
            GEPPETTO.Manager.addVariableToModel(rawModel);
            GEPPETTO.trigger('stop_spin_logo');
        };

        messageHandler[messageTypes.IMPORT_TYPE_RESOLVED] = function(payload) {
            GEPPETTO.trigger('spin_logo');
            var rawModel = JSON.parse(payload.import_type_resolved);
            GEPPETTO.Manager.swapResolvedType(rawModel);
            GEPPETTO.trigger('stop_spin_logo');
        };

        messageHandler[messageTypes.IMPORT_VALUE_RESOLVED] = function(payload) {
            var rawModel = JSON.parse(payload.import_value_resolved);
            GEPPETTO.Manager.swapResolvedValue(rawModel);
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
            var experimentsStatus = JSON.parse(payload.update);
            GEPPETTO.Manager.updateExperimentsStatus(experimentsStatus);
        };

        messageHandler[messageTypes.PROJECT_PERSISTED] = function(payload) {
            var message = JSON.parse(payload.update);
            var projectID = message.projectID;
            var activeExperimentID = message.activeExperimentID;
            GEPPETTO.Manager.persistProject(projectID, activeExperimentID);
            GEPPETTO.CommandController.log("Project persisted");
            GEPPETTO.trigger("stop_spin_persist");
        };

        messageHandler[messageTypes.PROJECT_CONFIGURATION] = function(payload) {
            GEPPETTO.trigger('project:configloaded', payload.configuration);

        };

        messageHandler[messageTypes.EXPERIMENT_DELETED] = function(payload) {
            var data = JSON.parse(payload.update);
            GEPPETTO.Manager.deleteExperiment(data);
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

        GEPPETTO.MessageHandler =
        {
            onMessage: function (parsedServerMessage) {
                if (messageHandler.hasOwnProperty(parsedServerMessage.type)) {
                    messageHandler[parsedServerMessage.type](JSON.parse(parsedServerMessage.data));
                }
            }
        };

        GEPPETTO.MessageHandler.MESSAGE_TYPE = messageTypes;

    }

});



