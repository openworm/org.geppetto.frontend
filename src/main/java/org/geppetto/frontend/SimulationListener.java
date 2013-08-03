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
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.simulation.ISimulation;
import org.geppetto.core.simulation.ISimulationCallbackListener;
import org.geppetto.frontend.GeppettoVisitorWebSocket.VisitorRunMode;
import org.geppetto.frontend.JSONUtility.MESSAGES_TYPES;
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
public class SimulationListener implements ISimulationCallbackListener {

	private static Log logger = LogFactory.getLog(SimulationListener.class);

	@Autowired
	private ISimulation simulationService;

	@Autowired
	private SimulationServerConfig simulationServerConfig;

	private final ConcurrentHashMap<Integer, GeppettoVisitorWebSocket> _connections = 
			new ConcurrentHashMap<Integer, GeppettoVisitorWebSocket>();

	private List<GeppettoVisitorWebSocket> observers = new ArrayList<GeppettoVisitorWebSocket>();

	private static SimulationListener instance = null;

	protected SimulationListener(){
		//Access SimulationService via spring injection of autowired dependencies
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
	}

	public static SimulationListener getInstance() {
		if(instance == null) {
			instance = new SimulationListener();
		}
		return instance;
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
		//Simulation not in use, notify client is safe to read and load
		//any simulation file embedded in url
		else{
			messageClient(newVisitor, MESSAGES_TYPES.READ_URL_PARAMETERS);
		}
	}

	/**
	 * Remove connection from list of current ones.
	 * 
	 * @param exitingVisitor - Connection to be removed
	 */
	public void removeConnection(GeppettoVisitorWebSocket exitingVisitor){
		_connections.remove(Integer.valueOf(exitingVisitor.getConnectionID()));

		//Handle operations after user closes connection
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
	public void initializeSimulation(URL url, GeppettoVisitorWebSocket visitor){
		try
		{			
			switch(visitor.getCurrentRunMode()){

			//User in control attempting to load another simulation
			case CONTROLLING:
				
				//Clear canvas of users connected for new model to be loaded
				for(GeppettoVisitorWebSocket connection : getConnections()){
					messageClient(connection, MESSAGES_TYPES.CLEAR_CANVAS);
				}
				
				simulationServerConfig.setIsSimulationLoaded(false);
				//load another simulation
				simulationService.init(url, this);

				messageClient(visitor,MESSAGES_TYPES.SIMULATION_LOADED);
				break;

			default:
				/*
				 * Default user can only initialize it if it's not already in use.
				 * 
				 */
				if(!isSimulationInUse()){
					simulationServerConfig.setIsSimulationLoaded(false);
					simulationService.init(url, this);
					simulationServerConfig.setServerBehaviorMode(ServerBehaviorModes.CONTROLLED);
					visitor.setVisitorRunMode(VisitorRunMode.CONTROLLING);

					//Simulation just got someone to control it, notify everyone else
					//connected that simulation controls are unavailable.
					for(GeppettoVisitorWebSocket connection : getConnections()){
						if(connection != visitor){
							simulationControlsUnavailable(connection);
						}
					}

					messageClient(visitor, MESSAGES_TYPES.SIMULATION_LOADED);
				}
				else{
					simulationControlsUnavailable(visitor);
				}
				break;
			}
		}
		//Catch any errors happening while attempting to read simulation
		catch (GeppettoInitializationException e) {
			messageClient(visitor,MESSAGES_TYPES.ERROR_LOADING_SIMULATION);
		}
	}
	
	//TODO: Merge repeated code in above and below method for initializing simulations.
	/**
	 * Different way to initialize simulation using JSON object instead of URL.
	 *
	 * @param simulation
	 * @param visitor
	 */
	public void initializeSimulation(String simulation, GeppettoVisitorWebSocket visitor){
		try
		{			
			switch(visitor.getCurrentRunMode()){

			//User in control attempting to load another simulation
			case CONTROLLING:
				
				//Clear canvas of users connected for new model to be loaded
				for(GeppettoVisitorWebSocket connection : getConnections()){
					messageClient(connection, MESSAGES_TYPES.CLEAR_CANVAS);
				}
				
				simulationServerConfig.setIsSimulationLoaded(false);
				//load another simulation
				simulationService.init(simulation, this);

				messageClient(visitor,MESSAGES_TYPES.SIMULATION_LOADED);
				break;

			default:
				/*
				 * Default user can only initialize it if it's not already in use.
				 * 
				 */
				if(!isSimulationInUse()){
					simulationServerConfig.setIsSimulationLoaded(false);
					simulationService.init(simulation, this);
					simulationServerConfig.setServerBehaviorMode(ServerBehaviorModes.CONTROLLED);
					visitor.setVisitorRunMode(VisitorRunMode.CONTROLLING);

					//Simulation just got someone to control it, notify everyone else
					//connected that simulation controls are unavailable.
					for(GeppettoVisitorWebSocket connection : getConnections()){
						if(connection != visitor){
							simulationControlsUnavailable(connection);
						}
					}

					messageClient(visitor, MESSAGES_TYPES.SIMULATION_LOADED);
				}
				else{
					simulationControlsUnavailable(visitor);
				}
				break;
			}
		}
		//Catch any errors happening while attempting to read simulation
		catch (GeppettoInitializationException e) {
			messageClient(visitor,MESSAGES_TYPES.ERROR_LOADING_SIMULATION);
		}
	}


	/**
	 * Start the simulation
	 */
	public void startSimulation(GeppettoVisitorWebSocket controllingUser){
		try
		{
			simulationService.start();
			//notify user simulation has started
			messageClient(controllingUser,MESSAGES_TYPES.SIMULATION_STARTED);
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

		if(!simulationService.isRunning()){
			messageClient(observingVisitor,MESSAGES_TYPES.LOAD_MODEL, getSimulationServerConfig().getLoadedScene());
		}
		//Notify visitor they are now in Observe Mode
		messageClient(observingVisitor, MESSAGES_TYPES.OBSERVER_MODE);
	}

	/**
	 * Simulation is being controlled by another user, new visitor that just loaded Geppetto Simulation in browser 
	 * is notified with an alert message of status of simulation.
	 * 
	 * @param id - ID of new Websocket connection. 
	 */
	public void simulationControlsUnavailable(GeppettoVisitorWebSocket visitor)
	{	
		messageClient(visitor,MESSAGES_TYPES.SERVER_UNAVAILABLE);
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

			//Notify all observers
			for(GeppettoVisitorWebSocket visitor : observers){
				//visitor.setVisitorRunMode(VisitorRunMode.DEFAULT);
				//send message to alert client of server availability
				messageClient(visitor,MESSAGES_TYPES.SERVER_AVAILABLE);
			}

		}			

		/*
		 * Closing connection is that of a visitor in OBSERVE mode, remove the 
		 * visitor from the list of observers. 
		 */
		else if (exitingVisitor.getCurrentRunMode() == GeppettoVisitorWebSocket.VisitorRunMode.OBSERVING){
			if(getConnections().size() ==0 && (simulationServerConfig.getServerBehaviorMode() == ServerBehaviorModes.CONTROLLED)){
				simulationServerConfig.setServerBehaviorMode(ServerBehaviorModes.OBSERVE);
			}
			
			//User observing simulation is closing the connection
			if(observers.contains(exitingVisitor)){
				//Remove user from observers list
				observers.remove(exitingVisitor);
			}
		}
	}

	/**
	 * Requests JSONUtility class for a json object with a message to send to the client
	 * 
	 * @param visitor - client to receive the message
	 * @param type - type of message to be send
	 */
	public void messageClient(GeppettoVisitorWebSocket visitor, MESSAGES_TYPES type){
		//Create a JSON object to be send to the client
		JsonObject jsonUpdate = JSONUtility.getInstance().getJSONObject(type);
		String msg = jsonUpdate.toString();

		//Send the message to the client
		sendMessage(visitor, msg);
	}

	/**
	 * Requests JSONUtility class for a json object with simulation update to 
	 * be send to the client
	 * 
	 * @param visitor - Client to receive the simulation update
	 * @param type - Type of udpate to be send
	 * @param update - update to be send
	 */
	private void messageClient(GeppettoVisitorWebSocket visitor, MESSAGES_TYPES type, String update){
		JsonObject jsonUpdate = JSONUtility.getInstance().getJSONObject(type, update);
		String msg = jsonUpdate.toString();

		sendMessage(visitor, msg);
	}

	/**
	 * Sends a message to a specific user. The id of the 
	 * WebSocket connection is used to contact the desired user.
	 * 
	 * @param id - ID of WebSocket connection that will be sent a message
	 * @param msg - The message the user will be receiving
	 */
	public void sendMessage(GeppettoVisitorWebSocket visitor, String msg){
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


	public SimulationServerConfig getSimulationServerConfig() {
		return simulationServerConfig;
	}

	/**
	 * Receives update from simulation when there are new ones. 
	 * From here the updates are send to the connected clients
	 * 
	 */
	@Override
	public void updateReady(String update) {
		long start=System.currentTimeMillis();
		Date date = new Date(start);
		DateFormat formatter = new SimpleDateFormat("HH:mm:ss:SSS");
		String dateFormatted = formatter.format(date);
		logger.info("Simulation Frontend Update Starting: "+dateFormatted);

		MESSAGES_TYPES action = MESSAGES_TYPES.SCENE_UPDATE;

		/*
		 * Simulation is running but model has not yet been loaded. 
		 */
		if(!getSimulationServerConfig().isSimulationLoaded()){
			action = MESSAGES_TYPES.LOAD_MODEL;

			getSimulationServerConfig().setIsSimulationLoaded(true);
		}

		for (GeppettoVisitorWebSocket connection : getConnections())
		{				
			//Notify all connected clients about update either to load model or update current one.
			messageClient(connection, action , update);
		}

		getSimulationServerConfig().setLoadedScene(update);

		logger.info("Simulation Frontend Update Finished: Took:"+(System.currentTimeMillis()-start));
	}

	public void getSimulationConfiguration(String url, GeppettoVisitorWebSocket visitor) {
		String simulationConfiguration;
		
		try {
			simulationConfiguration = simulationService.getSimulationConfig(new URL(url));
			messageClient(visitor, MESSAGES_TYPES.SIMULATION_CONFIGURATION, simulationConfiguration);
		} catch (MalformedURLException e) {
			messageClient(visitor,MESSAGES_TYPES.ERROR_LOADING_SIMULATION_CONFIG);
		} catch (GeppettoInitializationException e) {
			messageClient(visitor,MESSAGES_TYPES.ERROR_LOADING_SIMULATION_CONFIG);
		}
	}
}
