/**
 * Handles general incoming messages, excluding Simulation
 */
define(function (require) {
    return function (GEPPETTO) {
        var $ = require('jquery');

        var messageTypes =
        {
            CLIENT_ID: "client_id",
            ERROR_LOADING_SIM: "error_loading_simulation",
            ERROR_LOADING_PROJECT: "error_loading_project",
            ERROR_DOWNLOADING_MODEL: "error_downloading_model",
            ERROR_DOWNLOADING_RESULTS: "error_downloading_results",
            ERROR: "generic_error",
            INFO_MESSAGE: "info_message",
            GEPPETTO_VERSION: "geppetto_version",
            READ_URL_PARAMS: "read_url_parameters",
            SCRIPT_FETCHED: "script_fetched",
            DATASOURCE_FETCHED: "data_source_results_fetched",
            SERVER_AVAILABLE: "server_available",
            SERVER_UNAVAILABLE: "server_unavailable",
            USER_PRIVILEGES : "user_privileges"
        };

        var messageHandler =
        {};

        // sets client id
        messageHandler[messageTypes.CLIENT_ID] = function (payload) {
            GEPPETTO.MessageSocket.setClientID(payload.clientID);
        };
        
        messageHandler[messageTypes.USER_PRIVILEGES] = function (payload) {
        	var user_privileges = JSON.parse(payload.user_privileges);
        	GEPPETTO.UserController.setUserPrivileges(user_privileges);
        };

        // Error loading simulation, invalid url or simulation file
        messageHandler[messageTypes.ERROR_LOADING_SIM] = function (payload) {
            GEPPETTO.trigger('geppetto:error', payload.message);
            GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.INVALID_SIMULATION_FILE, payload.message);
            GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
        };

        // Error loading simulation, invalid url or simulation file
        messageHandler[messageTypes.ERROR_LOADING_PROJECT] = function (payload) {
            GEPPETTO.trigger('geppetto:error', payload.message);
            GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.ERROR_LOADING_PROJECT, payload.message);
            GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
        };

        // Error loading simulation, invalid url or simulation file
        messageHandler[messageTypes.ERROR_DOWNLOADING_MODEL] = function (payload) {
            GEPPETTO.trigger('geppetto:error', payload.message);
            GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.ERROR_DOWNLOADING_MODEL, payload.message);
            GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
        };

        // Error loading simulation, invalid url or simulation file
        messageHandler[messageTypes.ERROR_DOWNLOADING_RESULTS] = function (payload) {
            GEPPETTO.trigger('geppetto:error', payload.message);
            GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.ERROR_DOWNLOADING_RESULTS, payload.message);
            GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
        };

        // Error loading simulation, invalid url or simulation file
        messageHandler[messageTypes.INFO_MESSAGE] = function (payload) {
            var message = JSON.parse(payload.message);
            GEPPETTO.trigger('geppetto:info', message);
            GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.INCOMING_MESSAGE, message);
            GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
        };

        messageHandler[messageTypes.ERROR] = function (payload) {
            var error = JSON.parse(payload.message);
            GEPPETTO.trigger('geppetto:error', error.msg);
            GEPPETTO.ModalFactory.errorDialog(GEPPETTO.Resources.ERROR, error.message, error.code, error.exception);
            GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
        };

        messageHandler[messageTypes.GEPPETTO_VERSION] = function (payload) {
            var version = payload.geppetto_version;
            var geppettoVersion = GEPPETTO.Resources.GEPPETTO_VERSION_HOLDER.replace("$1", version);
            GEPPETTO.CommandController.log(geppettoVersion);
        };

        messageHandler[messageTypes.SCRIPT_FETCHED] = function (payload) {
            GEPPETTO.ScriptRunner.runScript(payload.script_fetched);
        };
        
        messageHandler[messageTypes.DATASOURCE_FETCHED] = function (payload) {
        	var message = JSON.parse(payload.data_source_results_fetched);
        	GEPPETTO.Spotlight.updateDataSourceResults(message.data_source_name,JSON.parse(message.results));
        };

        // Simulation server became available
        messageHandler[messageTypes.SERVER_AVAILABLE] = function (payload) {
            GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.SERVER_AVAILABLE, payload.message);
            GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
        };

        GEPPETTO.GlobalHandler =
        {
            onMessage: function (parsedServerMessage) {
                if (messageHandler.hasOwnProperty(parsedServerMessage.type)) {
                    messageHandler[parsedServerMessage.type](JSON.parse(parsedServerMessage.data));
                }
            }
        };

        GEPPETTO.GlobalHandler.MESSAGE_TYPE = messageTypes;
    };
});