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
import org.geppetto.core.data.model.WatchList;
import org.geppetto.core.simulation.ISimulation;
import org.geppetto.core.simulation.ISimulationCallbackListener;
import org.geppetto.frontend.GeppettoMessageInbound.VisitorRunMode;
import org.geppetto.frontend.SimulationServerConfig.ServerBehaviorModes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

/**
 * Class that handles the Web Socket connections the servlet is receiving.
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

	private final ConcurrentHashMap<String, GeppettoMessageInbound> _connections = new ConcurrentHashMap<String, GeppettoMessageInbound>();

	private List<GeppettoMessageInbound> observers = new ArrayList<GeppettoMessageInbound>();

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
	public void addConnection(GeppettoMessageInbound newVisitor){
		_connections.put(newVisitor.getConnectionID(), newVisitor);

		//Simulation is being used, notify new user controls are unavailable
		if(isSimulationInUse()){
			simulationControlsUnavailable(newVisitor);
		}
		//Simulation not in use, notify client is safe to read and load
		//any simulation file embedded in url
		else{
			messageClient(null,newVisitor, OUTBOUND_MESSAGE_TYPES.READ_URL_PARAMETERS);
		}
	}

	/**
	 * Remove connection from list of current ones.
	 * 
	 * @param exitingVisitor - Connection to be removed
	 */
	public void removeConnection(GeppettoMessageInbound exitingVisitor){
		_connections.remove(exitingVisitor.getConnectionID());

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
	public void initializeSimulation(String requestID, URL url, GeppettoMessageInbound visitor){
		try
		{		
			JsonObject scriptsJSON = new JsonObject();

			switch(visitor.getCurrentRunMode()){

			//User in control attempting to load another simulation
			case CONTROLLING:
				
				//Clear canvas of users connected for new model to be loaded
				for(GeppettoMessageInbound observer : observers){
					messageClient(requestID,observer, OUTBOUND_MESSAGE_TYPES.RELOAD_CANVAS);
				}
				
				simulationServerConfig.setIsSimulationLoaded(false);
				//load another simulation
				simulationService.init(url, this);

				for(URL scriptURL : simulationService.getScripts()){						
					scriptsJSON.addProperty("script", scriptURL.toString());
				}
				
				messageClient(requestID,visitor, OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED, "{ \"scripts\":" + scriptsJSON.toString() + "}");
				
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
					for(GeppettoMessageInbound connection : getConnections()){
						if(connection != visitor){
							simulationControlsUnavailable(connection);
						}
					}

					for(URL scriptURL : simulationService.getScripts()){						
						scriptsJSON.addProperty("script", scriptURL.toString());
					}
					
					messageClient(requestID,visitor, OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED, "{ \"scripts\":" + scriptsJSON.toString() + "}");
				}
				else{
					simulationControlsUnavailable(visitor);
				}
				break;
			}
		}
		//Catch any errors happening while attempting to read simulation
		catch (GeppettoInitializationException e) {
			messageClient(requestID,visitor,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION);
		}
	}
	
	//TODO: Merge repeated code in above and below method for initializing simulations.
	/**
	 * Different way to initialize simulation using JSON object instead of URL.
	 *
	 * @param simulation
	 * @param visitor
	 */
	public void initializeSimulation(String requestID, String simulation, GeppettoMessageInbound visitor){
		try
		{			
			switch(visitor.getCurrentRunMode()){

			//User in control attempting to load another simulation
			case CONTROLLING:
				
				//Clear canvas of users connected for new model to be loaded
				for(GeppettoMessageInbound observer : observers){
					messageClient(requestID, observer, OUTBOUND_MESSAGE_TYPES.RELOAD_CANVAS);
				}
				
				simulationServerConfig.setIsSimulationLoaded(false);
				//load another simulation
				simulationService.init(simulation, this);

				messageClient(requestID,visitor,OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED);
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
					for(GeppettoMessageInbound connection : getConnections()){
						if(connection != visitor){
							simulationControlsUnavailable(connection);
						}
					}

					messageClient(requestID,visitor, OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED);
				}
				else{
					simulationControlsUnavailable(visitor);
				}
				break;
			}
		}
		//Catch any errors happening while attempting to read simulation
		catch (GeppettoInitializationException e) {
			messageClient(requestID,visitor,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION);
		}
	}


	/**
	 * Start the simulation
	 */
	public void startSimulation(String requestID,GeppettoMessageInbound controllingUser){
		try
		{
			simulationService.start();
			//notify user simulation has started
			messageClient(requestID,controllingUser,OUTBOUND_MESSAGE_TYPES.SIMULATION_STARTED);
		}
		catch(GeppettoExecutionException e)
		{
			throw new RuntimeException(e);
		}
	}

	/**
	 * Pause the simulation
	 */
	public void pauseSimulation(String requestID,GeppettoMessageInbound controllingUser){
		try
		{
			simulationService.pause();
			//notify user simulation has been paused
			messageClient(requestID,controllingUser,OUTBOUND_MESSAGE_TYPES.SIMULATION_PAUSED);
		}
		catch(GeppettoExecutionException e)
		{
			throw new RuntimeException(e);
		}	
	}

	/**
	 * Stop the running simulation
	 */
	public void stopSimulation(String requestID,GeppettoMessageInbound controllingUser){
		try
		{
			simulationService.stop();
			//notify user simulation has been stopped
			messageClient(requestID,controllingUser,OUTBOUND_MESSAGE_TYPES.SIMULATION_STOPPED);
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
	public void observeSimulation(String requestID, GeppettoMessageInbound observingVisitor){		
		observers.add(observingVisitor);

		observingVisitor.setVisitorRunMode(VisitorRunMode.OBSERVING);

		if(!simulationService.isRunning()){
			messageClient(requestID,observingVisitor,OUTBOUND_MESSAGE_TYPES.LOAD_MODEL, getSimulationServerConfig().getLoadedScene());
		}
		//Notify visitor they are now in Observe Mode
		messageClient(requestID, observingVisitor, OUTBOUND_MESSAGE_TYPES.OBSERVER_MODE);
	}
	
	/**
	 * Request list of watchable variables for the simulation
	 * @throws JsonProcessingException 
	 */
	public void listWatchableVariables(String requestID, GeppettoMessageInbound connection) throws JsonProcessingException{		
		// get watchable variables for the entire simulation
		VariableList vars = this.simulationService.listWatchableVariables();
		
		// serialize
		ObjectMapper mapper = new ObjectMapper();
		String serializedVars = mapper.writer().writeValueAsString(vars);
		
		// message the client with results
		this.messageClient(requestID, connection, OUTBOUND_MESSAGE_TYPES.LIST_WATCH_VARS, serializedVars);
	}
	
	/**
	 * Request list of forceable variables for the simulation
	 * @throws JsonProcessingException 
	 */
	public void listForceableVariables(String requestID, GeppettoMessageInbound connection) throws JsonProcessingException{		
		// get forceable variables for the entire simulation
		VariableList vars = simulationService.listForceableVariables();
		
		// serialize
		ObjectMapper mapper = new ObjectMapper();
		String serializedVars = mapper.writer().writeValueAsString(vars);
		
		// message the client with results
		this.messageClient(requestID, connection, OUTBOUND_MESSAGE_TYPES.LIST_FORCE_VARS, serializedVars);
	}
	
	/**
	 * Adds watch lists with variables to be watched
	 * @throws GeppettoExecutionException 
	 */
	public void addWatchLists(String requestID, String jsonLists, GeppettoMessageInbound connection) throws GeppettoExecutionException{
		List<WatchList> lists = null;
		
		try {
			lists = fromJSON(new TypeReference<List<WatchList>>() {}, jsonLists);
		} catch (GeppettoExecutionException e) {
			throw new RuntimeException(e);
		}
		
		// TODO: do a check that variables with those names actually exists for the current simulation
		// TODO: throw exception if not
		
		simulationService.addWatchLists(lists);
	}
	
	/**
	 * instructs simulation to start sending watched variables value to the client 
	 * @param requestID 
	 */
	public void startWatch(String requestID, GeppettoMessageInbound connection){		
		simulationService.startWatch();
	}
	
	/**
	 * instructs simulation to stop sending watched variables value to the client 
	 */
	public void stopWatch(String requestID, GeppettoMessageInbound connection){		
		simulationService.stopWatch();
	}
	
	/**
	 * instructs simulation to clear watch lists 
	 */
	public void clearWatchLists(String requestID, GeppettoMessageInbound connection){		
		simulationService.clearWatchLists();
	}
	
	/**
	 * Get simulation watch lists 
	 * @throws JsonProcessingException 
	 */
	public void getWatchLists(String requestID, GeppettoMessageInbound connection) throws JsonProcessingException{		
		List<WatchList> watchLists = simulationService.getWatchLists();
		
		// serialize watch-lists
		ObjectMapper mapper = new ObjectMapper();
		String serializedLists = mapper.writer().writeValueAsString(watchLists);
		
		// message the client with results
		this.messageClient(requestID, connection, OUTBOUND_MESSAGE_TYPES.GET_WATCH_LISTS, serializedLists);
	} 

	/**
	 * Simulation is being controlled by another user, new visitor that just loaded Geppetto Simulation in browser 
	 * is notified with an alert message of status of simulation.
	 * 
	 * @param id - ID of new Websocket connection. 
	 */
	public void simulationControlsUnavailable(GeppettoMessageInbound visitor)
	{	
		messageClient(null,visitor,OUTBOUND_MESSAGE_TYPES.SERVER_UNAVAILABLE);
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
				messageClient(null,visitor,OUTBOUND_MESSAGE_TYPES.SERVER_AVAILABLE);
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
	 * @param requestID 
	 * 
	 * @param connection - client to receive the message
	 * @param type - type of message to be send
	 * @param string 
	 */
	public void messageClient(String requestID, GeppettoMessageInbound connection, OUTBOUND_MESSAGE_TYPES type){
		// get transport message to be sent to the client
		GeppettoTransportMessage transportMsg = TransportMessageFactory.getTransportMessage(requestID,type, null);
		String msg = new Gson().toJson(transportMsg);

		// Send the message to the client
		sendMessage(connection, msg);
	}

	/**
	 * Requests JSONUtility class for a json object with simulation update to 
	 * be send to the client
	 * 
	 * @param connection - client to receive the simulation update
	 * @param connection - Type of udpate to be send
	 * @param reloadCanvas - update to be sent
	 */
	public void messageClient(String requestID, GeppettoMessageInbound connection, OUTBOUND_MESSAGE_TYPES type, String update){
		// get transport message to be sent to the client
		GeppettoTransportMessage transportMsg = TransportMessageFactory.getTransportMessage(requestID, type, update);
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

	/**
	 * Receives update from simulation when there are new ones. 
	 * From here the updates are send to the connected clients
	 * 
	 */
	@Override
	public void updateReady(String sceneUpdate, String variableWatchTree) {
		long start=System.currentTimeMillis();
		Date date = new Date(start);
		DateFormat formatter = new SimpleDateFormat("HH:mm:ss:SSS");
		String dateFormatted = formatter.format(date);
		logger.info("Simulation Frontend Update Starting: "+dateFormatted);

		OUTBOUND_MESSAGE_TYPES action = OUTBOUND_MESSAGE_TYPES.SCENE_UPDATE;

		/*
		 * Simulation is running but model has not yet been loaded. 
		 */
		if(!getSimulationServerConfig().isSimulationLoaded()){
			action = OUTBOUND_MESSAGE_TYPES.LOAD_MODEL;

			getSimulationServerConfig().setIsSimulationLoaded(true);
			
		}

		for (GeppettoMessageInbound connection : getConnections())
		{				
			// pack sceneUpdate and variableWatchTree in the same JSON string
			String update = "{ \"entities\":" + sceneUpdate  + ", \"variable_watch\": " + variableWatchTree + "}";
			
			// Notify all connected clients about update either to load model or update current one.
			messageClient(null,connection, action , update);
		}

		getSimulationServerConfig().setLoadedScene(sceneUpdate);

		logger.info("Simulation Frontend Update Finished: Took:"+(System.currentTimeMillis()-start));
	}

	public void getSimulationConfiguration(String requestID, String url, GeppettoMessageInbound visitor) {
		String simulationConfiguration;
		
		try {
			simulationConfiguration = simulationService.getSimulationConfig(new URL(url));
			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.SIMULATION_CONFIGURATION, simulationConfiguration);
		} catch (MalformedURLException e) {
			messageClient(requestID, visitor,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION_CONFIG);
		} catch (GeppettoInitializationException e) {
			messageClient(requestID, visitor,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION_CONFIG);
		}
	}
	
	public void getVersionNumber(String requestID, GeppettoMessageInbound visitor){
		
		Properties prop = new Properties();
		
		try{
			prop.load(SimulationListener.class.getResourceAsStream("/Geppetto.properties"));
			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.GEPPETTO_VERSION, prop.getProperty("Geppetto.version"));
		}
		catch(IOException e){
			e.printStackTrace();
		}
	}

	/**
	 * Sends parsed data from script to visitor client
	 * 
	 * @param requestID - Requested ID for process
	 * @param url - URL of script location
	 * @param visitor - Client doing the operation
	 */
	public void sendScriptData(String requestID, URL url, GeppettoMessageInbound visitor) {		
		try {			 
			String line = null;
			StringBuilder sb = new StringBuilder();

			BufferedReader br = new BufferedReader(new InputStreamReader(url.openStream()));

			while((line=br.readLine())!= null){
				sb.append(line+"\n");
			}
			String script = sb.toString();	

			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.RUN_SCRIPT, script );
		} 
		catch (IOException e) {
			messageClient(requestID, visitor,OUTBOUND_MESSAGE_TYPES.ERROR_READING_SCRIPT);
		}
	}
	
	
	public static <T> T fromJSON(final TypeReference<T> type, String jsonPacket) throws GeppettoExecutionException {
		   T data = null;

		   try {
		      data = new ObjectMapper().readValue(jsonPacket, type);
		   } catch (Exception e) {
		      throw new GeppettoExecutionException("could not de-serialize json");
		   }
		   return data;
	}
}
