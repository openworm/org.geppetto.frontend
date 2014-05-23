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
 *
 * Class that handles creationg and loading of JS Console.
 * Handles events associated with the console as well.
 *
 * @constructor
 *
 * @author Jesus Martinez (jesus@metacell.us)
 */
define(function(require) {
	
	var console;
	
	return function(GEPPETTO) {
		var $ = require('jquery');
		/**
		 * Handles user clicking the "Javascript Console" button, which
		 * toggles the console.
		 */
		$(document).ready(function() {
			//JS Console Button clicked
			$('#consoleButton').click(function() {
				GEPPETTO.Console.toggleConsole();
			});
		});

		/**
		 * Handles autocomplete functionality for the console
		 */
		function autoComplete() {
			//get the available tags for autocompletion in console
			var tags = GEPPETTO.Utility.availableTags();

			//bind console input area to autocomplete event
			$("#commandInputArea").bind("keydown", function(event) {
				if(event.keyCode === $.ui.keyCode.TAB &&
					$(this).data("ui-autocomplete").menu.active) {
					event.preventDefault();
				}
			})
				.autocomplete({
					minLength: 0,
					source: function(request, response) {
						var matches = $.map(tags, function(tag) {
							if(tag.toUpperCase().indexOf(request.term.toUpperCase()) === 0) {
								return tag;
							}
						});
						response(matches);
					},
					focus: function() {
						// prevent value inserted on focus
						return false;
					},
					open: function(event, ui) {
                        var suggestions = $(this).data("uiAutocomplete").menu.element[0].children
                            , firstElement = suggestions[0]
							, inpt = $('#commandInputArea')
							, original = inpt.val()
							, firstElementText = $(firstElement).text()
                            , suggestionsSize = suggestions.length;
						/*
						 here we want to make sure that we're not matching something that doesn't start
						 with what was typed in
						 */
						if(firstElementText.toLowerCase().indexOf(original.toLowerCase()) === 0) {

							//only one suggestion
							if(suggestionsSize == 1) {
								if(inpt.val() !== firstElementText) {
									inpt.val(firstElementText);//change the input to the first match

									inpt[0].selectionStart = original.length; //highlight from end of input
									inpt[0].selectionEnd = firstElementText.length;//highlight to the end
								}
							}
							//match multiple suggestions
							else {
								if(inpt.val() !== "") {

									var elementsText = [];
									for(var i = 0; i < suggestionsSize; i++) {
										elementsText[i] = $(suggestions[i]).text();
									}
									var A = elementsText.slice(0).sort(),
										word1 = A[0], word2 = A[A.length - 1],
										i = 0;
									while(word1.charAt(i) == word2.charAt(i))++i;

									//match up to dot for most common part
									var mostCommon = word1.substring(0, i);

									if(inpt.val().indexOf(mostCommon) == -1) {
										inpt.val(mostCommon);//change the input to the first match

										inpt[0].selectionStart = original.length; //highlight from end of input
										inpt[0].selectionEnd = mostCommon.length;//highlight to the end
									}
								}
							}
						}
					}
				});
		}

		/**
		 * Toggle javascript console's visibility via button
		 */
		GEPPETTO.Console = {
			visible : false,
			
			toggleConsole: function() {

				//user has clicked the console button
				var command = ($("#console").css("display") === "none") ? "true" : "false";
				GEPPETTO.Console.executeCommand("G.showConsole("+command+")");
			},

			/**
			 * Show console or hide it
			 */
			showConsole: function(mode) {
				if(mode) {
					//check if console isn't already showing, we do this by checking
					//it's css value of display
					if(!this.visible) {
						$('#console').slideToggle(200);
						$('#commandInputArea').focus();
					}
				}
				else {
					$('#footer').height('');
					$('#footerHeader').css("bottom", "0px");
					$('#console').slideToggle(200);
				}

				this.visible = mode;
			},

			/**
			 * Creates Javascript Console
			 */
			createConsole: function() {
              var consoleElement = $("#console");
				// Create the sandbox console:
				console = new GEPPETTO.Sandbox.View({
					el: consoleElement,
					model: new GEPPETTO.Sandbox.Model(),
					resultPrefix: "  => ",
					tabCharacter: "\t",
					placeholder: "// type a javascript command and hit enter (help() for info)"
				});

                var width = $("#footer").width();

				consoleElement.css("width", width - 40);

				//allow console to be resizable
				consoleElement.resizable({
					handles: 'n',
					minHeight: 100,
					autoHide: true,
					maxHeight: 400,
					resize: function(event, ui) {
						consoleElement.style.top = "0px";
						$(document.getElementById('footer')).height(ui.size.height + 86);
					}
				});

				//handles resizing the JS console when the windows is resized
				$(window).resize(function() {
					consoleElement.css("width", width - 40);
				});

				autoComplete();

				//remove drop down menu that comes automatically with autocomplete
				$('#commandInputArea').focus(function() {
					$('.ui-menu').remove();
				});

				var sendMessage = setInterval(function() {
					if(GEPPETTO.MessageSocket.isReady() == 1) {
						GEPPETTO.MessageSocket.send("geppetto_version", null);
						clearInterval(sendMessage);
					}
				}, 100);
				return console;
			},

			consoleHistory: function() {
				return GEPPETTO.Console.getConsole().model.get('history');
			},

			getConsole: function() {
				if(console == null) {
					GEPPETTO.Console.createConsole();
				}
				return console;
			},
			
			isConsoleVisible : function() {
				return this.visible;
			},

			/*
			 * Log debug messages to Geppetto's console if debug mode is on
			 */
			debugLog: function(message) {
				if(GEPPETTO.G.isDebugOn()) {
					GEPPETTO.Console.getConsole().debugLog(message);
				}
			},

			/*
			 * Logs messages to console without need for debug mode to be on
			 */
			log: function(message) {
				GEPPETTO.Console.getConsole().showMessage(message);
			},

			/*
			 * Executes commands to console
			 */
			executeCommand: function(command) {
				GEPPETTO.Console.getConsole().executeCommand(command);
				var justCommand = command.substring(0, command.indexOf("("));
				var commandParams = command.substring(command.indexOf("(") + 1, command.lastIndexOf(")"));
				GEPPETTO.trackActivity("Console", justCommand, commandParams);
			}
		};
	};
});
