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

var Simulation = {};

Simulation.initialize = function() {
	Simulation.connect('ws://' + window.location.host + '/org.openworm.simulationengine.frontend/SimulationServlet');
	
	Console.log('Simulation initialised');
};

Simulation.stop = function() {
	Simulation.socket.send("stop");
	Console.log('Sent: Stop simulation');
};

Simulation.start = function() {
	Simulation.socket.send("start");
	Console.log('Sent: Start simulation');
};

Simulation.reset = function() {
	Simulation.socket.send("reset");
	Console.log('Sent: Reset simulation');
};

Simulation.connect = (function(host) {
	if ('WebSocket' in window) {
		Simulation.socket = new WebSocket(host);
	} else if ('MozWebSocket' in window) {
		Simulation.socket = new MozWebSocket(host);
	} else {
		Console.log('Error: WebSocket is not supported by this browser.');
		return;
	}

	Simulation.socket.onopen = function() {
		Console.log('Info: WebSocket connection opened.');
		Simulation.socket.send("init$https://www.dropbox.com/s/72efwkb9nm7mo27/sph-sim-config-test.xml?dl=1");
		// https://www.dropbox.com/s/iyr085zcegyis0n/sph-sim-config.xml?dl=1
	};

	Simulation.socket.onclose = function() {
		Console.log('Info: WebSocket closed.');
		Simulation.stop();
	};

	Simulation.socket.onmessage = function(msg) {
		if (!OW.jsonscene)
		{
			OW.init(FE.createContainer(), JSON.parse(msg.data), FE.update);
			OW.animate();
		}
		else
		{
			OW.updateJSONScene(JSON.parse(msg.data));
		}
	};
});

var Console = {};

Console.log = (function(message) {
	var console = document.getElementById('console');
	var p = document.createElement('p');
	p.style.wordWrap = 'break-word';
	p.innerHTML = message;
	console.appendChild(p);
	while (console.childNodes.length > 25) {
		console.removeChild(console.firstChild);
	}
	console.scrollTop = console.scrollHeight;
});


var FE = FE || {};

FE.createContainer = function()
{
	// create the container
	container = document.getElementById('sim');
	return container;
};

/**
 * update
 */
FE.update = function()
{
	// OW.setupScene(); //Bold, recreating the scene, maybe will do for now.
};

// ============================================================================
// Application logic.
// ============================================================================

$(document).ready(function()
{
	$('#stop').attr('disabled', 'disabled');
	$('#reset').attr('disabled', 'disabled');

	$('#start').click(function()
	{
		$('#start').attr('disabled', 'disabled');
		$('#stop').removeAttr('disabled');
		$('#reset').attr('disabled', 'disabled');
		Simulation.start();
	});

	$('#stop').click(function()
	{
		$('#start').removeAttr('disabled');
		$('#stop').attr('disabled', 'disabled');
		$('#reset').removeAttr('disabled');
		Simulation.stop();
	});
	
	$('#reset').click(function()
	{
		$('#start').removeAttr('disabled');
		$('#stop').attr('disabled', 'disabled');
		$('#reset').attr('disabled', 'disabled');
		Simulation.reset();
	});

	Simulation.initialize();
});
