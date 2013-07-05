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

import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.simulation.ISimulation;
import org.geppetto.core.simulation.ISimulationCallbackListener;
import org.geppetto.frontend.SimulationServerConfig.ServerModes;
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
	
	@Autowired
	private ISimulation simulationService;
	
	@Autowired
	private SimulationServerConfig simulationServerConfig;

	private ISimulationCallbackListener simulationListener;
	
	private final ConcurrentHashMap<Integer, GeppettoVisitorWebSocket> _connections = new ConcurrentHashMap<Integer, GeppettoVisitorWebSocket>();

	private List<GeppettoVisitorWebSocket> observers = new ArrayList<GeppettoVisitorWebSocket>();

	private boolean simulationInUse;
	
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
	public void initializeSimulation(String url, GeppettoVisitorWebSocket controllingUser){
		try
		{
			simulationService.init(new URL(url), getSimulationListener());
			setSimulationInUse(true);
			simulationServerConfig.setServerBehavior(ServerModes.CONTROLLED);
			
			//Simulation just got someone to control it, notify everyone else
			//connected that simulation controls are unavailable.
			if(getConnections().size()>1){
				for(GeppettoVisitorWebSocket user : getConnections()){
					if(user != controllingUser){
						simulationControlsUnavailable(user);
					}
				}
			}
		}
		catch(MalformedURLException e)
		{
			throw new RuntimeException(e);
		} catch (GeppettoInitializationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
	}
	
	/**
	 * Start the simulation
	 */
	public void startSimulation(){
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
		if(visitor.getCurrentRunMode() != GeppettoVisitorWebSocket.RunMode.OBSERVING){
			//Notify new user(s), new websocket connections, if server is in use.
			//Simulation is in use, message to alert user(s)
			String msg = "The server is currently in use and this " +
					"instance of Geppetto does not support shared mode access" +
					" - you can join the ongoing simulation as an observer ";

			//Create JsonObject to transmit message to client (JS)
			JsonObject json = new JsonObject();			
			json.addProperty("type", "server_unavailable");
			json.addProperty("text", msg);

			//Method sending the message to the client 
			messageClient(visitor, json.toString());
		}
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
		if(exitingVisitor.getCurrentRunMode() == GeppettoVisitorWebSocket.RunMode.CONTROLLING){
			
			//Simulation no longer in use since controlling user is leaving
			setSimulationInUse(false);
			
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

			//JSON object used to send message to observer(s)' clients
			JsonObject json = new JsonObject();
			json.addProperty("type", "server_available");
			json.addProperty("text", msg);

			//Notify all observers
			for(GeppettoVisitorWebSocket visitor : observers){
				messageClient(visitor,json.toString());
			}
			
		}			
		
		/*
		 * Closing connection is that of a visitor in OBSERVE mode, remove the 
		 * visitor from the list of observers. 
		 */
		else if (exitingVisitor.getCurrentRunMode() == GeppettoVisitorWebSocket.RunMode.OBSERVING){
			//User observing simulation is closing the connection
			if(observers.contains(exitingVisitor)){
				//Remove user from observers list
				observers.remove(exitingVisitor);
			}
		}
	}
	

	/**
	 * Sends a message to a specific user. The id of the 
	 * WebSocket connection is used to contact the desired user.
	 * 
	 * @param id - ID of WebSocket connection that will be sent a message
	 * @param msg - The message the user will be receiving
	 */
	public boolean messageClient(GeppettoVisitorWebSocket visitor, String msg){
		try
		{				
			CharBuffer buffer = CharBuffer.wrap(msg);
			visitor.getWsOutbound().writeTextMessage(buffer);
		}
		catch (IOException ignore)
		{
			return false;
		}
		
		return true;
	}

	/**
	 * Keeps track of simulation usage and ID of WebSocket 
	 * of whomever is doing the controlling.
	 * 
	 * @param mode - State, used/not used, of the simulation
	 * @param userInControlID - ID of user doing the simulation control
	 */
	public void setSimulationInUse(boolean mode){
		this.simulationInUse = mode;
	}

	/**
	 * 
	 * @return
	 */
	public boolean isSimulationInUse(){
		return this.simulationInUse;
	}
	
	public void updateObserversScenes() {
		//JSON object used to send message to observer(s)' clients
		JsonObject json = new JsonObject();
		json.addProperty("type", "clean_canvas");

		//Notify all observers
		for(GeppettoVisitorWebSocket visitor : observers){
			messageClient(visitor,json.toString());
		}
	}
}
