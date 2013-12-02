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

module("Simulation commands test");
test( "Test Simulation Help Command", function() {
	notEqual(Simulation.help(), null, "Help command for Simulation object is available, passed.");
});

module("Simulation Load From Content Tests",
		{
	setup : function(){
		GEPPETTO.MessageSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');
	
	},
	teardown: function(){
		GEPPETTO.MessageSocket.socket.close();
	}
});

asyncTest("Test Load Simulation from content", function(){	
	
	//wait half a second before testing, allows for socket connection to be established
	setTimeout(function(){
		//GEPPETTO.Console.createConsole();
		Simulation.loadFromContent('<?xml version="1.0" encoding="UTF-8"?> <tns:simulation xmlns:tns="http://www.openworm.org/simulationSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openworm.org/simulationSchema ../../src/main/resources/schema/simulationSchema.xsd "> <tns:configuration> <tns:outputFormat>RAW</tns:outputFormat> </tns:configuration> <tns:aspects> <tns:modelInterpreter>sphModelInterpreter</tns:modelInterpreter> <tns:modelURL>https://raw.github.com/openworm/org.geppetto.samples/master/SPH/LiquidSmall/sphModel_liquid_780.xml</tns:modelURL> <tns:simulator>sphSimulator</tns:simulator> <tns:id>sph</tns:id> </tns:aspects> <tns:name>sph</tns:name> </tns:simulation>');
	},500);
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded and model need to be loaded
				case MESSAGE_TYPE.LOAD_MODEL:
				ok("Simulation Loaded, passed");
				start();
				break;
				}
				
			}
	};

	GEPPETTO.MessageSocket.addHandler(handler);
});

asyncTest("Test Load Simulation", function(){		
	
	//wait half a second before testing, allows for socket connection to be established
	setTimeout(function(){
		//GEPPETTO.Console.createConsole();
		Simulation.load("https://dl.dropboxusercontent.com/s/2oczzgnheple0mk/sph-sim-config.xml?token_hash=AAGbu0cCNW8zK_2DUoc0BPuCpspGqcNRIfk-6uDCMVUiHA");		
	},500);
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded and model need to be loaded
				case MESSAGE_TYPE.LOAD_MODEL:
				ok("Simulation Loaded, passed");
				break;
				}
				
			}
	};

	GEPPETTO.MessageSocket.addHandler(handler);
});

module("Simulation controls Test",
{
	setup : function(){
		GEPPETTO.MessageSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');

		//wait half a second before testing, allows for socket connection to be established
		setTimeout(function(){
			Simulation.load("https://dl.dropboxusercontent.com/s/2oczzgnheple0mk/sph-sim-config.xml?token_hash=AAGbu0cCNW8zK_2DUoc0BPuCpspGqcNRIfk-6uDCMVUiHA");
		},500);
	},
	teardown: function(){
		GEPPETTO.MessageSocket.socket.close();
	}
});

asyncTest("Test Start Simulation", function(){
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been started successfully
				case MESSAGE_TYPE.SIMULATION_STARTED:
				ok("Simulation Started, passed");
				start();
				break;
				}
				
			}
	};

	GEPPETTO.MessageSocket.addHandler(handler);
});

asyncTest("Test Pause Simulation", function(){
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been paused successfully
				case MESSAGE_TYPE.SIMULATION_PAUSED:
				ok("Simulation Paused, passed");
				break;
				}
				
			}
	};

	GEPPETTO.MessageSocket.addHandler(handler);
});

asyncTest("Test Stop Simulation", function(){
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been stopped successfully
				case MESSAGE_TYPE.SIMULATION_STOPPED:
				ok("Simulation Stopped, passed");
				break;
				}
				
			}
	};

	GEPPETTO.MessageSocket.addHandler(handler);
});

module("Get simulation variables test",
		{
	setup : function(){
		GEPPETTO.MessageSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');

		//wait half a second before testing, allows for socket connection to be established
		setTimeout(function(){
			Simulation.load("https://dl.dropboxusercontent.com/s/2oczzgnheple0mk/sph-sim-config.xml?token_hash=AAGbu0cCNW8zK_2DUoc0BPuCpspGqcNRIfk-6uDCMVUiHA");
		},500);
	},
	teardown: function(){
		GEPPETTO.MessageSocket.socket.close();
	}
});

asyncTest("Test list simulation variables no crash - SPH", function(){
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been stopped successfully
				case MESSAGE_TYPE.SIMULATION_LOADED:
				ok("Simulation Stopped, passed");
				Simulation.start();
				Simulation.listWatchableVariables();
				break;
				case MESSAGE_TYPE.LIST_WATCH_VARS:
					ok("Variables received");
					break;
				}
				
			}
	};

	GEPPETTO.MessageSocket.addHandler(handler);
});

module("Watch variables test",
		{
	setup : function(){
		GEPPETTO.MessageSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');

		//wait half a second before testing, allows for socket connection to be established
		setTimeout(function(){
			Simulation.load("https://dl.dropboxusercontent.com/s/2oczzgnheple0mk/sph-sim-config.xml?token_hash=AAGbu0cCNW8zK_2DUoc0BPuCpspGqcNRIfk-6uDCMVUiHA");
		},500);
	},
	teardown: function(){
		GEPPETTO.MessageSocket.socket.close();
	}
});

asyncTest("Test add / get watchlists no crash - SPH", function(){
	// wait a bit and then load SPH sample
	setTimeout(function(){
		GEPPETTO.Console.createConsole();
		equal(G.clear(),CLEAR_HISTORY, "Console is clear");
		
		Simulation.load("https://raw.github.com/openworm/org.geppetto.samples/master/SPH/LiquidSmall/GEPPETTO.xml");
		equal(getSimulationStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");
		start();
		
		Simulation.addWatchLists([]);
		
		// TODO: check expected output - need to refactor messaging to be able to do this
		Simulation.getWatchLists();
	},500);
});

asyncTest("Test watch Simulation variables", function(){
	//check every few seconds before checking assertions
	interval = setInterval(function(){
		if(!Simulation.isLoading()){
			Simulation.start();
			
			// TODO: try to retrieve some values and check they are not there 'cause we are not watching yet
			
			Simulation.startWatch();
			
			// TODO: retrieve some values and check they are changing
			
			Simulation.stopWatch();
			
			// TODO: retrieve some values and check they are not changing changing anymore
			
			Simulation.stop();
		}
	},1000);
});

asyncTest("Test clear watch Simulation variables", function(){
	//check every few seconds before checking assertions
	interval = setInterval(function(){
		if(!Simulation.isLoading()){
			Simulation.clearWatchLists();
			
			Simulation.getWatchLists();
			// TODO: test that watchlists have been cleared
		}
	},1000);
});
