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
 * Class that handles creationg and loading of JS Console.
 * Handles events associated with the console as well.
 * 
 * @constructor
 * 
 * @author Jesus Martinez (jesus@metacell.us)
 */
GEPPETTO.JSConsole = GEPPETTO.JSConsole ||
{
	REVISION : '1'
};

GEPPETTO.JSConsole.jsConsole = null;
GEPPETTO.JSConsole.consoleVisible = false;

/**
 * Toggle javascript console's visibility via button 
 */
GEPPETTO.JSConsole.toggleConsole = function(){
	//toggle button class
	$('#jsConsoleButton').toggleClass('clicked');
	
	//user has clicked the console button
	if($('#jsConsoleButton').hasClass('clicked')) {	
		//load the console
		GEPPETTO.JSConsole.loadConsole();
		//toggle console
		$('#jsConsole').slideToggle(200);
    } else {
		$('#footer').height('');
    	$('#footerHeader').css("bottom","0px");
		$('#jsConsole').slideToggle(200);		
    }
};

/**
 * Load Javascript Console, create it if it doesn't exist
 */
GEPPETTO.JSConsole.loadConsole = function(){
	if(GEPPETTO.JSConsole.jsConsole == null){
		GEPPETTO.JSConsole.createConsole();
	}
};

/**
 * Creates Javascript Console
 */
GEPPETTO.JSConsole.createConsole = function(){	
	// Create the sandbox console:
	GEPPETTO.JSConsole.jsConsole = new Sandbox.View({
		el : $('#jsConsole'),
		model : new Sandbox.Model(),
		resultPrefix : "  => ",
		tabCharacter : "\t",
		placeholder : "// type a javascript command and hit enter (help() for info)",
		helpText :  "The following commands are available in the Geppetto console.\n\n"+G.help() + '\n\n' + Simulation.help()
	});
	
	$('#jsConsole').css("width", $("#footer").width()-40);
	
	//allow console to be resizable
	$( "#jsConsole" ).resizable({ 
		handles: 'n', 
		minHeight: 100,
		autoHide: true,
		maxHeight: 400,
		resize: function(event,ui){
			document.getElementById('jsConsole').style.top = "0px";
			$(document.getElementById('footer')).height(ui.size.height + 86);
		},
	});
	
	//handles resizing the JS console when the windows is resized
	$(window).resize(function(){
		$('#jsConsole').css("width", $("#footer").width()-40);
	});
};

/**
 * Returns visibility of Javascript console
 */
GEPPETTO.JSConsole.isConsoleVisible = function(){
	if($('#jsConsoleButton').hasClass('clicked')) {	
		return true;
    } else {
		return false;	
    }
};

/**
 * Handles user clicking the "Javascript Console" button, which 
 * toggles the console. 
 */
$(document).ready(function()
{	
	//JS Console Button clicked
	$('#jsConsoleButton').click(function()
	{	
		GEPPETTO.JSConsole.toggleConsole();
	});
});

/**
 * Geppetto's console.
 * 
 * @global
 */
var Console =
{};

/**
 * Log message to Geppetto's console
 * 
 * @global
 */
Console.log = (function(command,message)
{
	var jsConsole = GEPPETTO.JSConsole.jsConsole;
	
	if(isDebugOn()){
		jsConsole.log(command,message);
	}
});