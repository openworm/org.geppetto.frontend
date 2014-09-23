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
 * Creates Javascript editor to display commands.
 *
 * @author Jesus Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {
		var $ = require('jquery');
		var editingJS = false;
		var jsEditor = null;

	  require('codemirror');

		CodeMirror.on(window, "resize", function() {
			var showing = document.body.getElementsByClassName("CodeMirror-fullscreen")[0];
			if(!showing) {
				return;
			}
			showing.CodeMirror.getWrapperElement().style.height = GEPPETTO.winHeight() + "px";
		});

		/**
		 * Selects all text within the Javascript editor
		 */
		function autoSelectJSEditorText() {
			//give the editor focus
			jsEditor.focus();

			//start selecting the editor's text
			var totalLines = jsEditor.lineCount();
			var totalChars = jsEditor.getTextArea().value.length;
			jsEditor.setSelection(
				{
					line: 0,
					ch: 0
				},
				{
					line: totalLines,
					ch: totalChars
				});
		}

		/**
		 * Javascript editor for simulation files
		 * 
		 * @class GEPPETTO.JSEditor
		 */
		GEPPETTO.JSEditor = {
			/**
			 * Load the editor, create it if it doesn't exist
			 */
			loadEditor: function() {
				GEPPETTO.JSEditor.createJSEditor();
			},

			/**
			 * Create JSEditor, use to display command history
			 */
			createJSEditor: function() {
				$("#javascriptCode").removeClass("javascriptCode_loading");
				//create the editor with given options
				jsEditor = CodeMirror.fromTextArea(document.getElementById("javascriptCode"),
					{
						mode: "javascript",
						lineNumbers: true,
						matchBrackets: true,
						continueComments: "Enter",
						theme: "lesser-dark",
						autofocus: true,
						extraKeys: {
							"F11": function(cm) {
								GEPPETTO.JSEditor.setFullScreen(cm, !GEPPETTO.JSEditor.isFullScreen(cm));
							},
							"Esc": function(cm) {
								if(GEPPETTO.JSEditor.isFullScreen(cm)) {
									GEPPETTO.JSEditor.setFullScreen(cm, false);
								}
							},
							"Ctrl-Q": "toggleComment"
						}
					});

				//Toggles fullscreen mode on editor
				$("#javascriptFullscreen").click(function() {
					cm = jsEditor;
					GEPPETTO.JSEditor.setFullScreen(cm, !GEPPETTO.JSEditor.isFullScreen(cm));
				});
			},

			/**
			 * Load javascript code in the editor
			 */
			loadCode: function(commands) {
				jsEditor.setValue(commands);
				autoSelectJSEditorText();
			},

			/**
			 * Returns text inside editor, xml for edited simulation file
			 */
			getEditedSimulation: function() {
				return jsEditor.getValue();
			},

			/**
			 * Returns true if editor is being used
			 */
			setEditing: function(mode) {
				editingJS = mode;
			},

			/**
			 * Returns true if editor is being used
			 */
			isEditing: function() {
				return editingJS;
			},

			isFullScreen: function(cm) {
				return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
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
				cm.refresh();
			}
		};
	};
});
