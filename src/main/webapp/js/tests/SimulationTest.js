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

module("Simulation Load From Content Tests",
		{
	newSocket : GEPPETTO.MessageSocket,
	setup : function(){
		
		this.newSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/GeppettoServlet');
	
	},
	teardown: function(){
		this.newSocket.close();
	}
});

asyncTest("Test Load Simulation from content", function(){	
		
	//wait half a second before testing, allows for socket connection to be established
	setTimeout(function(){
		Simulation.loadFromContent('<?xml version="1.0" encoding="UTF-8"?> <tns:simulation xmlns:tns="http://www.openworm.org/simulationSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openworm.org/simulationSchema ../../src/main/resources/schema/simulationSchema.xsd "> <tns:configuration> <tns:outputFormat>RAW</tns:outputFormat> </tns:configuration> <tns:aspects> <tns:modelInterpreter>sphModelInterpreter</tns:modelInterpreter> <tns:modelURL>https://raw.github.com/openworm/org.geppetto.samples/master/SPH/LiquidSmall/sphModel_liquid_780.xml</tns:modelURL> <tns:simulator>sphSimulator</tns:simulator> <tns:id>sph</tns:id> </tns:aspects> <tns:name>sph</tns:name> </tns:simulation>');
	},500);
	
	var handler = {
			onMessage : function(parsedServerMessage){
				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded and model need to be loaded
				case MESSAGE_TYPE.LOAD_MODEL:
				ok(true,"Simulation content Loaded, passed");
				start();	
				break;
				}
				
			}
	};

	this.newSocket.addHandler(handler);
});

asyncTest("Test Load Simulation", function(){		
		
	
	//wait half a second before testing, allows for socket connection to be established
	setTimeout(function(){
		//GEPPETTO.Console.createConsole();
		Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");		
	},500);
	
	var handler = {
			onMessage : function(parsedServerMessage){
				
				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded and model need to be loaded
				case MESSAGE_TYPE.LOAD_MODEL:
				ok(true,"Simulation Loaded, passed");
				start();
				break;
				}
				
			}
	};

	this.newSocket.addHandler(handler);
});

module("Simulation with Scripts",
		{
	newSocket : GEPPETTO.MessageSocket,
	setup : function(){
		
		this.newSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/GeppettoServlet');
	
	},
	teardown: function(){
		this.newSocket.close();
		
		G.removeWidget(Widgets.PLOT);
	}
});

asyncTest("Test Simulation with Script", function(){	
	
	//wait half a second before testing, allows for socket connection to be established
	setTimeout(function(){
		//GEPPETTO.Console.createConsole();
		Simulation.load('https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1Script.xml');
	},500);
	
	var handler = {
			onMessage : function(parsedServerMessage){
				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded and model need to be loaded
				case MESSAGE_TYPE.LOAD_MODEL:
				ok(true,"Simulation content Loaded, passed");
				break;
				//We are not starting simulation from here, must come from associated scrip
				case MESSAGE_TYPE.SIMULATION_STARTED:
				ok(true, "Simulation started, script read");
				start();	
				break;
				}
				
			}
	};

	this.newSocket.addHandler(handler);
});

module("Simulation controls Test",
{
	newSocket : GEPPETTO.MessageSocket, 
	
	setup : function(){
		this.newSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/GeppettoServlet');

		//wait half a second before testing, allows for socket connection to be established
		setTimeout(function(){
			Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1Script.xml");
		},500);
	},
	teardown: function(){
		this.newSocket.close();
	}
});

asyncTest("Test Simulation Controls", function(){
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been started successfully
				case MESSAGE_TYPE.LOAD_MODEL:
				setSimulationLoaded();
				ok(true, "Simulation loaded, passed");
				Simulation.start();
				Simulation.pause();
				Simulation.stop();
				break;
				case MESSAGE_TYPE.SIMULATION_STARTED:
					ok(true,"Simulation Started, passed");
					break;
				case MESSAGE_TYPE.SIMULATION_PAUSED:
					ok(true,"Simulation Paused, passed");
					break;
				case MESSAGE_TYPE.SIMULATION_STOPPED:
					ok(true,"Simulation Stopped, passed");
					start();
					break;
				}
				
			}
	};

	this.newSocket.addHandler(handler);

});

asyncTest("Test Variable Watch in Plot", function(){
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been started successfully
				case MESSAGE_TYPE.LOAD_MODEL:
				setSimulationLoaded();
				ok(true, "Simulation loaded, passed");
				Simulation.start();
				break;
				case MESSAGE_TYPE.SIMULATION_STARTED:
					ok(true,"Simulation Started, passed");
					
					G.addWidget(Widgets.PLOT);
					
					equal(PlotsController.getWidgets().length, 1, "Plot widget created, passed");
					
					var plot = PlotsController.getWidgets()[0];
					plot.hide();
					
					notEqual(plot.getDataSets(),null,"Plot has variable data, passed");
					start();
					break;
				}
				
			}
	};

	this.newSocket.addHandler(handler);

});

module("Get simulation variables test",
		{
	newSocket : GEPPETTO.MessageSocket,
	
	setup : function(){
		this.newSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/GeppettoServlet');

		//wait half a second before testing, allows for socket connection to be established
		setTimeout(function(){
			Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");
		},500);
	},
	teardown: function(){
		this.newSocket.close();
	}
});

asyncTest("Test list simulation variables no crash - SPH", function(){
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded successfully
				case MESSAGE_TYPE.SIMULATION_LOADED:
				ok(true, "Simulation loaded, passed");
				Simulation.start();
				Simulation.listWatchableVariables();
				break;
				case MESSAGE_TYPE.LIST_WATCH_VARS:
					ok(true, "Variables received");
					start();
					break;
				}
				
			}
	};

	this.newSocket.addHandler(handler);
});

module("Watch variables test",
		{
	
	newSocket : GEPPETTO.MessageSocket,
	
	setup : function(){
		this.newSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/GeppettoServlet');

		//wait half a second before testing, allows for socket connection to be established
		setTimeout(function(){
			Simulation.load("https://raw.github.com/openworm/org.geppetto.testbackend/master/src/main/resources/Test1.xml");
		},500);
	},
	teardown: function(){
		this.newSocket.close();
	}
});

asyncTest("Test add / get watchlists no crash - SPH", function(){
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded successfully
				case MESSAGE_TYPE.SIMULATION_LOADED:
				ok(true, "Simulation loaded, passed");
				Simulation.start();
				Simulation.addWatchLists([]);
				Simulation.getWatchLists();
				break;
				case MESSAGE_TYPE.SET_WATCH_VARS:
					ok(true, "Watch list set");
				break;
				case MESSAGE_TYPE.GET_WATCH_LISTS:
					ok(true, "Variables received");
					start();
					break;
				}
				
			}
	};

	this.newSocket.addHandler(handler);
});

asyncTest("Test watch Simulation variables", function(){
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded successfully
				case MESSAGE_TYPE.SIMULATION_LOADED:
				ok(true, "Simulation loaded, passed");
				Simulation.start();
				// TODO: try to retrieve some values and check they are not there 'cause we are not watching yet
				
				Simulation.startWatch();
				
				// TODO: retrieve some values and check they are changing
				
				Simulation.stopWatch();
				
				// TODO: retrieve some values and check they are not changing changing anymore
				
				Simulation.stop();
				
				start();
				break;	
			}
			}
	};

	this.newSocket.addHandler(handler);
	
});

asyncTest("Test clear watch Simulation variables", function(){
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded successfully
				case MESSAGE_TYPE.SIMULATION_LOADED:
				ok(true, "Simulation loaded, passed");
				Simulation.start();
				// TODO: try to retrieve some values and check they are not there 'cause we are not watching yet
				
				Simulation.clearWatchLists();
				
				Simulation.getWatchLists();
				start();
				break;	
				}
			}
	};

	this.newSocket.addHandler(handler);
});

asyncTest("Test Unit in Variables", function(){
	
	var handler = {
			onMessage : function(parsedServerMessage){

				// Switch based on parsed incoming message type
				switch(parsedServerMessage.type){
				//Simulation has been loaded successfully
				case MESSAGE_TYPE.SIMULATION_LOADED:
				Simulation.start();				
				Simulation.startWatch();
				break;	
				case MESSAGE_TYPE.SCENE_UPDATE:
		            var variables = JSON.parse(payload.update).variable_watch;
		            var time = JSON.parse(payload.update).time;
		            
		            notEqual(null,variables);
		            notEqual(null, time);	
					start();
		           break;
				}
			}
	};

	this.newSocket.addHandler(handler);
	
});