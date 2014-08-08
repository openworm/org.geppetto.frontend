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
 * Front end, user interface, methods for handling updates to the UI
 *
 * @constructor
 */
define(function(require) {

	return function(GEPPETTO) {

		var $ = require('jquery');
		/**
		 * Create the container for holding the canvas
		 *
		 * @returns {DivElement}
		 */
		GEPPETTO.FE = {
				
			/*
			 * Handles events that are executed as soon as page is finished loading
			 */
			initialEvents : function(){
				
				GEPPETTO.Console.createConsole();
				
				GEPPETTO.Vanilla.enableKeyboard(false);
								
				/*
				 * Dude to bootstrap bug, multiple modals can't be open at same time. This line allows
				 * multiple modals to be open simultaneously without going in an infinite loop.
				 */
				$.fn.modal.Constructor.prototype.enforceFocus = function() {};

                var share = $("#share");

				share.click(function() {

					//toggle button class
					share.toggleClass('clicked');

					//user has clicked the console button
                    var command = (share.hasClass('clicked')) ? "true" : "false";
					GEPPETTO.Console.executeCommand("G.showShareBar("+command+")");
					return false;
				});
				
			},
			
			/**
			 * Enables controls after connection is established
			 */
			postSocketConnection : function(){
				GEPPETTO.Vanilla.enableKeyboard(true);
			},
			
			createContainer: function() {
				$("#sim canvas").remove();
				return $("#sim").get(0);
			},
			
			/**
			 * Handles updating the front end after re-loading the simulation
			 */
			SimulationReloaded: function() {
				//delete all existing widgets
				GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE);
			},

			/**
			 * Show error message if webgl failed to start
			 */
			update: function(webGLStarted) {
				//
				if(!webGLStarted) {
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.WEBGL_FAILED);
					GEPPETTO.FE.disableSimulationControls();
				}
			},

			/**
			 * Show dialog informing users of server being used and
			 * gives them the option to Observer ongoing simulation.
			 *
			 * @param msg
			 */
			observersDialog: function(title, msg) {
				$('#infomodal-title').html(title);
				$('#infomodal-text').html(msg);
				$('#infomodal-btn').html("<i class='icon-eye-open '></i> Observe").click(function() {
					GEPPETTO.Main.observe();

					//unbind click event so we can reuse same modal for other alerts
					$('#infomodal-btn').unbind('click');
				});
				$('#infomodal').modal();

				//black out welcome message
				$('#welcomeMessageModal').css('opacity', '0.0');
			},

			/**
			 * Basic Dialog box with message to display.
			 *
			 * @method
			 *
			 * @param title - Title of message
			 * @param msg - Message to display
			 */
			infoDialog: function(title, msg) {
				$('#infomodal-title').html(title);
				$('#infomodal-text').html(msg);
				$('#infomodal-btn').html("OK").off('click');
				$('#infomodal').modal();
			},
			
			/**
			 * Dialog box to display error messages.
			 *
			 * @method
			 *
			 * @param title - Notifying error
			 * @param msg - Message to display for error
			 * @param code - Error code of message
			 * @param source - Source error to display
			 * @param exception - Exception to display
			 */
			errorDialog: function(title, msg, code, source, exception) {
				$('#errormodal-title').html(title);
				$('#errormodal-text').html(msg);
				$('#error_code').html("> Error Code: "+code);
				if(source!=""){
					$('#error_source').html("Source : " +source);
				}
				if(exception !=""){
					$('#error_exception').html("Exception : " + exception);
				}
				$('#errormodal-btn').html("OK").off('click');
				$('#errormodal').modal();
			},

			/**
			 * Create bootstrap alert to notify users they are in observer mode
			 *
			 * @param title
			 * @param alertMsg
			 * @param popoverMsg
			 */
			observersAlert: function(title, alertMsg, popoverMsg) {
				//if welcome message is open, return normal opacity after user clicked observed
				if(($('#welcomeMessageModal').hasClass('in'))) {
					$('#welcomeMessageModal').css('opacity', '1.0');
				}
				$('#alertbox-text').html(alertMsg);
				$('#alertbox').show();
				$("#infopopover").popover({title: title,
					content: popoverMsg});
			},

			/**
			 * If simulation is being controlled by another user, hide the
			 * control and load buttons. Show "Observe" button only.
			 */
			disableSimulationControls: function() {
				//Disable 'load simulation' button and click events
                var openLoad = $("#openload");
				openLoad.attr('disabled', 'disabled');
				openLoad.click(function(e) {
					return false;
				});

				$('#consoleButton').attr('disabled', 'disabled');

				//disable keyboard
				document.removeEventListener("keydown", GEPPETTO.Vanilla.checkKeyboard);
			},



			/**
			 * Show Notification letting user now of full simulator
			 */
			fullSimulatorNotification: function(simulatorName, queuePosition) {

				$('#capacityNotificationTitle').html(simulatorName + GEPPETTO.Resources.SIMULATOR_UNAVAILABLE);

				$('#queuePosition').html(queuePosition);

				$('#multiUserNotification').modal();
			}
		};

	};
});
