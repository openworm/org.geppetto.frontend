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
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
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

	private boolean simulationInUse = false; 

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

		performStartUpCheck(newVisitor);
	}

	/**
	 * Performs start up check when new connection is established. 
	 * 
	 * @param newVisitor - New visitor 
	 */
	private void performStartUpCheck(GeppettoMessageInbound newVisitor) {
		//Simulation is being used, notify new user controls are unavailable
		if(isSimulationInUse()){
			if(this.simulationServerConfig.getServerBehaviorMode() == ServerBehaviorModes.OBSERVE){
				simulationControlsUnavailable(newVisitor);
			}
			else if(this.simulationServerConfig.getServerBehaviorMode() == ServerBehaviorModes.MULTIUSER){
				if(this.getConnections().size() > simulationService.getSimulatorCapacity()){
					messageClient(newVisitor,OUTBOUND_MESSAGE_TYPES.SIMULATOR_FULL, simulationService.getSimulatorName());
				}
			}
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
	 * Attempt to load simulation
	 * 
	 * @param simulation - Simulation to load
	 * @param visitor - Visitor doing the loading
	 */
	public void load(String simulation, GeppettoMessageInbound visitor){
		
		//Determine current mode of Geppetto
		switch(simulationServerConfig.getServerBehaviorMode()){
			//Handle multi user mode
			case MULTIUSER:
				loadInMultiUserMode(simulation, visitor);
				break;
				
			//Handle observe mode
			case OBSERVE:
				loadInObserverMode(simulation, visitor);
				break;
				default:
					break;
		}
	}
	
	/**
	 * Handle multiuser mode 
	 *  
	 * @param simulation - Simulation to be loaded
	 * @param visitor - Visitor doing the loading of simulation
	 */
	private void loadInMultiUserMode(String simulation, GeppettoMessageInbound visitor){
		//Simulation already in use
		if(isSimulationInUse()){
			switch(visitor.getCurrentRunMode()){
				//user attempting load is already in control of simulation servlet
				case CONTROLLING:
					loadSimulation(simulation, visitor);
					break;
				//user attempting load is in waiting list
				case WAITING:				
					break;
				//user attempting load is observing
				case OBSERVING:
					loadSimulation(simulation, visitor);
					break;
			}
		}
		//simulation is not in use, allow to load
		else{
			simulationInUse = loadSimulation(simulation, visitor);
		}
	}
	
	/**
	 * Handle observer mode 
	 *  
	 * @param simulation - Simulation to be loaded
	 * @param visitor - Visitor doing the loading of simulation
	 */
	private void loadInObserverMode(String simulation, GeppettoMessageInbound visitor){
		//Simulation already in use
		if(isSimulationInUse()){
			switch(visitor.getCurrentRunMode()){
				//user attempting load is already in control of simulation servlet
				case CONTROLLING:
					//Clear canvas of users connected for new model to be loaded
					for(GeppettoMessageInbound observer : observers){
						messageClient(observer, OUTBOUND_MESSAGE_TYPES.RELOAD_CANVAS);
					}
					loadSimulation(simulation, visitor);
					break;
				case WAITING:	
					//Do Nothing
					break;
				//user attempting to load can't do so since it's not user in control
				case OBSERVING:
					simulationControlsUnavailable(visitor);
					break;
			}
		}
		//simulation not in use 
		else{
			//load simulation
			simulationInUse = loadSimulation(simulation, visitor);
			
			//Simulation just got someone to control it, notify everyone else
			//connected that simulation controls are unavailable.
			for(GeppettoMessageInbound connection : getConnections()){
				if(connection != visitor){
					simulationControlsUnavailable(connection);
				}
			}
		}
	}
	
	/**
	 * Load simulation 
	 * 
	 * @param simulation - Simulation to load
	 * @param visitor - Visitor doing the loading of simulation
	 * 
	 * @return {boolean} - Success or failure
	 */
	private boolean loadSimulation(String simulation, GeppettoMessageInbound visitor){
		
		boolean loaded = false;
		
		simulationServerConfig.setIsSimulationLoaded(false);
		URL url = null;
		
		//attempt to convert simulation to URL
		try{
			url = new URL(simulation);
			//simulation is URL, initialize simulation services
			simulationService.init(url, simulationCallbackListener);
			loaded = true;
		}
		 /* Unable to make url from simulation, must be simulation content.
		  * URL validity checked in GeppettoMessageInbound prior to call here
		 */
		catch(MalformedURLException e){
			try {
				simulationService.init(simulation, simulationCallbackListener);
				loaded = true;
			} catch (GeppettoInitializationException e1) {
				messageClient(visitor,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION);
				loaded = false;
			}
		} catch (GeppettoInitializationException e) {
			messageClient(visitor,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION);
			loaded = false;
		}
		
		//set user as controlling
		visitor.setVisitorRunMode(VisitorRunMode.CONTROLLING);
		//notify user that simulation was loaded
		messageClient(visitor,OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED);
		
		return loaded;
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
			
			simulationInUse = false;

		}			

		/*
		 * Closing connection is that of a visitor in OBSERVE mode, remove the 
		 * visitor from the list of observers. 
		 */
		else if (exitingVisitor.getCurrentRunMode() == GeppettoMessageInbound.VisitorRunMode.OBSERVING){
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
		
		return simulationInUse ;
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
	
	/**
	 * Gets geppetto version number
	 * 
	 * @param visitor - Geppetto visitor requesting the version number
	 */
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

	/**
	 * Extracts script from its url location
	 * 
	 * @param url -Location of script
	 * @param visitor - Visitor requesting script data
	 */
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
