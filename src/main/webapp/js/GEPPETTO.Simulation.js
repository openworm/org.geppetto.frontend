/**
 * @fileoverview Simulation layer of Geppetto frontend
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 */

/**
 * Base class
 */

GEPPETTO.Simulation = GEPPETTO.Simulation || { REVISION: '1' };

GEPPETTO.Simulation.StatusEnum = {
    INIT : 0,
    LOADED : 1,
    STARTED : 2,
    PAUSED : 3
};

GEPPETTO.Simulation.init = function() {
	GEPPETTO.Simulation.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');
	GEPPETTO.Simulation.status=GEPPETTO.Simulation.StatusEnum.INIT;
	Console.log('Geppetto Simulation Initialised');
};

GEPPETTO.Simulation.getStatus = function() {
	return  GEPPETTO.Simulation.status;
};

GEPPETTO.Simulation.start = function() {
	GEPPETTO.Simulation.socket.send("start");
	GEPPETTO.Simulation.status=GEPPETTO.Simulation.StatusEnum.STARTED;
	Console.log('Sent: Simulation started');
};

GEPPETTO.Simulation.pause = function() {
	GEPPETTO.Simulation.socket.send("pause");
	GEPPETTO.Simulation.status=GEPPETTO.Simulation.StatusEnum.PAUSED;
	Console.log('Sent: Simulation paused');
};

GEPPETTO.Simulation.stop = function() {
	GEPPETTO.Simulation.socket.send("stop");
	GEPPETTO.Simulation.status=GEPPETTO.Simulation.StatusEnum.LOADED;
	Console.log('Sent: Simulation stopped');
};

GEPPETTO.Simulation.load = function(url) {
	if(GEPPETTO.Simulation.getStatus()==GEPPETTO.Simulation.StatusEnum.STARTED)
	{
		GEPPETTO.Simulation.reset();
		GEPPETTO.resetScene();
	}
	GEPPETTO.Simulation.status=GEPPETTO.Simulation.StatusEnum.LOADED;
	GEPPETTO.Simulation.simulationURL=url;
	GEPPETTO.Simulation.socket.send("init$"+url);
	Console.log('Sent: Simulation loaded');
} ;
	
GEPPETTO.Simulation.connect = (function(host) {
	if ('WebSocket' in window) {
		GEPPETTO.Simulation.socket = new WebSocket(host);
	} else if ('MozWebSocket' in window) {
		GEPPETTO.Simulation.socket = new MozWebSocket(host);
	} else {
		Console.log('Error: WebSocket is not supported by this browser.');
		return;
	}

	GEPPETTO.Simulation.socket.onopen = function() {
		Console.log('Info: WebSocket connection opened.');
		
	};

	GEPPETTO.Simulation.socket.onclose = function() {
		Console.log('Info: WebSocket closed.');
		GEPPETTO.Simulation.pause();
	};

	GEPPETTO.Simulation.socket.onmessage = function(msg) {
		if (!GEPPETTO.jsonscene)
		{
			GEPPETTO.init(FE.createContainer(), JSON.parse(msg.data), FE.update);
			GEPPETTO.animate();
		}
		else
		{
			GEPPETTO.updateJSONScene(JSON.parse(msg.data));
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
	// OW.setupScene(); // recreating the scene, maybe will do for now.
};

// ============================================================================
// Application logic.
// ============================================================================

$(document).ready(function()
{
	$('#start').attr('disabled', 'disabled');
	$('#pause').attr('disabled', 'disabled');
	$('#stop').attr('disabled', 'disabled');

	$('#start').click(function()
	{
		$('#start').attr('disabled', 'disabled');
		$('#pause').removeAttr('disabled');
		$('#stop').attr('disabled', 'disabled');
		GEPPETTO.Simulation.start();
	});

	$('#pause').click(function()
	{
		$('#start').removeAttr('disabled');
		$('#pause').attr('disabled', 'disabled');
		$('#stop').removeAttr('disabled');
		GEPPETTO.Simulation.pause();
	});
	
	$('#stop').click(function()
	{
		$('#start').removeAttr('disabled');
		$('#pause').attr('disabled', 'disabled');
		$('#stop').attr('disabled', 'disabled');
		GEPPETTO.Simulation.stop();
	});
	
	$('#load').click(function()
	{
		$('#start').removeAttr('disabled');
		$('#pause').attr('disabled', 'disabled');
		$('#stop').attr('disabled', 'disabled');
		$('#loadSimModal').modal("hide");
		GEPPETTO.Simulation.load($('#url').val());
	});

	GEPPETTO.Simulation.init();
});
