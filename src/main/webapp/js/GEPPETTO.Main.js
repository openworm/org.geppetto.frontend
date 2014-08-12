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
 * Main class for handling user interface evens associated with: Simulation Controls,
 * alert & info messages, and server side communication
 *
 * @constructor
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {
		var $ = require('jquery'),
		React = require('react'),
		InfoModal = require('jsx!components/popups/InfoModal');

		GEPPETTO.Main = {

			StatusEnum: {
				DEFAULT: 0,
				CONTROLLING: 1,
				OBSERVING: 2
			},

			idleTime: 0,
			disconnected: false,
			status: 0,
			simulationFileTemplate: "resources/template.xml",
			getVisitorStatus: function() {
				return this.status;
			},

			/**
			 * Initialize web socket communication
			 */
			init: function() {
				GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/GeppettoServlet');
				GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.INIT;
				GEPPETTO.Console.debugLog(GEPPETTO.Resources.GEPPETTO_INITIALIZED);
			},
			
			/**
			 * Idle check
			 */
			idleCheck : function(){
				var allowedTime = 2, timeOut = 4;
				if(!GEPPETTO.Main.disconnected) {
					GEPPETTO.Main.idleTime = GEPPETTO.Main.idleTime + 1;
					//first time check, asks if user is still there
					if(GEPPETTO.Main.idleTime > allowedTime) { // 5 minutes
                        var infomodalBtn = $('#infomodal-btn');

        	            React.renderComponent(InfoModal({show:true, keyboard:false}), document.getElementById('modal-region'));
						$('#infomodal-title').html("Zzz");
						$('#infomodal-text').html(GEPPETTO.Resources.IDLE_MESSAGE);
						infomodalBtn.html("Yes");

						infomodalBtn.html("Yes").click(function() {
							$('#infomodal').modal('hide');
							GEPPETTO.Main.idleTime = 0;

							//unbind click event so we can reuse same modal for other alerts
							infomodalBtn.unbind('click');
						});                                         
					}

					//second check, user isn't there or didn't click yes, disconnect
					if(GEPPETTO.Main.idleTime > timeOut) {
        	            React.renderComponent(InfoModal({show:true, keyboard:false}), document.getElementById('modal-region'));
						$('#infomodal-title').html("");
						$('#infomodal-text').html(GEPPETTO.Resources.DISCONNECT_MESSAGE);
						$('#infomodal-footer').remove();
						$('#infomodal-header').remove();
						
						GEPPETTO.Main.idleTime = 0;
						GEPPETTO.Main.disconnected = true;
						GEPPETTO.FE.disableSimulationControls();
						GEPPETTO.MessageSocket.send("idle_user", null);
						var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
						GEPPETTO.FE.update(webGLStarted);
					}
				}
			},

			/**
			 * Add user as an observer to an ongoing simulation. Create
			 * webGL container and notify servlet about new member that is becoming an observer.
			 */
			observe: function() {
				//Create canvas for observing visitor
				var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());

				//Allow user to observe only if wegbl container was created
				if(webGLStarted) {
					GEPPETTO.animate();
					GEPPETTO.MessageSocket.send("observe", null);
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.SIMULATION_OBSERVED);
				}

				//update the UI based on success of webgl
				GEPPETTO.FE.update(webGLStarted);
			}
		};

// ============================================================================
// Application logic.
// ============================================================================

		$(document).ready(function() {

			GEPPETTO.FE.initialEvents();
			
			//Increment the idle time counter every minute.
			setInterval(GEPPETTO.Main.idleCheck, 60000); // 1 minute
            var here = $(this);
			//Zero the idle timer on mouse movement.
			here.mousemove(function(e) {
				GEPPETTO.Main.idleTime = 0;
			});
			here.keypress(function(e) {
				GEPPETTO.Main.idleTime = 0;
			});

			//Create canvas 
			var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());

			//make sure webgl started correctly
			if(!webGLStarted) {
				//TODO: Display message if doesn't support webgl
			}

			//Initialize websocket functionality
			GEPPETTO.Main.init();
		
		});
	};
});
