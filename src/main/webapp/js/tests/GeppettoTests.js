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

	GEPPETTO.Console.createConsole();
	
	equal(G.clear(),CLEAR_HISTORY, "Console cleared");
});

test("Test Copy History To Clipboard", function(){
	
	GEPPETTO.Console.createConsole();

	equal(G.copyHistoryToClipboard(), EMPTY_CONSOLE_HISTORY, "No commands to copy, test passed");
	
	//add some commands to history
	GEPPETTO.Console.executeCommand("G.help();");
	GEPPETTO.Console.executeCommand("help();");
	GEPPETTO.Console.executeCommand("Simulation.start()");
	
	equal(G.copyHistoryToClipboard(), COPY_CONSOLE_HISTORY, "Commands copied, test passed");
});

//module("Run Script Test",
//		{
//	setup : function(){
//		//create socket connection before each test
//		var newSocket = GEPPETTO.MessageSocket;
//
//		newSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');		
//	},
//	teardown: function(){
//
//	}
//});
//asyncTest("Run Script Test 1", function(){
//	//wait half a second before testing, allows for socket connection to be established
//	setTimeout(function(){
//		G.runScript("http://127.0.0.1:8080/org.geppetto.frontend/resources/testscript1.js");
//		equal( getSimulationStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");	
//	},500);
//	
//	
//});
//
//asyncTest("Run Script Test 2", function(){	
//	//wait half a second before testing, allows for socket connection to be established
//	setTimeout(function(){
//		G.runScript("http://127.0.0.1:8080/org.geppetto.frontend/resources/testscript2.js");
//		equal( getSimulationStatus(),Simulation.StatusEnum.STARTED, "Simulation Loaded, passed");	
//	},2000);
//	
//});


module("Simulation commands test");
test( "Test Simulation Help Command", function() {
	notEqual(Simulation.help(), null, "Help command for Simulation object is available, passed.");
});

module("Simulation Load Tests",
		{
	setup : function(){
		//create socket connection before each test
		var newSocket = GEPPETTO.MessageSocket;

		newSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');
		
		//wait half a second before testing, allows for socket connection to be established
		setTimeout(function(){
			Simulation.load("https://dl.dropboxusercontent.com/s/2oczzgnheple0mk/sph-sim-config.xml?token_hash=AAGbu0cCNW8zK_2DUoc0BPuCpspGqcNRIfk-6uDCMVUiHA");
			equal( getSimulationStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");	
			start();
		},500);
	},
	teardown: function(){

	}
});

asyncTest("Test Load Simulation", function(){	
	//wait half a second before testing, allows for socket connection to be established
	setTimeout(function(){
		Simulation.load("https://dl.dropboxusercontent.com/s/2oczzgnheple0mk/sph-sim-config.xml?token_hash=AAGbu0cCNW8zK_2DUoc0BPuCpspGqcNRIfk-6uDCMVUiHA");
		equal( getSimulationStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");
		Simulation.start();
	},500);
});

asyncTest("Test Load Simulation from content", function(){	
	//wait half a second before testing, allows for socket connection to be established
	setTimeout(function(){
		Simulation.loadFromContent('<?xml version="1.0" encoding="UTF-8"?> <tns:simulation xmlns:tns="http://www.openworm.org/simulationSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openworm.org/simulationSchema ../../src/main/resources/schema/simulationSchema.xsd "> <tns:configuration> <tns:outputFormat>RAW</tns:outputFormat> </tns:configuration> <tns:aspects> <tns:modelInterpreter>sphModelInterpreter</tns:modelInterpreter> <tns:modelURL>https://raw.github.com/openworm/org.geppetto.samples/master/SPH/LiquidSmall/sphModel_liquid_780.xml</tns:modelURL> <tns:simulator>sphSimulator</tns:simulator> <tns:id>sph</tns:id> </tns:aspects> <tns:name>sph</tns:name> </tns:simulation>');
		equal( getSimulationStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");	
		Simulation.start();
	},500);
});

module("Simulation controls Test",
{
	setup : function(){
		//establish socket connection for each test of module
		var newSocket = GEPPETTO.MessageSocket;

		newSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');

		//wait half a second before testing, allows for socket connection to be established
		setTimeout(function(){
			Simulation.load("https://dl.dropboxusercontent.com/s/2oczzgnheple0mk/sph-sim-config.xml?token_hash=AAGbu0cCNW8zK_2DUoc0BPuCpspGqcNRIfk-6uDCMVUiHA");
			equal( getSimulationStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");	
			start();
		},500);
	},
	teardown: function(){

	}
});

asyncTest("Test Start Simulation", function(){
	//wait half a second before testing, allows for socket connection to be established
	setTimeout(function(){
		Simulation.start();
		equal( getSimulationStatus(),Simulation.StatusEnum.STARTED, "Simulation Started, passed");
	},500);
});

asyncTest("Test Pause Simulation", function(){
	//wait half a second before testing, allows for socket connection to be established
	setTimeout(function(){
		equal(Simulation.pause(), UNABLE_TO_PAUSE_SIMULATION, "Unable to pause non existing simulation, passed");
		
		Simulation.start();
		equal( getSimulationStatus(),Simulation.StatusEnum.STARTED, "Simulation Started, passed");
		Simulation.pause();
		equal( getSimulationStatus(),Simulation.StatusEnum.PAUSED, "Simulation Paused, passed");
	},500);
});

asyncTest("Test Stop Simulation", function(){
	//wait half a second before testing, allows for socket connection to be established
	setTimeout(function(){
		equal(Simulation.stop(), SIMULATION_NOT_RUNNING, "Unable to stop simulation that isn't running, passed");
		
		Simulation.start();
		equal( getSimulationStatus(),Simulation.StatusEnum.STARTED, "Simulation Started, passed");
		Simulation.stop();
		equal( getSimulationStatus(),Simulation.StatusEnum.STOPPED, "Simulation Stopped, passed");
		
		equal(Simulation.stop(), SIMULATION_ALREADY_STOPPED, "Unable to stop already stopped simulation, passed");
		
	},500);
});