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
 * Class that handles user interaction with the Simulation File editor.
 *
 * @constructor
 *
 * @author Jesus Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {
		require('codemirror');
		var $ = require('jquery');
		var editing = false;
		var xmlEditor = null;

		CodeMirror.on(window, "resize", function() {
			var showing = document.body.getElementsByClassName("CodeMirror-fullscreen")[0];
			if(!showing) {
				return;
			}
			showing.CodeMirror.getWrapperElement().style.height = GEPPETTO.winHeight() + "px";
		});
		/**
		 * Load simulation template using ajax call.
		 *
		 * @param location - location of the simulation template file
		 */

		GEPPETTO.SimulationContentEditor =  {
			loadTemplateSimulation: function(location) {
				//ajax call to request xml of template file
				var self = this;
				$.ajax(
					{
						type: "GET",
						url: location,
						dataType: "xml",
						success: function(result) {
							//convert xml file contents to string
							var xmlString = self.xmlToString(result);

							//load the simulation template file to the editor
							self.loadSimulationInfo(xmlString);
						}
					});
			},

			/**
			 * Set the code that is display on the editor
			 */
			loadSimulationInfo: function(xmlSimulation) {
				xmlEditor.setValue(xmlSimulation);
			},

			/**
			 * Transforms xml file to string
			 */
			xmlToString: function(xmlFile) {

				var xmlString;

				// Internet Explorer
				if(window.ActiveXObject) {
					xmlString = xmlFile.xml;
				}

				// code for Mozilla, Chrome, Firefox, Opera
				else {
					xmlString = (new XMLSerializer()).serializeToString(xmlFile);
				}

				return xmlString;
			},

			/**
			 * Bind editor to certain events as user key events and new input events
			 */
			handleContentEdit: function() {
				// detects keyboard events and sets 'editing' flag to true
				xmlEditor.on("keyHandled", function() {
					editing = true;

					// Reset sample drop down menu to original value
					if($('#dropdowndisplaytext').text() != GEPPETTO.Resources.SAMPLES_DROPDOWN_PLACEHOLDER) {
						$('#dropdowndisplaytext').html(GEPPETTO.Resources.SAMPLES_DROPDOWN_PLACEHOLDER);
					}
				});

				// detects new input in editor
				xmlEditor.on("inputRead", function() {
					editing = true;

					//if simulation file is edited, reset sample menu dropdown
					if($('#dropdowndisplaytext').text() != GEPPETTO.Resources.SAMPLES_DROPDOWN_PLACEHOLDER) {
						$('#dropdowndisplaytext').html(GEPPETTO.Resources.SAMPLES_DROPDOWN_PLACEHOLDER);
					}
				});
			},

			/**
			 * Load the editor, create it if it doesn't exist
			 */
			loadEditor: function() {
				if(xmlEditor == null) {
					this.createXMLEditor();
				}
			},

			/**
			 * Create XML Editor to display simulation file
			 */
			createXMLEditor: function() {
				var self = this;
				xmlEditor = CodeMirror.fromTextArea(document.getElementById("xmlCode"),
					{
						mode: "xml",
						lineNumbers: true,
						theme: "lesser-dark",
						extraKeys: {
							"F11": function(cm) {
								self.setFullScreen(cm, !self.isFullScreen(cm));
							},
							"Esc": function(cm) {
								if(self.isFullScreen(cm)) {
									self.setFullScreen(cm, false);
								}
							}
						}
					});

				//binds editor to events to detect changes within
				this.handleContentEdit();

				//Toggles fullscreen mode on editor
				$("#fullscreen").click(function() {
					var cm = xmlEditor;
					self.setFullScreen(cm, !self.isFullScreen(cm));
				});
			},

			/**
			 * Returns text inside editor, xml for edited simulation file
			 */
			getEditedSimulation: function() {
				return xmlEditor.getValue();
			},

			/**
			 * Returns true if editor is being used
			 */
			setEditing: function(mode) {
				editing = mode;
			},

			/**
			 * Returns true if editor is being used
			 */
			isEditing: function() {
				return editing;
			},

			/**
			 * Auto formats content of editor
			 */
			autoFormat: function() {
				var totalLines = xmlEditor.lineCount();
				var totalChars = xmlEditor.getTextArea().value.length;
				xmlEditor.autoFormatRange(
					{
						line: 0,
						ch: 0
					},
					{
						line: totalLines,
						ch: totalChars
					});

				var totalLines = xmlEditor.lineCount();
				var totalChars = xmlEditor.getTextArea().value.length;
				xmlEditor.commentRange(false,
					{
						line: 0,
						ch: 0
					},
					{
						line: totalLines,
						ch: totalChars
					});

			},

			/**
			 * Returns creation state of editor
			 */
			editorCreated: function() {
				return xmlEditor != null;
			},

			isFullScreen: function(cm) {
				return '/\bCodeMirror-fullscreen\b/'.test(cm.getWrapperElement().className);
			},

			winHeight: function() {
				return window.innerHeight || (document.documentElement || document.body).clientHeight;
			},

			setFullScreen: function(cm, full) {
				var wrap = cm.getWrapperElement();
				if(full) {
					wrap.className += " CodeMirror-fullscreen";
					wrap.style.height = GEPPETTO.winHeight() + "px";
					document.documentElement.style.overflow = "hidden";
					cm.focus();
				}
				else {
					wrap.className = wrap.className.replace(" CodeMirror-fullscreen", "");
					wrap.style.height = "";
					document.documentElement.style.overflow = "";
					cm.focus();
				}
				setTimeout(function() {
					cm.refresh();
				}, 20);
			}
		};
	};
});
