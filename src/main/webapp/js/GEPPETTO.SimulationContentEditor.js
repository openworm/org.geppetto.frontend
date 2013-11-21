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
 *
 * Class that handles user interaction with the Simulation File editor.
 * 
 * @constructor
 * 
 * @author Jesus Martinez (jesus@metacell.us)
 */
(function(){

	var editing = false;
	var xmlEditor = null;

	GEPPETTO.SimulationContentEditor = GEPPETTO.SimulationContentEditor ||
	{
		REVISION : '1'
	};
	/**
	 * Load simulation template using ajax call.
	 * 
	 * @param location - location of the simulation template file
	 */
	GEPPETTO.SimulationContentEditor.loadTemplateSimulation = function(location)
	{
		//ajax call to request xml of template file
		$.ajax(
				{
					type : "GET",
					url : location,
					dataType : "xml",
					success : function(result)
					{
						//convert xml file contents to string
						var xmlString = GEPPETTO.SimulationContentEditor.xmlToString(result);

						//load the simulation template file to the editor
						GEPPETTO.SimulationContentEditor.loadSimulationInfo(xmlString);
					}
				});
	};

	/**
	 * Set the code that is display on the editor
	 */
	GEPPETTO.SimulationContentEditor.loadSimulationInfo = function(xmlSimulation)
	{
		xmlEditor.setValue(xmlSimulation);
	};

	/**
	 * Transforms xml file to string
	 */
	GEPPETTO.SimulationContentEditor.xmlToString = function(xmlFile)
	{

		var xmlString;

		// Internet Explorer
		if (window.ActiveXObject)
		{
			xmlString = xmlFile.xml;
		}

		// code for Mozilla, Chrome, Firefox, Opera
		else
		{
			xmlString = (new XMLSerializer()).serializeToString(xmlFile);
		}

		return xmlString;
	};

	/**
	 * Bind editor to certain events as user key events and new input events
	 */
	GEPPETTO.SimulationContentEditor.handleContentEdit = function()
	{

		// detects keyboard events and sets 'editing' flag to true
		xmlEditor.on("keyHandled", function()
				{
			editing = true;

			// Reset sample drop down menu to original value
			if ($('#dropdowndisplaytext').text() != SAMPLES_DROPDOWN_PLACEHOLDER)
			{
				$('#dropdowndisplaytext').html(SAMPLES_DROPDOWN_PLACEHOLDER);
			}
				});

		// detects new input in editor
		xmlEditor.on("inputRead", function()
				{
			editing = true;

			//if simulation file is edited, reset sample menu dropdown
			if ($('#dropdowndisplaytext').text() != SAMPLES_DROPDOWN_PLACEHOLDER)
			{
				$('#dropdowndisplaytext').html(SAMPLES_DROPDOWN_PLACEHOLDER);
			}
				});
	};

	/**
	 * Load the editor, create it if it doesn't exist
	 */
	GEPPETTO.SimulationContentEditor.loadEditor = function()
	{
		if (xmlEditor == null)
		{
			GEPPETTO.SimulationContentEditor.createXMLEditor();
		}
	};

	/**
	 * Create XML Editor to display simulation file
	 */
	GEPPETTO.SimulationContentEditor.createXMLEditor = function()
	{
		xmlEditor = CodeMirror.fromTextArea(document.getElementById("xmlCode"),
				{
			mode : "xml",
			lineNumbers : true,
			theme : "lesser-dark",
			extraKeys :
			{
				"F11" : function(cm)
				{
					GEPPETTO.SimulationContentEditor.setFullScreen(cm, !GEPPETTO.SimulationContentEditor.isFullScreen(cm));
				},
				"Esc" : function(cm)
				{
					if (GEPPETTO.SimulationContentEditor.isFullScreen(cm))
						GEPPETTO.SimulationContentEditor.setFullScreen(cm, false);
				}
			}
				});

		//binds editor to events to detect changes within
		GEPPETTO.SimulationContentEditor.handleContentEdit();

		//Toggles fullscreen mode on editor
		$("#fullscreen").click(function(){
			cm=xmlEditor;
			GEPPETTO.SimulationContentEditor.setFullScreen(cm, !GEPPETTO.SimulationContentEditor.isFullScreen(cm));
		});
	};

	/**
	 * Returns text inside editor, xml for edited simulation file
	 */
	GEPPETTO.SimulationContentEditor.getEditedSimulation = function()
	{
		var code = xmlEditor.getValue();

		return code;
	};

	/**
	 * Returns true if editor is being used
	 */
	GEPPETTO.SimulationContentEditor.setEditing = function(mode)
	{
		editing = mode;
	};
	

	/**
	 * Returns true if editor is being used
	 */
	GEPPETTO.SimulationContentEditor.isEditing = function()
	{
		return editing;
	};


	/**
	 * Auto formats content of editor
	 */
	GEPPETTO.SimulationContentEditor.autoFormat = function()
	{
		var totalLines = xmlEditor.lineCount();
		var totalChars = xmlEditor.getTextArea().value.length;
		xmlEditor.autoFormatRange(
				{
					line : 0,
					ch : 0
				},
				{
					line : totalLines,
					ch : totalChars
				});

		var totalLines = xmlEditor.lineCount();
		var totalChars = xmlEditor.getTextArea().value.length;
		xmlEditor.commentRange(false,
				{
			line : 0,
			ch : 0
				},
				{
					line : totalLines,
					ch : totalChars
				});

	};

	/**
	 * Returns creation state of editor
	 */
	GEPPETTO.SimulationContentEditor.editorCreated = function()
	{
		if (xmlEditor == null)
		{
			return false;
		}

		return true;
	};

	GEPPETTO.SimulationContentEditor.isFullScreen =function(cm)
	{
		return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
	};

	GEPPETTO.winHeight = function ()
	{
		return window.innerHeight || (document.documentElement || document.body).clientHeight;
	};

	GEPPETTO.SimulationContentEditor.setFullScreen=function(cm, full)
	{
		var wrap = cm.getWrapperElement();
		if (full)
		{
			wrap.className += " CodeMirror-fullscreen";
			wrap.style.height = GEPPETTO.winHeight() + "px";
			document.documentElement.style.overflow = "hidden";
			cm.focus();
		}
		else
		{
			wrap.className = wrap.className.replace(" CodeMirror-fullscreen", "");
			wrap.style.height = "";
			document.documentElement.style.overflow = "";
			cm.focus();
		}
		setTimeout(function(){cm.refresh();}, 20);
	};

	CodeMirror.on(window, "resize", function()
			{
		var showing = document.body.getElementsByClassName("CodeMirror-fullscreen")[0];
		if (!showing)
			return;
		showing.CodeMirror.getWrapperElement().style.height = GEPPETTO.winHeight() + "px";
			});
})();
