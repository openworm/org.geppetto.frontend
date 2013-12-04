/*******************************************************************************

\ * The MIT License (MIT)
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
 * Unit testing for GEPPETTO commands
 * 
 * @constructor
 * 
 * @author Jesus Martinez (jesus@metacell.us)
 */
module("Global Scope Test");
test("Global scope Test", function(){
	notEqual(help(), null, "Global help() command available, passed");
});

module( "G Object Test");

test( "Test Get Current Simulation", function() {
	equal(G.getCurrentSimulation(), NO_SIMULATION_TO_GET, "No simulation, passed.");	
});

test("Test Debug Mode", function(){	
	G.debug(true);

	equal(isDebugOn(), true, "Debug Mode on, passed");

	G.debug(false);

	equal(isDebugOn(), false, "Debug Mode Off, passed.");	
});

test("Test G Object help method", function(){
	notEqual(G.help(), null, "Help command for object G is available, passed.");
});

test("Test Clear Console", function(){
	
	equal(G.clear(),CLEAR_HISTORY, "Console cleared");
});

test("Test Copy History To Clipboard", function(){
	
	equal(G.copyHistoryToClipboard(), EMPTY_CONSOLE_HISTORY, "No commands to copy, test passed");
	
	//add some commands to history
	GEPPETTO.Console.executeCommand("G.help();");
	GEPPETTO.Console.executeCommand("help();");
	GEPPETTO.Console.executeCommand("Simulation.start()");
	
	equal(G.copyHistoryToClipboard(), COPY_CONSOLE_HISTORY, "Commands copied, test passed");
});

test("Test Add Widget", function(){
	G.addWidget(Widgets.PLOT);
	
	equal(GEPPETTO.PlotsController.getPlotWidgets().length, 1, "Plot widget created, test passed");
	
	G.removeWidget(Widgets.PLOT);
});

test("Test Remove Widget", function(){
	G.addWidget(Widgets.PLOT);
	
	equal(GEPPETTO.PlotsController.getPlotWidgets().length,  1, "Plot widget created");
	
	G.removeWidget(Widgets.PLOT);
	
	equal(GEPPETTO.PlotsController.getPlotWidgets().length, 0, "Plot widget removed, test passed");
});

test("Test Widget", function(){
	G.addWidget(Widgets.PLOT);
	
	equal(GEPPETTO.PlotsController.getPlotWidgets().length, 1, "Plot widget created");
	
	var plot = GEPPETTO.PlotsController.getPlotWidgets()[0];
	
	equal(plot.isVisible(), true, "Default visibility test passed");
	
	plot.hide();
	
	equal(plot.isVisible(), false, "Hide test passed");
	
	plot.show();
	
	equal(plot.isVisible(), true, "Show test passed");
	
	plot.destroy();
	
	equal($("#"+plot.getId()).html(), null , "Widget successfully destroyed, passed");
});

module("Run Script Test",
		{
	setup : function(){
		
		GEPPETTO.MessageSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');

		setTimeout(function(){
			console.log("attempting to run script"+GEPPETTO.MessageSocket.isReady());
			G.runScript("http://127.0.0.1:8080/org.geppetto.frontend/resources/testscript1.js");
		}, 1000);
	
	},
	teardown: function(){
		GEPPETTO.MessageSocket.close();
		console.log("socket closed");
	}
});

asyncTest("Run Script Test 1", function(){
	
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded and model need to be loaded
				case MESSAGE_TYPE.RUN_SCRIPT:
				ok("Simulation Loaded, passed");
				start();
				break;
				}
				
			}
	};

	GEPPETTO.MessageSocket.addHandler(handler);
	
});
