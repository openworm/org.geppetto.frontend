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
 * @fileoverview Simulation layer of Geppetto frontend
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 */

/**
 * Base class
 */

GEPPETTO.Simulation = GEPPETTO.Simulation ||
{
	REVISION : '1'
};

GEPPETTO.Simulation.StatusEnum =
{
	INIT : 0,
	LOADED : 1,
	STARTED : 2,
	PAUSED : 3,
	OBSERVED: 4
};


GEPPETTO.Simulation.init = function()
{
	GEPPETTO.Simulation.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');
	GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.INIT;
	Console.log('Geppetto Simulation Initialised');
};

GEPPETTO.Simulation.getStatus = function()
{
	return GEPPETTO.Simulation.status;
};

GEPPETTO.Simulation.start = function()
{
	GEPPETTO.Simulation.socket.send("start");

	GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.STARTED;
	Console.log('Sent: Simulation started');
};

GEPPETTO.Simulation.pause = function()
{
	GEPPETTO.Simulation.socket.send("pause");
	GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.PAUSED;
	Console.log('Sent: Simulation paused');
};

GEPPETTO.Simulation.stop = function()
{
	GEPPETTO.Simulation.socket.send("stop");
	GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.LOADED;
	Console.log('Sent: Simulation stopped');
};

GEPPETTO.Simulation.observe = function()
{
	//Create canvas for observing visitor
	GEPPETTO.init(FE.createContainer(), FE.update);
	GEPPETTO.animate();	
	GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.OBSERVED;
	GEPPETTO.Simulation.socket.send("observe");
	Console.log('Sent: Simulation being observed');
};

GEPPETTO.Simulation.load = function(url)
{
	GEPPETTO.init(FE.createContainer(), FE.update);
	if (GEPPETTO.Simulation.status == GEPPETTO.Simulation.StatusEnum.INIT)
	{
		//we call it only the first time
		GEPPETTO.animate();
	}
	GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.LOADED;
	GEPPETTO.Simulation.simulationURL = url;
	GEPPETTO.Simulation.socket.send("init$" + url);
	Console.log('Sent: Simulation loaded');
};

GEPPETTO.Simulation.connect = (function(host)
{
	if ('WebSocket' in window)
	{
		GEPPETTO.Simulation.socket = new WebSocket(host);
	}
	else if ('MozWebSocket' in window)
	{
		GEPPETTO.Simulation.socket = new MozWebSocket(host);
	}
	else
	{
		Console.log('Error: WebSocket is not supported by this browser.');
		return;
	}

	GEPPETTO.Simulation.socket.onopen = function()
	{
		Console.log('Info: WebSocket connection opened.');
	};

	GEPPETTO.Simulation.socket.onclose = function()
	{
		Console.log('Info: WebSocket closed.');
	};

	GEPPETTO.Simulation.socket.onmessage = function(msg)
	{
		var parsedServerMessage = JSON.parse(msg.data);
		
		//Parsed incoming message
		switch(parsedServerMessage.type){
			//Simulation server already in use
			case "server_unavailable":
			    FE.disableSimulationControls();
				FE.observersDialog("Server Unavailable", parsedServerMessage.text);
				break;
			//Simulation server became available
			case "server_available":
				FE.infoDialog("Server Available", parsedServerMessage.text);
				break;
			//Notify user with alert they are now in Observer mode
			case "observer_mode_alert":
				FE.observersAlert("Geppetto Simulation Information", parsedServerMessage.alertMessage, parsedServerMessage.popoverMessage);
				break;
			//Clean the canvas, used after loading different model
			case "clean_canvas":
				GEPPETTO.init(FE.createContainer(), FE.update);
				break;
			default:
				//GEPPETTO.log("End parsing data");
				if (!GEPPETTO.isScenePopulated())
				{
					// the first time we need to create the objects
					GEPPETTO.populateScene(parsedServerMessage);
				}
				else
				{
					// any other time we just update them
					GEPPETTO.updateJSONScene(parsedServerMessage);
				}
				break;
		}
	};
});

var Console =
{};

Console.log = (function(message)
{
	var console = document.getElementById('console');
	var p = document.createElement('p');
	p.style.wordWrap = 'break-word';
	p.innerHTML = message;
	console.appendChild(p);
	while (console.childNodes.length > 25)
	{
		console.removeChild(console.firstChild);
	}
	console.scrollTop = console.scrollHeight;
});

var FE = FE ||
{};

FE.createContainer = function()
{
	$("#sim canvas").remove();
	return $("#sim").get(0);
};

/**
 * update
 */
FE.update = function()
{

};

/**
 * Show dialog informing users of server being used and
 * gives them the option to Observer ongoing simulation.
 * 
 * @param msg
 */
FE.observersDialog = function(title, msg)
{
	var messageDiv= FE.createDialogDiv(title,msg);
	$(messageDiv).dialog({
	      modal: true,
	      buttons: {
	        Observe: function() {
	          $( this ).dialog("close");
	          //Send observe message on click
	          GEPPETTO.Simulation.observe();
	        }
	      }
	    });		                             
};

/**
 * Basic Dialog box with message to display.
 * 
 * @param title - Title of message
 * @param msg - Message to display
 */
FE.infoDialog = function(title, msg)
{
	//Create a div to display the message
	var div = FE.createDialogDiv(title,msg);	
	//Show the dialog
	$(div).dialog({
	      modal: true,
	      buttons: {
	        Ok: function() {
	          $( this ).dialog( "close" );
	        }
	      }
	});
};

/**
 * Create div element to be used for dialogs.
 * 
 * @param title
 * @param msg
 * @returns
 */
FE.createDialogDiv = function(title, msg)
{
	//Create a div to display the message
	var div = $('<div id="dialog-message" title="'+ title +'"><p>'+msg+'</p></div>');
	
	return div;
};

/**
 * Create bootstrap alert to notify users
 * 
 * @param titleMsg
 * @param alertMsg
 * @param popoverMsg
 */
FE.observersAlert = function(titleMsg, alertMsg, popoverMsg)
{
	var alertDiv = $('<div id="infoalert" class="alert alert-block">'+
						'<a class="close" data-dismiss="alert">×</a>'+
						'<h4 class="alert-heading" align="center">Observing Simulation Mode</h4>'+
						'<p><img src="images/icons/info-icon.png" id="infopopover" rel="popover" align="left" width="42" height="42">'+
						alertMsg+'</p>'+
					'</div>');
	$(alertDiv).appendTo('#sim_toolbar');
	
	$("#infopopover").popover({title: titleMsg, 
							   content: popoverMsg, 
							   placement: 'left', 
							   trigger:'hover'});  
};


/**
 * If simulation is being controlled by another user, hide the 
 * control and load buttons. Show "Observe" button only.
 */
FE.disableSimulationControls = function()
{
	$('#loadSimModal').attr('disabled','disabled');
	$('#openload').attr('disabled', 'disabled');
	$('#start').attr('disabled', 'disabled');
	$('#pause').attr('disabled', 'disabled');
	$('#stop').attr('disabled', 'disabled');
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
		if (GEPPETTO.Simulation.status == GEPPETTO.Simulation.StatusEnum.STARTED || GEPPETTO.Simulation.status == GEPPETTO.Simulation.StatusEnum.PAUSED)
		{
			GEPPETTO.Simulation.stop();
		}
		GEPPETTO.Simulation.load($('#url').val());
	});

	GEPPETTO.Simulation.init();
});
