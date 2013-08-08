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
 * @fileoverview GEPPETTO Visualisation engine built on top of THREE.js. Displays
 * a scene as defined on org.geppetto.core
 *
 * @author Jesus Martinez (jesus@metacell.us)
 */
GEPPETTO.SimulationContentEditor = GEPPETTO.SimulationContentEditor ||
{
	REVISION : '1'
};

GEPPETTO.SimulationContentEditor.editing = false;
GEPPETTO.SimulationContentEditor.editor = null;

/**
 * Load simulation template using ajax call. 
 * 
 * @param location
 */
GEPPETTO.SimulationContentEditor.loadTemplateSimulation = function(location){
	$.ajax({
	      type: "GET",
	      url: location,
	      dataType: "xml",
	      success: function(result) {
	    	  
	    	 var xmlString = GEPPETTO.SimulationContentEditor.xmlToString(result);

	    	 GEPPETTO.SimulationContentEditor.loadSimulationInfo(xmlString);
	      }
	});
};

/**
 * Set editor's code
 */
GEPPETTO.SimulationContentEditor.loadSimulationInfo = function(xmlSimulation){	
	GEPPETTO.SimulationContentEditor.editor.setValue(xmlSimulation);
};

/**
 * Transforms xml file to string
 */
GEPPETTO.SimulationContentEditor.xmlToString = function(xmlFile) { 

    var xmlString;
    
    //Internet Explorer
    if (window.ActiveXObject){
        xmlString = xmlFile.xml;
    }
    
    // code for Mozilla, Chrome, Firefox, Opera
    else{
        xmlString = (new XMLSerializer()).serializeToString(xmlFile);
    }
    
    return xmlString;
};   

/**
 * Bind editor to certain events as user key events and new input events
 */
GEPPETTO.SimulationContentEditor.handleContentEdit = function(){

	//detects keyboard events and sets 'editing' flag to true
	GEPPETTO.SimulationContentEditor.editor.on("keyHandled", function(){
		GEPPETTO.SimulationContentEditor.editing = true;
		
		//Reset sample drop down menu to original value
		if($('#dropdowndisplaytext').text() != "Select simulation from list..."){
			$('#dropdowndisplaytext').html("Select simulation from list...");
		}
	});
	
	//detects new input in editor
	GEPPETTO.SimulationContentEditor.editor.on("inputRead", function(){
		GEPPETTO.SimulationContentEditor.editing = true;
		
		if($('#dropdowndisplaytext').text() != "Select simulation from list..."){
			$('#dropdowndisplaytext').html("Select simulation from list...");
		}
	});
};

/**
 * Load the editor, create it if it doesn't exist
 */
GEPPETTO.SimulationContentEditor.loadEditor = function(){
	if(GEPPETTO.SimulationContentEditor.editor == null){
		GEPPETTO.SimulationContentEditor.createXMLEditor();
	}
};

/**
 * Create XML Editor to display simulation file
 */
GEPPETTO.SimulationContentEditor.createXMLEditor = function(){
	GEPPETTO.SimulationContentEditor.editor = CodeMirror.fromTextArea(document.getElementById("code"), {
			mode: "xml",
		    lineNumbers: false,
		  });
	
	GEPPETTO.SimulationContentEditor.handleContentEdit();
};

/**
 * Returns text inside editor, xml for edited simulation file
 */
GEPPETTO.SimulationContentEditor.getEditedSimulation = function(){
	var code = GEPPETTO.SimulationContentEditor.editor.getValue();
	
	return code;
};

/**
 * Returns true if editor is being used
 */
GEPPETTO.SimulationContentEditor.isEditing = function(mode){
	GEPPETTO.SimulationContentEditor.editing = mode;
};

/**
 * Auto formats content of editor
 */
GEPPETTO.SimulationContentEditor.autoFormat = function(){
    var totalLines = GEPPETTO.SimulationContentEditor.editor.lineCount();
    var totalChars = GEPPETTO.SimulationContentEditor.editor.getTextArea().value.length;
    GEPPETTO.SimulationContentEditor.editor.autoFormatRange({line:0, ch:0}, {line:totalLines, ch:totalChars});
    
    var totalLines = GEPPETTO.SimulationContentEditor.editor.lineCount();
    var totalChars = GEPPETTO.SimulationContentEditor.editor.getTextArea().value.length;
    GEPPETTO.SimulationContentEditor.editor.commentRange(false, {line:0, ch:0}, {line:totalLines, ch:totalChars});
    
};

/**
 * Returns creation state of editor
 */
GEPPETTO.SimulationContentEditor.editorCreated = function(){
	if(GEPPETTO.SimulationContentEditor.editor == null){
		return false;
	}
	
	return true;
};