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
package org.geppetto.frontend;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.CharBuffer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.simulation.ISimulation;
import org.geppetto.core.simulation.ISimulationCallbackListener;
import org.geppetto.frontend.GeppettoVisitorWebSocket.VisitorRunMode;
import org.geppetto.frontend.SimulationServerConfig.ServerBehaviorModes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

import com.google.gson.JsonObject;

/**
 * Class that handles the Web Socket connections the servlet is receiving.
 * 
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 *
 */
public class SimulationVisitorsHandler {
	
	private static Log logger = LogFactory.getLog(SimulationVisitorsHandler.class);

	@Autowired
	private ISimulation simulationService;
	
	@Autowired
	private SimulationServerConfig simulationServerConfig;

	private ISimulationCallbackListener simulationListener;
	
	private final ConcurrentHashMap<Integer, GeppettoVisitorWebSocket> _connections = new ConcurrentHashMap<Integer, GeppettoVisitorWebSocket>();

	private List<GeppettoVisitorWebSocket> observers = new ArrayList<GeppettoVisitorWebSocket>();
	
	private static SimulationVisitorsHandler instance = null;
	
	protected SimulationVisitorsHandler(){
		//Access SimulationService via spring injection of autowired dependencies
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
	}
	
	public static SimulationVisitorsHandler getInstance() {
		if(instance == null) {
			instance = new SimulationVisitorsHandler();
		}
		return instance;
	}
	
	/**
	 * Creates the listener for the simulation.
	 * 
	 * @return
	 */
	private ISimulationCallbackListener getSimulationListener() {
		if(simulationListener == null){
			simulationListener = new SimulationListenerImpl(this);
		}
		return simulationListener;
	}
	
	/**
	 * Add new connection to list of current ones
	 * 
	 * @param newVisitor - New connection to be added to current ones
	 */
	public void addConnection(GeppettoVisitorWebSocket newVisitor){
		_connections.put(Integer.valueOf(newVisitor.getConnectionID()), newVisitor);
		
		//Simulation is being used, notify new user controls are unavailable
		if(isSimulationInUse()){
			simulationControlsUnavailable(newVisitor);
		}
	}
	
	/**
	 * Remove connection from list of current ones.
	 * 
	 * @param exitingVisitor - Connection to be removed
	 */
	public void removeConnection(GeppettoVisitorWebSocket exitingVisitor){
		_connections.remove(Integer.valueOf(exitingVisitor.getConnectionID()));
		
		postClosingConnectionCheck(exitingVisitor);
	}
	
	/**
	 * Return all the current web socket connections
	 * 
	 * @return
	 */
	public Collection<GeppettoVisitorWebSocket> getConnections()
	{
		return Collections.unmodifiableCollection(_connections.values());
	}
	
	/**
	 * Initialize simulation with URL of model to load and listener
	 * 
	 * @param url - model to simulate
	 */
	public void initializeSimulation(String url, GeppettoVisitorWebSocket visitor){
		try
		{			
			switch(visitor.getCurrentRunMode()){

			case CONTROLLING:
				//User in control loading another model, clean canvas before doing so
				sendJSONAction(visitor, "clean_canvas");

				//load another simulation
				simulationService.init(new URL(url), getSimulationListener());

				sendJSONAction(visitor, "simulation_loaded");

				//clear the canvas of users observing simulation as well
				for(GeppettoVisitorWebSocket observer : observers){
					sendJSONAction(observer, "clean_canvas");
				}

				break;

			case DEFAULT:
				//Default user can only initialize it if it's not already in use
				if(!isSimulationInUse()){

					simulationService.init(new URL(url), getSimulationListener());
					simulationServerConfig.setServerBehaviorMode(ServerBehaviorModes.CONTROLLED);
					visitor.setVisitorRunMode(VisitorRunMode.CONTROLLING);

					//Simulation just got someone to control it, notify everyone else
					//connected that simulation controls are unavailable.
					for(GeppettoVisitorWebSocket connection : getConnections()){
						if(connection != visitor){
							simulationControlsUnavailable(connection);
						}
					}

					sendJSONAction(visitor, "simulation_loaded");
				}
				break;
			default:
				break;
			}
		}
		//Catch any Malformed URL file entered by the user. 
		//Send back to client a message to display to user.
		catch(MalformedURLException e)
		{
			String msg = "A URL with invalid format has been entered."+
					"Please make sure you enter a valid URL in the input field and try again.";

			sendJSONMessage("error_loading_simulation", "Invalid URL", msg, visitor);

		}
		//Catch any errors happening while attempting to read simulation
		catch (GeppettoInitializationException e) {
			String msg = "URL does not correspond to valid Simulation file."+
					"Make sure you enter a valid Simulation file and try again.";

			sendJSONMessage("error_loading_simulation", "Invalid Simulation File", msg, visitor);
		}
	}
	
	/**
	 * Start the simulation
	 */
	public void startSimulation(GeppettoVisitorWebSocket controllingUser){
		try
		{
			simulationService.start();
		}
		catch(GeppettoExecutionException e)
		{
			throw new RuntimeException(e);
		}
	}

	/**
	 * Pause the simulation
	 */
	public void pauseSimulation(){
		try
		{
			simulationService.pause();
		}
		catch(GeppettoExecutionException e)
		{
			throw new RuntimeException(e);
		}	
	}
	
	/**
	 * Stop the running simulation
	 */
	public void stopSimulation(){
		try
		{
			simulationService.stop();
		}
		catch(GeppettoExecutionException e)
		{
			throw new RuntimeException(e);
		}
	}
	
	/**
	 * Add visitor to list users Observing simulation
	 * 
	 * @param observingVisitor - Geppetto visitor joining list of simulation observers
	 */
	public void observeSimulation(GeppettoVisitorWebSocket observingVisitor){		
		observers.add(observingVisitor);
		
		observingVisitor.setVisitorRunMode(VisitorRunMode.OBSERVING);
		
		//Simulation is in use, message to alert user(s)
		String alertMessage = "Another user is in control of starting and stopping the simulation.\n "+
							  "You are currently in observer mode.";

		String infoIconMessage = "Multiple users can collaboratively view the output of a single \n" +
								  "Geppetto simulation being run.  When the current user leaves the simulation, \n" +
								  "the remaining users will be able to take control and continue using it.";
		
		//Create JsonObject to transmit message to client (JS)
		JsonObject json = new JsonObject();			
		json.addProperty("type", "observer_mode_alert");
		json.addProperty("alertMessage", alertMessage);
		json.addProperty("popoverMessage", infoIconMessage);
		
		//Notify visitor they are now in Observe Mode
		messageClient(observingVisitor, json.toString());
	}
	
	/**
	 * Simulation is bein controlled by another user, new visitor that just loaded Geppetto Simulation in browser 
	 * is notified with an alert message of status of simulation.
	 * 
	 * @param id - ID of new Websocket connection. 
	 */
	public void simulationControlsUnavailable(GeppettoVisitorWebSocket visitor)
	{
		//Simulation is in use, message to alert user(s)
		String msg = "The server is currently in use and this " +
					"instance of Geppetto does not support shared mode access" +
					" - you can join the ongoing simulation as an observer ";
		
		sendJSONMessage("server_unavailable", "Server Unavailable", msg, visitor);
	}

	/**
	 * On closing a client connection (WebSocket Connection), 
	 * perform check to see if user leaving was the one in control 
	 * of simulation if it was running. 
	 * 
	 * @param id - WebSocket ID of user closing connection
	 */
	public void postClosingConnectionCheck(GeppettoVisitorWebSocket exitingVisitor){
		
		/*
		 * If the exiting visitor was running the simulation, notify all the observing
		 * visitors that the controls for the simulation became available
		 */
		if(exitingVisitor.getCurrentRunMode() == GeppettoVisitorWebSocket.VisitorRunMode.CONTROLLING){
			
			//Simulation no longer in use since controlling user is leaving
			simulationServerConfig.setServerBehaviorMode(ServerBehaviorModes.OBSERVE);
			
			//Controlling user is leaving, but simulation might still be running. 
			try{
				if(simulationService.isRunning()){
					//Pause running simulation upon controlling user's exit
					simulationService.stop();
				}
			}
			catch (GeppettoExecutionException e) {
				e.printStackTrace();
			}
			
			//Message to be displayed to observers waiting 
			String msg = "The current operator left the control of Geppetto." +
					" Refresh your browser to attempt to assume control (first come, first served).";

			//Notify all observers
			for(GeppettoVisitorWebSocket visitor : observers){
				//visitor.setVisitorRunMode(VisitorRunMode.DEFAULT);
				//send message to alert client of server availability
				sendJSONMessage("info_message", "Server Available", msg, visitor);
			}
			
		}			
		
		/*
		 * Closing connection is that of a visitor in OBSERVE mode, remove the 
		 * visitor from the list of observers. 
		 */
		else if (exitingVisitor.getCurrentRunMode() == GeppettoVisitorWebSocket.VisitorRunMode.OBSERVING){
			//User observing simulation is closing the connection
			if(observers.contains(exitingVisitor)){
				//Remove user from observers list
				observers.remove(exitingVisitor);
			}
		}
	}
	
	/**
	 * Creates a JSON object with a message that is send to the client. 
	 * Message is used by the client to alert user of event 
	 * going on in the server such as; server's availability, invalid URL/simulation files.
	 * 
	 * @param type - Type of message that is being sent
	 * @param title - Title of message
	 * @param msg - Body of message
	 * @param visitor - Client receiving the message
	 */
	private void sendJSONMessage(String type, String title, String msg, GeppettoVisitorWebSocket visitor){
		
		//JSON object used to send message to client
		JsonObject json = new JsonObject();
		json.addProperty("type", type);
		json.addProperty("title",title);
		json.addProperty("body", msg);
		
		//call method that sends message to client
		messageClient(visitor, json.toString());
	}
	
	/**
	 * Sends a message to a specific user. The id of the 
	 * WebSocket connection is used to contact the desired user.
	 * 
	 * @param id - ID of WebSocket connection that will be sent a message
	 * @param msg - The message the user will be receiving
	 */
	public void messageClient(GeppettoVisitorWebSocket visitor, String msg){
		try
		{				
			CharBuffer buffer = CharBuffer.wrap(msg);
			visitor.getWsOutbound().writeTextMessage(buffer);
		}
		catch (IOException ignore)
		{
			logger.error("Unable to communicate with client " + ignore.getMessage());
		}		
	}

	/**
	 * Returns status of server simulation used
	 * 
	 * @return
	 */
	public boolean isSimulationInUse(){
		if(simulationServerConfig.getServerBehaviorMode() == ServerBehaviorModes.CONTROLLED){
			return true;
		}
		
		return false;
	}
	
	/**
	 * Send client a JSON object with a type of action to handle. 
	 * 
	 */
	public void sendJSONAction(GeppettoVisitorWebSocket visitor, String type){
		//JSON object used to send message to client
		JsonObject json = new JsonObject();
		json.addProperty("type", type);

		//Message the visitor
		messageClient(visitor,json.toString());
	}
}
