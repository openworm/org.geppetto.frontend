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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
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
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.model.VariableList;
import org.geppetto.core.simulation.ISimulation;
import org.geppetto.core.simulation.ISimulationCallbackListener;
import org.geppetto.frontend.GeppettoMessageInbound.VisitorRunMode;
import org.geppetto.frontend.SimulationServerConfig.ServerBehaviorModes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;

/**
 * Class that handles the Web Socket connections the servlet is receiving.
 * 
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 *
 */
public class GeppettoServletController{

	private static Log logger = LogFactory.getLog(GeppettoServletController.class);

	@Autowired
	private ISimulation simulationService;

	@Autowired
	private SimulationServerConfig simulationServerConfig;

	private final ConcurrentHashMap<Integer, GeppettoMessageInbound> _connections = new ConcurrentHashMap<Integer, GeppettoMessageInbound>();

	private List<GeppettoMessageInbound> observers = new ArrayList<GeppettoMessageInbound>();

	private static GeppettoServletController instance = null;
	
	private ISimulationCallbackListener simulationCallbackListener; 

	protected GeppettoServletController(){
		//Access SimulationService via spring injection of autowired dependencies
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
		
		simulationCallbackListener = new SimulationCallbackListener(this);
	}

	public static GeppettoServletController getInstance() {
		if(instance == null) {
			instance = new GeppettoServletController();
		}
		return instance;
	}

	/**
	 * Add new connection to list of current ones
	 * 
	 * @param newVisitor - New connection to be added to current ones
	 */
	public void addConnection(GeppettoMessageInbound newVisitor){
		_connections.put(Integer.valueOf(newVisitor.getConnectionID()), newVisitor);

		//Simulation is being used, notify new user controls are unavailable
		if(isSimulationInUse()){
			simulationControlsUnavailable(newVisitor);
		}
		//Simulation not in use, notify client is safe to read and load
		//any simulation file embedded in url
		else{
			messageClient(newVisitor, OUTBOUND_MESSAGE_TYPES.READ_URL_PARAMETERS);
		}
	}

	/**
	 * Remove connection from list of current ones.
	 * 
	 * @param exitingVisitor - Connection to be removed
	 */
	public void removeConnection(GeppettoMessageInbound exitingVisitor){
		_connections.remove(Integer.valueOf(exitingVisitor.getConnectionID()));

		//Handle operations after user closes connection
		postClosingConnectionCheck(exitingVisitor);
	}

	/**
	 * Return all the current web socket connections
	 * 
	 * @return
	 */
	public Collection<GeppettoMessageInbound> getConnections()
	{
		return Collections.unmodifiableCollection(_connections.values());
	}

	/**
	 * Initialize simulation with URL of model to load and listener
	 * 
	 * @param url - model to simulate
	 */
	public void initializeSimulation(URL url, GeppettoMessageInbound visitor){
		try
		{			
			switch(visitor.getCurrentRunMode()){

			//User in control attempting to load another simulation
			case CONTROLLING:
				
				//Clear canvas of users connected for new model to be loaded
				for(GeppettoMessageInbound observer : observers){
					messageClient(observer, OUTBOUND_MESSAGE_TYPES.RELOAD_CANVAS);
				}
				
				simulationServerConfig.setIsSimulationLoaded(false);
				//load another simulation
				simulationService.init(url, simulationCallbackListener);

				messageClient(visitor,OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED);
				break;

			default:
				/*
				 * Default user can only initialize it if it's not already in use.
				 * 
				 */
				if(!isSimulationInUse()){
					simulationServerConfig.setIsSimulationLoaded(false);
					simulationService.init(url, simulationCallbackListener);
					simulationServerConfig.setServerBehaviorMode(ServerBehaviorModes.CONTROLLED);
					visitor.setVisitorRunMode(VisitorRunMode.CONTROLLING);

					//Simulation just got someone to control it, notify everyone else
					//connected that simulation controls are unavailable.
					for(GeppettoMessageInbound connection : getConnections()){
						if(connection != visitor){
							simulationControlsUnavailable(connection);
						}
					}

					messageClient(visitor, OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED);
				}
				else{
					simulationControlsUnavailable(visitor);
				}
				break;
			}
		}
		//Catch any errors happening while attempting to read simulation
		catch (GeppettoInitializationException e) {
			messageClient(visitor,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION);
		}
	}
	
	//TODO: Merge repeated code in above and below method for initializing simulations.
	/**
	 * Different way to initialize simulation using JSON object instead of URL.
	 *
	 * @param simulation
	 * @param visitor
	 */
	public void initializeSimulation(String simulation, GeppettoMessageInbound visitor){
		try
		{			
			switch(visitor.getCurrentRunMode()){

			//User in control attempting to load another simulation
			case CONTROLLING:
				
				//Clear canvas of users connected for new model to be loaded
				for(GeppettoMessageInbound observer : observers){
					messageClient(observer, OUTBOUND_MESSAGE_TYPES.RELOAD_CANVAS);
				}
				
				simulationServerConfig.setIsSimulationLoaded(false);
				//load another simulation
				simulationService.init(simulation, simulationCallbackListener);

				messageClient(visitor,OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED);
				break;

			default:
				/*
				 * Default user can only initialize it if it's not already in use.
				 * 
				 */
				if(!isSimulationInUse()){
					simulationServerConfig.setIsSimulationLoaded(false);
					simulationService.init(simulation, simulationCallbackListener);
					simulationServerConfig.setServerBehaviorMode(ServerBehaviorModes.CONTROLLED);
					visitor.setVisitorRunMode(VisitorRunMode.CONTROLLING);

					//Simulation just got someone to control it, notify everyone else
					//connected that simulation controls are unavailable.
					for(GeppettoMessageInbound connection : getConnections()){
						if(connection != visitor){
							simulationControlsUnavailable(connection);
						}
					}

					messageClient(visitor, OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED);
				}
				else{
					simulationControlsUnavailable(visitor);
				}
				break;
			}
		}
		//Catch any errors happening while attempting to read simulation
		catch (GeppettoInitializationException e) {
			messageClient(visitor,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION);
		}
	}


	/**
	 * Start the simulation
	 */
	public void startSimulation(GeppettoMessageInbound controllingUser){
		try
		{
			simulationService.start();
			//notify user simulation has started
			messageClient(controllingUser,OUTBOUND_MESSAGE_TYPES.SIMULATION_STARTED);
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
	public void observeSimulation(GeppettoMessageInbound observingVisitor){		
		observers.add(observingVisitor);

		observingVisitor.setVisitorRunMode(VisitorRunMode.OBSERVING);

		if(!simulationService.isRunning()){
			messageClient(observingVisitor,OUTBOUND_MESSAGE_TYPES.LOAD_MODEL, getSimulationServerConfig().getLoadedScene());
		}
		//Notify visitor they are now in Observe Mode
		messageClient(observingVisitor, OUTBOUND_MESSAGE_TYPES.OBSERVER_MODE);
	}
	
	/**
	 * Request list of watchable variables for the simulation
	 * @throws JsonProcessingException 
	 */
	public void listWatchableVariables(GeppettoMessageInbound connection) throws JsonProcessingException{		
		// get watchable variables for the entire simulation
		VariableList vars = this.simulationService.listWatchableVariables();
		
		// serialize
		ObjectMapper mapper = new ObjectMapper();
		String serializedVars = mapper.writer().writeValueAsString(vars);
		
		// message the client with results
		this.messageClient(connection, OUTBOUND_MESSAGE_TYPES.LIST_WATCH_VARS, serializedVars);
	}
	
	/**
	 * Request list of forceable variables for the simulation
	 * @throws JsonProcessingException 
	 */
	public void listForceableVariables(GeppettoMessageInbound connection) throws JsonProcessingException{		
		// get forceable variables for the entire simulation
		VariableList vars = simulationService.listForceableVariables();
		
		// serialize
		ObjectMapper mapper = new ObjectMapper();
		String serializedVars = mapper.writer().writeValueAsString(vars);
		
		// message the client with results
		this.messageClient(connection, OUTBOUND_MESSAGE_TYPES.LIST_FORCE_VARS, serializedVars);
	}
	
	/**
	 * Adds watch lists with variables to be watched
	 */
	public void addWatchList(){		
		// TODO: implement
	}
	
	/**
	 * instructs simulation to start sending watched variables value to the client 
	 */
	public void startWatch(){		
		// TODO: implement
	}

	/**
	 * Simulation is being controlled by another user, new visitor that just loaded Geppetto Simulation in browser 
	 * is notified with an alert message of status of simulation.
	 * 
	 * @param id - ID of new Websocket connection. 
	 */
	public void simulationControlsUnavailable(GeppettoMessageInbound visitor)
	{	
		messageClient(visitor,OUTBOUND_MESSAGE_TYPES.SERVER_UNAVAILABLE);
	}

	/**
	 * On closing a client connection (WebSocket Connection), 
	 * perform check to see if user leaving was the one in control 
	 * of simulation if it was running. 
	 * 
	 * @param id - WebSocket ID of user closing connection
	 */
	public void postClosingConnectionCheck(GeppettoMessageInbound exitingVisitor){

		/*
		 * If the exiting visitor was running the simulation, notify all the observing
		 * visitors that the controls for the simulation became available
		 */
		if(exitingVisitor.getCurrentRunMode() == GeppettoMessageInbound.VisitorRunMode.CONTROLLING){

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
			for(GeppettoMessageInbound visitor : observers){
				//visitor.setVisitorRunMode(VisitorRunMode.DEFAULT);
				//send message to alert client of server availability
				messageClient(visitor,OUTBOUND_MESSAGE_TYPES.SERVER_AVAILABLE);
			}

		}			

		/*
		 * Closing connection is that of a visitor in OBSERVE mode, remove the 
		 * visitor from the list of observers. 
		 */
		else if (exitingVisitor.getCurrentRunMode() == GeppettoMessageInbound.VisitorRunMode.OBSERVING){
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
	 * @param connection - client to receive the message
	 * @param type - type of message to be send
	 */
	public void messageClient(GeppettoMessageInbound connection, OUTBOUND_MESSAGE_TYPES type){
		// get transport message to be sent to the client
		GeppettoTransportMessage transportMsg = TransportMessageFactory.getTransportMessage(type, null);
		String msg = new Gson().toJson(transportMsg);

		//Send the message to the client
		sendMessage(connection, msg);
	}

	/**
	 * Requests JSONUtility class for a json object with simulation update to 
	 * be send to the client
	 * 
	 * @param connection - client to receive the simulation update
	 * @param type - Type of udpate to be send
	 * @param update - update to be sent
	 */
	public void messageClient(GeppettoMessageInbound connection, OUTBOUND_MESSAGE_TYPES type, String update){
		// get transport message to be sent to the client
		GeppettoTransportMessage transportMsg = TransportMessageFactory.getTransportMessage(type, update);
		String msg = new Gson().toJson(transportMsg);

		sendMessage(connection, msg);
	}

	/**
	 * Sends a message to a specific user. The id of the 
	 * WebSocket connection is used to contact the desired user.
	 * 
	 * @param id - ID of WebSocket connection that will be sent a message
	 * @param msg - The message the user will be receiving
	 */
	public void sendMessage(GeppettoMessageInbound visitor, String msg){
		try
		{	
			long startTime=System.currentTimeMillis();
			CharBuffer buffer = CharBuffer.wrap(msg);
			visitor.getWsOutbound().writeTextMessage(buffer);
			String debug=((long)System.currentTimeMillis()-startTime)+"ms were spent sending a message of "+msg.length()/1024+"KB to the client";
			logger.info(debug); 
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

	public void getSimulationConfiguration(String url, GeppettoMessageInbound visitor) {
		String simulationConfiguration;
		
		try {
			simulationConfiguration = simulationService.getSimulationConfig(new URL(url));
			messageClient(visitor, OUTBOUND_MESSAGE_TYPES.SIMULATION_CONFIGURATION, simulationConfiguration);
		} catch (MalformedURLException e) {
			messageClient(visitor,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION_CONFIG);
		} catch (GeppettoInitializationException e) {
			messageClient(visitor,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION_CONFIG);
		}
	}
	
	public void getVersionNumber(GeppettoMessageInbound visitor){
		
		Properties prop = new Properties();
		
		try{
			prop.load(GeppettoServletController.class.getResourceAsStream("/Geppetto.properties"));
			messageClient(visitor, OUTBOUND_MESSAGE_TYPES.GEPPETTO_VERSION, prop.getProperty("Geppetto.version"));
		}
		catch(IOException e){
			e.printStackTrace();
		}
	}

	public void getScriptData(URL url, GeppettoMessageInbound visitor) {
		String line = null;
		StringBuilder sb = new StringBuilder();
		
		try {
			
			BufferedReader br = new BufferedReader(new InputStreamReader(url.openStream()));
			
			while((line=br.readLine())!= null){
			    sb.append(line+"\n");
			}
			 String script = sb.toString();
			 
			 messageClient(visitor, OUTBOUND_MESSAGE_TYPES.RUN_SCRIPT, script );
		} 
		catch (IOException e) {
			messageClient(visitor,OUTBOUND_MESSAGE_TYPES.ERROR_READING_SCRIPT);
		}
	}
}
