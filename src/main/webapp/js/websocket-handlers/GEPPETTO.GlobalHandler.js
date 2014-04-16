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

		GEPPETTO.GlobalHandler = {
			onMessage: function(parsedServerMessage) {

				// parsed message has a type and data fields - data contains the payload of the message
				var payload = JSON.parse(parsedServerMessage.data);

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type) {
					//sets client id
					case GEPPETTO.GlobalHandler.MESSAGE_TYPE.CLIENT_ID:
						GEPPETTO.MessageSocket.setClientID(payload.clientID);
						break;
					//clear canvas, used when loading a new model or re-loading previous one
					case GEPPETTO.GlobalHandler.MESSAGE_TYPE.RELOAD_CANVAS:
						GEPPETTO.Console.debugLog(GEPPETTO.Resources.CLEAR_CANVAS);
						var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
						GEPPETTO.FE.update(webGLStarted);
						break;
					//Error loading simulation, invalid url or simulation file
					case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR_LOADING_SIM:
						//if welcome message is open, return normal opacity after user clicked observed
						if(($('#welcomeMessageModal').hasClass('in'))) {
							$('#welcomeMessageModal').modal('hide');
						}
						$('#loadingmodal').modal('hide');
						$('#start').attr('disabled', 'disabled');
						GEPPETTO.FE.infoDialog(GEPPETTO.Resources.INVALID_SIMULATION_FILE, payload.message);
						break;
					//Error while running the simulation
					case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
						
						var msg = JSON.parse(payload.message).message;
						var code = JSON.parse(payload.message).error_code;
						var source = JSON.parse(payload.message).source;
						var exception = JSON.parse(payload.message).exception;

						//if welcome message is open, return normal opacity after user clicked observed
						if(($('#welcomeMessageModal').hasClass('in'))) {
							$('#welcomeMessageModal').modal('hide');
						}
						$('#loadingmodal').modal('hide');
						$('#start').attr('disabled', 'disabled');
						GEPPETTO.FE.errorDialog(GEPPETTO.Resources.ERROR, msg, code, source, exception);
						break;
					case GEPPETTO.GlobalHandler.MESSAGE_TYPE.GEPPETTO_VERSION:
						var version = payload.geppetto_version;
						var geppettoVersion = GEPPETTO.Resources.GEPPETTO_VERSION_HOLDER.replace("$1", version);
						GEPPETTO.Console.log(geppettoVersion);
						GEPPETTO.FE.searchForURLEmbeddedSimulation();
						break;
					//Notify user with alert they are now in Observer mode
					case GEPPETTO.GlobalHandler.MESSAGE_TYPE.OBSERVER_MODE:
						GEPPETTO.FE.observersAlert(GEPPETTO.Resources.OBSERVING_MODE, payload.alertMessage, payload.popoverMessage);
						break;
					//Read the Parameters passed in url
					case GEPPETTO.GlobalHandler.MESSAGE_TYPE.READ_URL_PARAMS:

						break;
					//Run script
					case GEPPETTO.GlobalHandler.MESSAGE_TYPE.RUN_SCRIPT:
						GEPPETTO.ScriptRunner.runScript(payload.run_script);
						break;
					//Simulation server became available
					case GEPPETTO.GlobalHandler.MESSAGE_TYPE.SERVER_AVAILABLE:
						//if welcome message is open, return normal opacity after user clicked observed
						if(($('#welcomeMessageModal').hasClass('in'))) {
							$('#welcomeMessageModal').modal('hide');
						}
						GEPPETTO.FE.infoDialog(GEPPETTO.Resources.SERVER_AVAILABLE, payload.message);
						$("#multiUserNotification").modal('hide');
						break;
					//Simulation server already in use
					case GEPPETTO.GlobalHandler.MESSAGE_TYPE.SERVER_UNAVAILABLE:
						//if welcome message is open, return normal opacity after user clicked observed
						if(($('#welcomeMessageModal').hasClass('in'))) {
							$('#welcomeMessageModal').modal('hide');
						}
						GEPPETTO.FE.disableSimulationControls();
						GEPPETTO.FE.observersDialog(GEPPETTO.Resources.SERVER_UNAVAILABLE, payload.message);
						break;
					default:

						break;
				}
			}
		};
		GEPPETTO.GlobalHandler.MESSAGE_TYPE = {
				/*
				 * Messages handle by GlobalHandler
				 */
				CLIENT_ID: "client_id",
				RELOAD_CANVAS: "reload_canvas",
				ERROR_LOADING_SIM: "error_loading_simulation",
				ERROR: "generic_error",
				GEPPETTO_VERSION: "geppetto_version",
				OBSERVER_MODE: "observer_mode_alert",
				READ_URL_PARAMS: "read_url_parameters",
				RUN_SCRIPT: "run_script",
				SERVER_AVAILABLE: "server_available",
				SERVER_UNAVAILABLE: "server_unavailable",
		};
	};
});