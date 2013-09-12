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
GEPPETTO.Console = GEPPETTO.Console ||
{
	REVISION : '1'
};

GEPPETTO.Console.console = null;
GEPPETTO.Console.consoleVisible = false;

/**
 * Toggle javascript console's visibility via button 
 */
GEPPETTO.Console.toggleConsole = function(){
	//toggle button class
	$('#consoleButton').toggleClass('clicked');
	
	//user has clicked the console button
	if($('#consoleButton').hasClass('clicked')) {	
		//load the console
		GEPPETTO.Console.loadConsole();
		//toggle console
		$('#console').slideToggle(200);
    } else {
		$('#footer').height('');
    	$('#footerHeader').css("bottom","0px");
		$('#console').slideToggle(200);		
    }
};

/**
 * Load Javascript Console, create it if it doesn't exist
 */
GEPPETTO.Console.loadConsole = function(){
	
};

/**
 * Creates Javascript Console
 */
GEPPETTO.Console.createConsole = function(){	
	// Create the sandbox console:
	GEPPETTO.Console.console = new Sandbox.View({
		el : $('#console'),
		model : new Sandbox.Model(),
		resultPrefix : "  => ",
		tabCharacter : "\t",
		placeholder : "// type a javascript command and hit enter (help() for info)",
		helpText :  "The following commands are available in the Geppetto console.\n\n"+G.help() + '\n\n' + Simulation.help()
	});
	
	$('#console').css("width", $("#footer").width()-40);
	
	//allow console to be resizable
	$( "#console" ).resizable({ 
		handles: 'n', 
		minHeight: 100,
		autoHide: true,
		maxHeight: 400,
		resize: function(event,ui){
			document.getElementById('console').style.top = "0px";
			$(document.getElementById('footer')).height(ui.size.height + 86);
		},
	});
	
	//handles resizing the JS console when the windows is resized
	$(window).resize(function(){
		$('#console').css("width", $("#footer").width()-40);
	});
	
	//get the available tags for autocompletion in console
	var tags = availableTags();

	//bind console input area to autocomplete event
	$( "#commandInputArea" ).bind( "keydown", function( event ) {
      if ( event.keyCode === $.ui.keyCode.TAB &&
          $( this ).data( "ui-autocomplete" ).menu.active ) {
        event.preventDefault();
      }
    })
    .autocomplete({
      minLength: 0,
      source: function( request, response ) {
        // delegate back to autocomplete, but extract the last term
        response( $.ui.autocomplete.filter(
          tags, extractLast( request.term ) ) );
      },
      focus: function() {
        // prevent value inserted on focus
        return false;
      },
      open: function( event, ui ) {
    	  var firstElement = $(this).data("uiAutocomplete").menu.element[0].children[0]
          , inpt = $('#commandInputArea')
          , original = inpt.val()
          , firstElementText = $(firstElement).text();
      
       /*
          here we want to make sure that we're not matching something that doesn't start
          with what was typed in 
       */
       if(firstElementText.toLowerCase().indexOf(original.toLowerCase()) === 0){
           inpt.val(firstElementText);//change the input to the first match
   
           inpt[0].selectionStart = original.length; //highlight from end of input
           inpt[0].selectionEnd = firstElementText.length;//highlight to the end
       }
      }
    });
	
	//remove drop down menu that comes automatically with autocomplete
	$('#commandInputArea').focus(function(){
		$('.ui-menu').remove();
	});
};

/**
 * Returns visibility of Javascript console
 */
GEPPETTO.Console.isConsoleVisible = function(){
	if($('#consoleButton').hasClass('clicked')) {	
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
	GEPPETTO.Console.createConsole();
	
	//JS Console Button clicked
	$('#consoleButton').click(function()
	{	
		GEPPETTO.Console.toggleConsole();
	});	
});

/**
 * internal function for loading script from console
 */
function loadScript(url){
	GEPPETTO.Console.console.loadScript(url);
};

function split( val ) {
    return val.split( /,\s*/ );
};

/**
 * 
 * @param term
 * @returns
 */
function extractLast( term ) {
    return split( term ).pop();
};
  
/**
 * Log message to Geppetto's console
 * 
 * @global
 */
GEPPETTO.Console.debugLog = (function(message)
{
	var console = GEPPETTO.Console.console;
	
	if(isDebugOn()){
		console.debugLog(message);
	}
});

GEPPETTO.Console.executeCommand = (function(command)
{
	var console = GEPPETTO.Console.console;

	//if(GEPPETTO.Console.isConsoleVisible()){
		console.executeCommand(command);
	//}
});

function split( val ) {
	return val.split( /,\s*/ );
};

function extractLast( term ) {
	return split( term ).pop();
};

/**
 * Available commands stored in an array, used for autocomplete
 * 
 * @returns {Array}
 */
function availableTags(){

	var availableTags = [];

	var commands = "\n" +  "Simulation" + "\n" + Simulation.help() + "\n" +  G.help();

	var commandsSplitByLine = commands.split("\n");

	var tagsCount = 0;

	for(var i =0; i<commandsSplitByLine.length; i++){
		var line = commandsSplitByLine[i].trim();

		if(line.substring(0,2) == "--"){
			var command = line.substring(3, line.length);
			availableTags[tagsCount] = command;
			tagsCount++;
		}
	}

	return availableTags;
};