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
 *     	OpenWorm - http://openworm.org/people.html
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
GEPPETTO.GlobalHandler = GEPPETTO.GlobalHandler ||
{
	REVISION : '1'
};

(function(){
	GEPPETTO.GlobalHandler.onMessage = function(parsedServerMessage){

		// parsed message has a type and data fields - data contains the payload of the message
		var payload = JSON.parse(parsedServerMessage.data);

		// Switch based on parsed incoming message type
		switch(parsedServerMessage.type){
		//sets client id
		case MESSAGE_TYPE.CLIENT_ID:
			GEPPETTO.MessageSocket.setClientID(payload.clientID);
			break;
		//clear canvas, used when loading a new model or re-loading previous one
		case MESSAGE_TYPE.RELOAD_CANVAS:
			GEPPETTO.Console.debugLog(CLEAR_CANVAS);
			var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
			GEPPETTO.FE.update(webGLStarted);
			break;
			//Error loading simulation, invalid url or simulation file 
		case MESSAGE_TYPE.ERROR_LOADING_SIM:
			$('#loadingmodal').modal('hide');
			$('#start').attr('disabled', 'disabled');
			GEPPETTO.FE.infoDialog(INVALID_SIMULATION_FILE, payload.message);
			break;
		case MESSAGE_TYPE.GEPPETTO_VERSION:
			var version = payload.geppetto_version;
			var geppettoVersion = GEPPETTO_VERSION_HOLDER.replace("$1", version);
			GEPPETTO.Console.log(geppettoVersion);
			break;
			//Notify user with alert they are now in Observer mode
		case MESSAGE_TYPE.OBSERVER_MODE:
			GEPPETTO.FE.observersAlert(OBSERVING_MODE, payload.alertMessage, payload.popoverMessage);
			break;
			//Read the Parameters passed in url
		case MESSAGE_TYPE.READ_URL_PARAMS:
			GEPPETTO.FE.searchForURLEmbeddedSimulation();
			break;		
			//Run script
		case MESSAGE_TYPE.RUN_SCRIPT:
			GEPPETTO.ScriptRunner.runScript(payload.run_script);
			break;
			//Simulation server became available
		case MESSAGE_TYPE.SERVER_AVAILABLE:
			GEPPETTO.FE.infoDialog(SERVER_AVAILABLE, payload.message);
			$("#multiUserNotification").modal('hide');
			break;
			//Simulation server already in use
		case MESSAGE_TYPE.SERVER_UNAVAILABLE:
			GEPPETTO.FE.disableSimulationControls();
			GEPPETTO.FE.observersDialog(SERVER_UNAVAILABLE, payload.message);
			break;
		default:

			break;
		}
	};
})();