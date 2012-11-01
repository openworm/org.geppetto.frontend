/**
 * @fileoverview Initiates/stops a generic simulation.
 * 
 * @author gleb.kuznetsov@gmail.com (Gleb Kuznetsov)
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 */

// ============================================================================
// Setup the WebSocket Stuff.
// ============================================================================

// Construct the WebSocket connection.
var websocket = new WebSocket('');

websocket.initialize = function() {
	websocket.connect('ws://' + window.location.host + '/org.openworm.simulationengine.simulation/SimulationServlet');
};

websocket.stop = function() {
	websocket.send("stop");
	Console.log('Sent: Stop simulation');
};

websocket.start = function() {
	websocket.socket.send("start");
	Console.log('Sent: Start simulation');
};

websocket.onopen = function(e)
{
	onOpen(e);
};
websocket.onclose = function(e)
{
	onClose(e);
};
websocket.onmessage = function(e)
{
	onMessage(e);
};
websocket.onerror = function(e)
{
	onError(e);
};

function onOpen(e)
{
	window.console.log('CONNECTED');
}

function onClose(e)
{
	window.console.log('DISCONNECTED');
}

function onMessage(e)
{
	switch (msg.type)
	{
	case 'scene_updated':
		if (!OW.jsonscene)
		{
			OW.init(FE.createContainer(), msg.data, FE.update);
			OW.animate();
		}
		else
		{
			OW.updateJSONScene(msg.data);
		}
		break;
	default:
		window.console.log('Client does not understand message from server', msg);
		break;
	}
}

function onError(e)
{
	window.console.log('WebSockets error.');
}

var FE = FE || {};

FE.createContainer = function()
{
	// create the container
	container = document.createElement('div');
	document.body.appendChild(container);
	return container;
};

/**
 * update
 */
FE.update = function()
{
	//OW.setupScene(); //Bold, recreating the scene, maybe will do for now.
};

//============================================================================
// Application logic.
//============================================================================

$(document).ready(function()
{
	$('#stop').attr('disabled', 'disabled');

	$('#start').click(function() {
		$('#start').attr('disabled', 'disabled');
		$('#stop').removeAttr('disabled');
		websocket.start();
	});

	$('#stop').click(function() {
		$('#start').removeAttr('disabled');
		$('#stop').attr('disabled', 'disabled');
		websocket.stop();
	});
	
	websocket.initialize();
});
