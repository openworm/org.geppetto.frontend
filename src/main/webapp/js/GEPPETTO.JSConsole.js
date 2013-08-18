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
 * @author Jesus Martinez (jesus@metacell.us)
 */
GEPPETTO.JSConsole = GEPPETTO.JSConsole ||
{
	REVISION : '1'
};

GEPPETTO.JSConsole.jsConsole = null;
GEPPETTO.JSConsole.consoleVisible = false;

GEPPETTO.JSConsole.toggleConsole = function(){
	$('#jsConsoleButton').toggleClass('clicked');
	
	if($('#jsConsoleButton').hasClass('clicked')) {		
		GEPPETTO.JSConsole.loadConsole();
		$('#jsConsole').show();
		GEPPETTO.JSConsole.consoleVisible = true;
    } else {
    	$('#jsConsole').hide();
    	GEPPETTO.JSConsole.consoleVisible = false;
    }
};

GEPPETTO.JSConsole.loadConsole = function(){
	if(GEPPETTO.JSConsole.jsConsole == null){
		GEPPETTO.JSConsole.createConsole();
	}
};

GEPPETTO.JSConsole.createConsole = function(){	
	// Create the sandbox:
	GEPPETTO.JSConsole.jsConsole = new Sandbox.View({
		el : $('#jsConsole'),
		model : new Sandbox.Model(),
		// these are optional (defaults are given here):
		resultPrefix : "  => ",
		helpText : "type javascript commands into the console, hit enter to evaluate. \n[up/down] to scroll through history, ':clear' to reset it. \n[alt + return/up/down] for returns and multi-line editing.",
		tabCharacter : "\t",
		placeholder : "// type some javascript and hit enter (:help for info)"
	});
	
	$( "#jsConsole" ).resizable({ handles: 'n', containment: "#bottomLayout" });
};

GEPPETTO.JSConsole.consoleVisible = function(){
	
}
