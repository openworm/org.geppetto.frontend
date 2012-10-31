/**
 * @fileoverview Script that runs the particles demo with a mocked-out WebSocket
 *               connection (all client-side).
 * 
 * The state of the simulation, e.g. particle positions, is stored on the
 * server. The server sends messages to the client via the WebSocket connection
 * updating the positions of the particles. Meanwhile an animation loop runs on
 * the client-side to update the view. As a starting point, we can make the
 * server updates faster than the animation loop updates. However, we need to
 * think about what happens, if anything, when the server ever lags behind the
 * animation loop.
 * 
 * @author gleb.kuznetsov@gmail.com (Gleb Kuznetsov)
 */

$(document).ready(function()
{
	websocket.send("start");
});

// ============================================================================
// Setup the WebSocket connection.
// ============================================================================

// Mock out the built-in WebSocket constructor.
window['WebSocket'] = openworm.FakeWebSocketClient;

// Construct the WebSocket connection.
websocket = new WebSocket('');

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
