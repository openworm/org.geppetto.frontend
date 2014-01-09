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
 * Main class for handling user interface evens associated with: Simulation Controls, 
 * alert & info messages, and server side communication
 * 
 * @constructor
 * 
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
GEPPETTO.Main = GEPPETTO.Main ||
{
	REVISION : '1'
};

GEPPETTO.Main.StatusEnum =
{
	DEFAULT : 0,
	CONTROLLING : 1, 
	OBSERVING : 2, 	
};

GEPPETTO.Main.status = GEPPETTO.Main.StatusEnum.DEFAULT;

GEPPETTO.Main.simulationFileTemplate = "resources/template.xml";

GEPPETTO.Main.getVisitorStatus = function(){
	return GEPPETTO.Main.status;
};

GEPPETTO.Main.idleTime = 0;
GEPPETTO.Main.disconnected = false;

/**
 * Initialize web socket communication
 */
GEPPETTO.Main.init = function()
{
	GEPPETTO.MessageSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/GeppettoServlet');
	Simulation.status = Simulation.StatusEnum.INIT;
	GEPPETTO.Console.debugLog(GEPPETTO_INITIALIZED);	
};

/**
 * Add user as an observer to an ongoing simulation. Create 
 * webGL container and notify servlet about new member that is becoming an observer.
 */
GEPPETTO.Main.observe = function()
{
	//Create canvas for observing visitor
	var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
	
	//Allow user to observe only if wegbl container was created
	if(webGLStarted){
		GEPPETTO.animate();	
		GEPPETTO.MessageSocket.send("observe", null);
		GEPPETTO.Console.debugLog(SIMULATION_OBSERVED);
	}
	
	//update the UI based on success of webgl 
	GEPPETTO.FE.update(webGLStarted);
};

function idleCheck() {
	if(!GEPPETTO.Main.disconnected){
		GEPPETTO.Main.idleTime = GEPPETTO.Main.idleTime + 1;
		//first time check, asks if user is still there
		if (GEPPETTO.Main.idleTime > 1) { // 5 minutes
			$('#infomodal-title').html("Zzz");
			$('#infomodal-text').html(idleMessage);
			$('#infomodal-btn').html("Yes");
			
			$('#infomodal-btn').html("Yes").click(function() {
				$('#infomodal').modal('hide');
				GEPPETTO.Main.idleTime = 0; 
				
				//unbind click event so we can reuse same modal for other alerts
				$('#infomodal-btn').unbind('click');
			});
			
			$('#infomodal').modal(); 
		}

		//second check, user isn't there or didn't click yes, disconnect
		if(GEPPETTO.Main.idleTime > 2) {
			$('#infomodal-title').html("");
			$('#infomodal-text').html(disconnectMessage);
			$('#infomodal-footer').remove();
			$('#infomodal-header').remove();
			$('#infomodal').modal(); 
			
			GEPPETTO.Main.idleTime = 0;
			GEPPETTO.Main.disconnected = true;
			GEPPETTO.FE.disableSimulationControls();
			GEPPETTO.MessageSocket.send("idle_user",null);
			var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
			GEPPETTO.FE.update(webGLStarted);
		}
	}
}


// ============================================================================
// Application logic.
// ============================================================================
$(document).ready(function()
{	
	/*
	 * Dude to bootstrap bug, multiple modals can't be open at same time. This line allows 
	 * multiple modals to be open simultaneously without going in an infinite loop. 
	 */
	$.fn.modal.Constructor.prototype.enforceFocus = function () {};
	
	//Initialize websocket functionality
	GEPPETTO.Main.init();
	
	//Populate the 'loading simulation' modal's drop down menu with sample simulations
	$('#loadSimModal').on('shown', GEPPETTO.FE.loadingModalUIUpdate());
	$('#start').attr('disabled', 'disabled');
	$('#pause').attr('disabled', 'disabled');
	$('#stop').attr('disabled', 'disabled');
	
	$('#start').click(function()
	{
		GEPPETTO.Console.executeCommand("Simulation.start()");
	});

	$('#pause').click(function()
	{
		GEPPETTO.Console.executeCommand("Simulation.pause()");
	});
	
	$('#stop').click(function()
	{
		GEPPETTO.Console.executeCommand("Simulation.stop()");
	});
	
	$('#load').click(function()
	{	
		//Update the simulation controls visibility
		GEPPETTO.FE.updateLoadEvent();
		
		//loading from simulation file editor's
		if(GEPPETTO.SimulationContentEditor.isEditing()){
			var simulation = GEPPETTO.SimulationContentEditor.getEditedSimulation().replace(/\s+/g, ' ');;
			
			GEPPETTO.Console.executeCommand("Simulation.loadFromContent('"+simulation+"')");
			GEPPETTO.SimulationContentEditor.setEditing(false);
		}
		//loading simulation url
		else{
			GEPPETTO.Console.executeCommand('Simulation.load("'+$('#url').val()+'")');
		}
		
		$('#loadSimModal').modal("hide");
	});

	GEPPETTO.Console.createConsole();

	GEPPETTO.FE.checkWelcomeMessageCookie();
	
	$("#share").click(function(){
        $(".share-panel").slideToggle();
        $(this).toggleClass("active"); return false;
    });
	
	 //Increment the idle time counter every minute.
    var idleInterval = setInterval(idleCheck, 60000); // 1 minute

    //Zero the idle timer on mouse movement.
    $(this).mousemove(function (e) {
        GEPPETTO.Main.idleTime = 0;
    });
    $(this).keypress(function (e) {
        GEPPETTO.Main.idleTime = 0;
    });
});
