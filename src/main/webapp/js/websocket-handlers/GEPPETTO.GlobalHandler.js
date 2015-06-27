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
 * Handles general incoming messages, excluding Simulation
 */
define(function(require) {
	return function(GEPPETTO) {
		var $ = require('jquery');

        var messageTypes = {
            /*
             * Messages handle by GlobalHandler
             */
            CLIENT_ID: "client_id",
            RELOAD_CANVAS: "reload_canvas",
            ERROR_LOADING_SIM: "error_loading_simulation",
            ERROR_DOWNLOADING_MODEL: "error_downloading_model",
            ERROR: "generic_error",
            GEPPETTO_VERSION: "geppetto_version",
            OBSERVER_MODE: "observer_mode_alert",
            READ_URL_PARAMS: "read_url_parameters",
            SCRIPT_FETCHED: "script_fetched",
            SERVER_AVAILABLE: "server_available",
            SERVER_UNAVAILABLE: "server_unavailable",
        };

        var messageHandler = {};

        //sets client id
        messageHandler[messageTypes.CLIENT_ID] = function(payload) {
            GEPPETTO.MessageSocket.setClientID(payload.clientID);
        };

        //clear canvas, used when loading a new model or re-loading previous one
        messageHandler[messageTypes.RELOAD_CANVAS] = function() {
            GEPPETTO.Console.debugLog(GEPPETTO.Resources.CLEAR_CANVAS);
            var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
            GEPPETTO.FE.update(webGLStarted);
        };

        //Error loading simulation, invalid url or simulation file
        messageHandler[messageTypes.ERROR_LOADING_SIM] = function(payload) {
            GEPPETTO.trigger('geppetto:error', payload.message);
            GEPPETTO.FE.infoDialog(GEPPETTO.Resources.INVALID_SIMULATION_FILE, payload.message);
        };
        
      //Error loading simulation, invalid url or simulation file
        messageHandler[messageTypes.ERROR_DOWNLOADING_MODEL] = function(payload) {
            GEPPETTO.trigger('geppetto:error', payload.message);
            GEPPETTO.FE.infoDialog(GEPPETTO.Resources.ERROR_DOWNLOADING_MODEL, payload.message);
        };

        messageHandler[messageTypes.ERROR] = function(payload) {
            var msg = JSON.parse(payload.message).message;
            var code = JSON.parse(payload.message).error_code;
            var source = JSON.parse(payload.message).source;
            var exception = JSON.parse(payload.message).exception;

            GEPPETTO.trigger('geppetto:error', msg);

            GEPPETTO.FE.errorDialog(GEPPETTO.Resources.ERROR, msg, code, source, exception);

        };

        messageHandler[messageTypes.GEPPETTO_VERSION] = function(payload){
            var version = payload.geppetto_version;
            var geppettoVersion = GEPPETTO.Resources.GEPPETTO_VERSION_HOLDER.replace("$1", version);
            GEPPETTO.Console.log(geppettoVersion);
        };

        //Notify user with alert they are now in Observer mode
        messageHandler[messageTypes.OBSERVER_MODE] = function(payload){
            GEPPETTO.FE.observersAlert(GEPPETTO.Resources.OBSERVING_MODE, payload.alertMessage, payload.popoverMessage);
        };

        messageHandler[messageTypes.SCRIPT_FETCHED] = function(payload){
            GEPPETTO.ScriptRunner.runScript(payload.script_fetched);
        };

        //Simulation server became available
        messageHandler[messageTypes.SERVER_AVAILABLE] = function(payload){
            GEPPETTO.FE.infoDialog(GEPPETTO.Resources.SERVER_AVAILABLE, payload.message);
        };

        //Simulation server already in use
        messageHandler[messageTypes.SERVER_UNAVAILABLE] = function(payload){
            GEPPETTO.trigger('geppetto:error', payload.message);
            GEPPETTO.FE.observersDialog(GEPPETTO.Resources.SERVER_UNAVAILABLE, payload.message);
        };

        GEPPETTO.GlobalHandler = {
			onMessage: function(parsedServerMessage) {
                if(messageHandler.hasOwnProperty(parsedServerMessage.type)) {
                    messageHandler[parsedServerMessage.type](JSON.parse(parsedServerMessage.data));
                }
			}
		};

		GEPPETTO.GlobalHandler.MESSAGE_TYPE = messageTypes;
	};
});