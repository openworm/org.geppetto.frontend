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
				
				//disable welcome message buttons
				$('#skipTutorial').attr('disabled', 'disabled');
				$('#startTutorial').attr('disabled', 'disabled');
				//disable simulation controls
				$('#start').attr('disabled', 'disabled');
				$('#pause').attr('disabled', 'disabled');
				$('#stop').attr('disabled', 'disabled');
				$('#openload').attr('disabled', 'disabled');
				//disable keyboard controls
				GEPPETTO.Vanilla.enableKeyboard(false);
				
				GEPPETTO.FE.checkWelcomeMessageCookie();

				/*
				 * Dude to bootstrap bug, multiple modals can't be open at same time. This line allows
				 * multiple modals to be open simultaneously without going in an infinite loop.
				 */
				$.fn.modal.Constructor.prototype.enforceFocus = function() {};

				//Populate the 'loading simulation' modal's drop down menu with sample simulations
				$('#loadSimModal').on('shown', GEPPETTO.FE.loadingModalUIUpdate());
				
				$('#start').click(function() {
					GEPPETTO.Console.executeCommand("Simulation.start()");
				});

				$('#pause').click(function() {
					GEPPETTO.Console.executeCommand("Simulation.pause()");
				});

				$('#stop').click(function() {
					GEPPETTO.Console.executeCommand("Simulation.stop()");
				});

				$('#load').click(function() {
					//Update the simulation controls visibility
					GEPPETTO.FE.updateLoadEvent();
					//loading from simulation file editor's
					if(GEPPETTO.SimulationContentEditor.isEditing()) {
						var simulation = GEPPETTO.SimulationContentEditor.getEditedSimulation().replace(/\s+/g, ' ');
						GEPPETTO.Console.executeCommand("Simulation.loadFromContent('" + simulation + "')");
						GEPPETTO.SimulationContentEditor.setEditing(false);
					}
					//loading simulation url
					else {
						GEPPETTO.Console.executeCommand('Simulation.load("' + $('#url').val() + '")');
					}

					$('#loadSimModal').modal("hide");
				});

				$("#share").click(function() {
					
					//toggle button class
					$('#share').toggleClass('clicked');

					//user has clicked the console button
					if($('#share').hasClass('clicked')) {
						GEPPETTO.Console.executeCommand('G.showShareBar(true)');
					}
					else {
						GEPPETTO.Console.executeCommand('G.showShareBar(false)');
					}
					return false;
				});
			},
			
			/**
			 * Enables controls after connection is established
			 */
			postSocketConnection : function(){
				//change welcome message button from Loading... to Start
				$('#startTutorial').html("Start Tutorial");
				$('#startTutorial').removeAttr('disabled');
				$('#skipTutorial').removeAttr('disabled');
				$('#openload').removeAttr('disabled');
				//enable keyboard controls
				GEPPETTO.Vanilla.enableKeyboard(false);
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
					GEPPETTO.Console.debugLog(WEBGL_FAILED);
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
			 * Look for Simulations that may have been embedded as parameter in the URL
			 */
			searchForURLEmbeddedSimulation: function() {
				//Get the URL with which Geppetto was loaded
				var urlLocation = window.location.href;
				//Split url looking for simulation parameters
				var vars = urlLocation.split("?sim=");

				//Load simulation if simulation parameters where found
				if(vars.length > 1) {
					var urlVal = decodeURIComponent(vars[1]);
					$('#url').val(urlVal);
					//Simulation found, load it
					GEPPETTO.Console.executeCommand('Simulation.load("' + urlVal + '")');
				}
			},

			/**
			 * Populate Load Modal with drop down menu of
			 * predefined sample simulations stored in JSON file.
			 *
			 */
			loadingModalUIUpdate: function() {
				//Read JSON file storing predefined sample simulations
				$.getJSON('resources/PredefinedSimulations.json', function(json) {

					//Get access to <ul> html element in load modal to add list items
					var ul = document.getElementById('dropdownmenu');

					//Loop through simulations found in JSON file
					for(var i in json.simulations) {
						//Create <li> element and add url attribute storing simulation's url
						var li = document.createElement('li');
						li.setAttribute('url', json.simulations[i].url);

						//Create <a> element to add simulation name, add to <li> element
						var a = document.createElement('a');
						a.innerHTML = json.simulations[i].name;
						li.appendChild(a);

						//Add <li> element to load modal's dropdownmenu
						if(ul != null) {
							ul.appendChild(li);
						}
					}

					//Add click listener to sample simulations dropdown menu
					$('#dropdownmenu li').click(function() {

						GEPPETTO.SimulationContentEditor.setEditing(false);

						//Get the name and url of selected simulation
						var selectedURL = $(this).attr('url');
						var selectedName = $(this).text();

						//Add selected simulation's url to URL input field
						$('#url').val(selectedURL);
						//Change drop down menu name to selected simulation's name
						$('#dropdowndisplaytext').html(selectedName);

						GEPPETTO.Main.simulationFileTemplate = selectedURL;

						//Custom Content editor is visible, update with new sample simulation chosen
						if($('#customRadio').val() == "active") {
							GEPPETTO.FE.updateEditor(selectedURL);
						}
					});

					$('#url').keydown(function() {
						//reset sample drop down menu if url field modified
						$('#dropdowndisplaytext').html("Select simulation from list...");

						//reset simulation file used in editor to template
						GEPPETTO.Main.simulationFileTemplate = "resources/template.xml";
					});

				});

				//Responds to user selecting url radio button
				$("#urlRadio").click(function() {
					$('#customRadio').val("inactive");
					$('#customInputDiv').hide();
					$('#urlInput').show();
				});

				//Responds to user selecting Custom radio button
				$("#customRadio").click(function() {
					//Handles the events related the content edit area
					$('#customRadio').val("active");
					$('#urlInput').hide();
					$('#customInputDiv').show();

					//update editor with latest simulation file selected
					GEPPETTO.FE.updateEditor(GEPPETTO.Main.simulationFileTemplate);
				});

			},

			/**
			 * Updates the editor with new simulation file
			 *
			 * @param selectedSimulation
			 */
			updateEditor: function(selectedSimulation) {
				GEPPETTO.SimulationContentEditor.loadEditor();

				//load template simulation
				if(selectedSimulation == "resources/template.xml") {
					GEPPETTO.SimulationContentEditor.loadTemplateSimulation(selectedSimulation);
				}
				//load sample simulation, request info from the servlet
				else {
					GEPPETTO.MessageSocket.send("sim", selectedSimulation);
				}
			},

			/**
			 * If simulation is being controlled by another user, hide the
			 * control and load buttons. Show "Observe" button only.
			 */
			disableSimulationControls: function() {
				//Disable 'load simulation' button and click events
				$('#openload').attr('disabled', 'disabled');
				$('#openload').click(function(e) {
					return false;
				});

				$('#consoleButton').attr('disabled', 'disabled');

				//disable keyboard
				document.removeEventListener("keydown", GEPPETTO.Vanilla.checkKeyboard);
			},

			activateLoader: function(state, msg) {
				$('#loadingmodaltext').html(msg);
				$('#loadingmodal').modal(state);
			},

			/**
			 * Update the simulation controls button's visibility after
			 * user's interaction.
			 */
			updateLoadEvent: function() {
				$('#pause').attr('disabled', 'disabled');
				$('#stop').attr('disabled', 'disabled');
			},

			/**
			 * Update the simulation controls button's visibility after
			 * user's interaction.
			 */
			updateStartEvent: function() {
				$('#start').attr('disabled', 'disabled');
				$('#stop').attr('disabled', 'disabled');
				$('#pause').removeAttr('disabled');
			},

			/**
			 * Update the simulation controls button's visibility after
			 * user's interaction.
			 */
			updateStopEvent: function() {
				$('#start').removeAttr('disabled');
				$('#pause').attr('disabled', 'disabled');
				$('#stop').attr('disabled', 'disabled');
				
				//send signal to all widgets to reset data sets
				GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.RESET_DATA);
			},

			/**
			 * Update the simulation controls button's visibility after
			 * user's interaction.
			 */
			updatePauseEvent: function() {
				$('#start').removeAttr('disabled');
				$('#pause').attr('disabled', 'disabled');
				$('#stop').removeAttr('disabled');
			},

			/**
			 * Checks cookie for flag to hide welcome message at startup.
			 */
			checkWelcomeMessageCookie: function() {
				var welcomeMessageCookie = $.cookie("hideWelcomeMessage");

				if(welcomeMessageCookie != null) {
					if(!welcomeMessageCookie) {
						this.showWelcomeMessage();
					}
				}

				else {
					this.showWelcomeMessage();
				}
			},

			/**
			 * Show Welcome Message window.
			 */
			showWelcomeMessage: function() {
				$('#welcomeMessageModal').modal('show');

				//Closes welcome modal window when pressing enter
				$('#welcomeMessageModal').keydown(function(event) {
					if(event.keyCode == 13) {
						$('#welcomeMessageModal').modal('hide');
						return false;
					}
				});

				$("#skipTutorial").on("click", function(event) {
					if($('#welcomeMsgCookie').hasClass("checked")) {
						$.cookie("hideWelcomeMessage", true);
					}
				});
				
				$("#startTutorial").on("click", function(event) {
					GEPPETTO.Tutorial.startTutorial();
				});

				$('#welcomeMessageModal').on('hide', function(event) {
					if($('#welcomeMsgCookie').hasClass("checked")) {
						$.cookie("hideWelcomeMessage", true);
					}
				});

				$("#welcomeMsgCookie").on("click", function(event) {
					$(this).toggleClass('checked');
				});
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