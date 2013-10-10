GEPPETTO.MessageSocket = GEPPETTO.MessageSocket ||
	{
		REVISION : '1'
	};

/**
 * Web socket creation and communication
 */
GEPPETTO.MessageSocket.connect = (function(host)
{
	if ('WebSocket' in window)
	{
		GEPPETTO.MessageSocket.socket = new WebSocket(host);
	}
	else if ('MozWebSocket' in window)
	{
		GEPPETTO.MessageSocket.socket = new MozWebSocket(host);
	}
	else
	{
		GEPPETTO.Console.debugLog(WEBSOCKET_NOT_SUPPORTED);
		return;
	}

	GEPPETTO.MessageSocket.socket.onopen = function()
	{
		GEPPETTO.Console.debugLog(WEBSOCKET_OPENED);
		
	};

	GEPPETTO.MessageSocket.socket.onclose = function()
	{
		GEPPETTO.Console.debugLog(WEBSOCKET_CLOSED);
	};

	GEPPETTO.MessageSocket.socket.onmessage = function(msg)
	{		
		var parsedServerMessage = JSON.parse(msg.data);
		// parsed message has a type and data fields - data contains the payload of the message
		var payload = JSON.parse(parsedServerMessage.data);
		
		// Switch based on parsed incoming message type
		switch(parsedServerMessage.type){
			//clear canvas, used when loading a new model or re-loading previous one
			case "reload_canvas":
				GEPPETTO.Console.debugLog(CLEAR_CANVAS);
				var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
				GEPPETTO.FE.update(webGLStarted);
				break;
			//Error loading simulation, invalid url or simulation file 
			case "error_loading_simulation":
				$('#loadingmodal').modal('hide');
				$('#start').attr('disabled', 'disabled');
				GEPPETTO.FE.infoDialog(INVALID_SIMULATION_FILE, payload.message);
				break;
			case "geppetto_version":
				var version = payload.geppetto_version;
				var geppettoVersion = GEPPETTO_VERSION_HOLDER.replace("$1", version);
				GEPPETTO.Console.log(geppettoVersion);
				break;
			//Simulation has been loaded and model need to be loaded
			case "load_model":
				GEPPETTO.Console.debugLog(LOADING_MODEL);
				var entities = JSON.parse(payload.entities);
								
				//Populate scene
				GEPPETTO.populateScene(entities);
				break;
			//Notify user with alert they are now in Observer mode
			case "observer_mode_alert":
				GEPPETTO.FE.observersAlert(OBSERVING_MODE, payload.alertMessage, payload.popoverMessage);
				break;
			//Read the Parameters passed in url
			case "read_url_parameters":
				GEPPETTO.FE.searchForURLEmbeddedSimulation();
				break;		
				//Run script
			case "run_script":
				runScript(payload.run_script);
				break;
			//Event received to update the simulation
			case "scene_update":
				var entities = JSON.parse(payload.entities);
				//Update if simulation hasn't been stopped
				if(Simulation.status != Simulation.StatusEnum.STOPPED && GEPPETTO.isCanvasCreated()){
					if (!GEPPETTO.isScenePopulated())
					{				
						// the first time we need to create the object.s
						GEPPETTO.populateScene(entities);
					}
					else
					{					
						// any other time we just update them
						GEPPETTO.updateJSONScene(entities);
					}
				}
				break;
			//Simulation server became available
			case "server_available":
				GEPPETTO.FE.infoDialog(SERVER_AVAILABLE, payload.message);
				break;
			//Simulation server already in use
			case "server_unavailable":
			    GEPPETTO.FE.disableSimulationControls();
				GEPPETTO.FE.observersDialog(SERVER_UNAVAILABLE, payload.message);
				break;
			//Simulation configuration retrieved from server
			case "simulation_configuration":
				//Load simulation file into display area
				GEPPETTO.SimulationContentEditor.loadSimulationInfo(payload.configuration);
				//Auto Format Simulation FIle display
				GEPPETTO.SimulationContentEditor.autoFormat();
				break;
			//Simulation has been loaded, enable start button and remove loading panel
			case "simulation_loaded":
				$('#start').removeAttr('disabled');
				$('#loadingmodal').modal('hide');
				break;
			//Simulation has been started, enable pause button
			case "simulation_started":
				GEPPETTO.FE.updateStartEvent();
				break;
			default:
				
				break;
		}
	};
});
