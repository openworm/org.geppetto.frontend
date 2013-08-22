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
 * @author Jesus Martinez (jesus@metacell.us)
 */
GEPPETTO.JSConsole = GEPPETTO.JSConsole ||
{
	REVISION : '1'
};

GEPPETTO.JSConsole.jsConsole = null;
GEPPETTO.JSConsole.consoleVisible = false;

/**
 * Toggle js console visibility via button 
 */
GEPPETTO.JSConsole.toggleConsole = function(){
	//toggle button class
	$('#jsConsoleButton').toggleClass('clicked');
	
	//user has clicked the console button
	if($('#jsConsoleButton').hasClass('clicked')) {	
		//load the console
		GEPPETTO.JSConsole.loadConsole();
		//toggle console
		$('#jsConsole').slideToggle(200,function(){
			//update canvas size as is now sharing screen with console
			FE.updateCanvasContainerSize();
			//if simulation has not been intialized don't attempt to resize canvas
			if(Simulation.isLoaded()){
				GEPPETTO.onWindowResize();
			}
		});
    } else {
    	if($('#footerLayout').height()!=null){
			$('#footerLayout').height('');
			
		}
    	$('#toplayer').css("bottom","0px");
		$('#jsConsole').slideToggle(200,function(){
			//Get appropriate height for canvas so it's not under js console.
			FE.updateCanvasContainerSize();
			//if simulation has not been intialized don't attempt to resize canvas
			if(Simulation.isLoaded()){
				GEPPETTO.onWindowResize();
			}
		});		
    }
};

/**
 * Load Console, create if it doesn't exist
 */
GEPPETTO.JSConsole.loadConsole = function(){
	if(GEPPETTO.JSConsole.jsConsole == null){
		GEPPETTO.JSConsole.createConsole();
	}
};

/**
 * Creates JS Console
 */
GEPPETTO.JSConsole.createConsole = function(){	
	// Create the sandbox console:
	GEPPETTO.JSConsole.jsConsole = new Sandbox.View({
		el : $('#jsConsole'),
		model : new Sandbox.Model(),
		resultPrefix : "  => ",
		helpText : "type javascript commands into the console, hit enter to evaluate. \n[up/down] to scroll through history, ':clear' to reset it. \n[alt + return/up/down] for returns and multi-line editing.",
		tabCharacter : "\t",
		placeholder : "// type some javascript and hit enter (:help for info)"
	});
	
	//allow console to be resizable
	$( "#jsConsole" ).resizable({ 
		handles: 'n', 
		containment: "#mainContainer",
		minHeight: 100,
		maxHeight: 500,
		resize: function(event,ui){
			document.getElementById('jsConsole').style.top = "0px";
			$(document.getElementById('footerLayout')).height(ui.size.height + 86);
			if(Simulation.isLoaded()){
				FE.updateCanvasContainerSize();
				GEPPETTO.onWindowResize();
			}
		},
	});
	
	//handles resizing the JS console when the windows is resized
	$(window).resize(function(){
		if(Simulation.isLoaded()){
			FE.updateCanvasContainerSize();
			GEPPETTO.onWindowResize();
		}
		$('#jsConsole').css("width", $("#footerLayout").width()-40);
	});
};

/**
 * Returns visibility of console
 */
GEPPETTO.JSConsole.isConsoleVisible = function(){
	if($('#jsConsoleButton').hasClass('clicked')) {	
		return true;
    } else {
		return false;	
    }
};

//============================================================================
//Application logic.
//============================================================================
$(document).ready(function()
{	
	//JS Console Button clicked
	$('#jsConsoleButton').click(function()
	{	
		GEPPETTO.JSConsole.toggleConsole();
	});
});

