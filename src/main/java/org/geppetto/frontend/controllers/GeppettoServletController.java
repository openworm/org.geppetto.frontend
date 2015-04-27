/*******************************************************************************
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 - 2015 OpenWorm.
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
package org.geppetto.frontend.controllers;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.CharBuffer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.simulation.ISimulationCallbackListener;
import org.geppetto.frontend.GeppettoTransportMessage;
import org.geppetto.frontend.MultiuserSimulationCallback;
import org.geppetto.frontend.OUTBOUND_MESSAGE_TYPES;
import org.geppetto.frontend.ObservermodeSimulationCallback;
import org.geppetto.frontend.TransportMessageFactory;
import org.geppetto.frontend.controllers.GeppettoMessageInbound.VisitorRunMode;
import org.geppetto.frontend.controllers.SimulationServerConfig.ServerBehaviorModes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

/**
 * Class that handles the Web Socket connections the servlet is receiving.
 * 
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 * 
 */
public class GeppettoServletController
{

	private static Log _logger = LogFactory.getLog(GeppettoServletController.class);

	@Autowired
	private SimulationServerConfig _simulationServerConfig;

	private static GeppettoServletController _instance = null;

	private ISimulationCallbackListener _simulationCallbackListener;

	private final ConcurrentHashMap<String, GeppettoMessageInbound> _connections = new ConcurrentHashMap<String, GeppettoMessageInbound>();

	private List<GeppettoMessageInbound> _queueUsers = new ArrayList<GeppettoMessageInbound>();

	private List<GeppettoMessageInbound> _observers = new ArrayList<GeppettoMessageInbound>();

	private boolean _simulationInUse = false;

	protected GeppettoServletController()
	{
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);

	}

	public static GeppettoServletController getInstance()
	{
		if(_instance == null)
		{
			_instance = new GeppettoServletController();
		}
		return _instance;
	}

	/**
	 * Add new connection to list of current ones
	 * 
	 * @param newVisitor
	 *            - New connection to be added to current ones
	 */
	public void addConnection(GeppettoMessageInbound newVisitor)
	{
		_connections.put(newVisitor.getConnectionID(), newVisitor);

		_logger.info("New connection " + newVisitor.getConnectionID());

		performStartUpCheck(newVisitor);
	}

	/**
	 * Remove connection from list of current ones.
	 * 
	 * @param exitingVisitor
	 *            - Connection to be removed
	 */
	public void removeConnection(GeppettoMessageInbound exitingVisitor)
	{
		if(_connections.contains(exitingVisitor))
		{
			_connections.remove(exitingVisitor.getConnectionID());
			_logger.info("Removing connection " + exitingVisitor.getConnectionID());
			// Handle operations after user closes connection
			postClosingConnectionCheck(exitingVisitor);
		}
	}

	/**
	 * Performs start up check when new connection is established.
	 * 
	 * @param newVisitor
	 *            - New visitor
	 */
	private void performStartUpCheck(GeppettoMessageInbound newVisitor)
	{

		for(GeppettoMessageInbound client : this.getConnections())
		{
			CharBuffer buffer = CharBuffer.wrap("ping");
			try
			{
				client.getWsOutbound().writeTextMessage(buffer);
			}
			catch(IOException e)
			{
				_logger.error("Unable to communicate with client " + e.getMessage() + ". Removing connection.");
				this.removeConnection(client);
			}
		}

		if(this._simulationServerConfig.getServerBehaviorMode() == ServerBehaviorModes.OBSERVE)
		{
			// Simulation is being used, notify new user controls are
			// unavailable
			if(isSimulationInUse())
			{
				simulationControlsUnavailable(newVisitor);
			}
		}
		else if(this._simulationServerConfig.getServerBehaviorMode() == ServerBehaviorModes.MULTIUSER)
		{
			int simulatorCapacity = newVisitor.getSimulationService().getSimulationCapacity();

			if((this.getConnections().size() > simulatorCapacity) && (simulatorCapacity > 1))
			{

				int position = (this.getConnections().size() - newVisitor.getSimulationService().getSimulationCapacity());
				String update = "Simulation is full, you are number " + position + " on the" + " waitlist";

				_queueUsers.add(newVisitor);
				messageClient(null, newVisitor, OUTBOUND_MESSAGE_TYPES.SIMULATOR_FULL, update);
			}
			else
			{
				messageClient(null, newVisitor, OUTBOUND_MESSAGE_TYPES.READ_URL_PARAMETERS);
			}
		}
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
	 * @param simulation
	 *            - Simulation to load
	 * @param visitor
	 *            - Visitor doing the loading
	 */
	public void load(String requestID, String simulation, GeppettoMessageInbound visitor)
	{

		// Determine current mode of Geppetto
		switch(_simulationServerConfig.getServerBehaviorMode())
		{
		// Handle multi user mode
			case MULTIUSER:
				_simulationCallbackListener = new MultiuserSimulationCallback(visitor);
				loadInMultiUserMode(requestID, simulation, visitor);
				break;

			// Handle observe mode
			case OBSERVE:
				_simulationCallbackListener = ObservermodeSimulationCallback.getInstance();
				loadInObserverMode(requestID, simulation, visitor);
				break;
			default:
				break;
		}
	}

	/**
	 * Handle multiuser mode
	 * 
	 * @param simulation
	 *            - Simulation to be loaded
	 * @param visitor
	 *            - Visitor doing the loading of simulation
	 */
	private void loadInMultiUserMode(String requestID, String simulation, GeppettoMessageInbound visitor)
	{
		visitor.setIsSimulationLoaded(false);
		loadSimulation(requestID, simulation, visitor);
	}

	/**
	 * Handle observer mode
	 * 
	 * @param simulation
	 *            - Simulation to be loaded
	 * @param visitor
	 *            - Visitor doing the loading of simulation
	 */
	private void loadInObserverMode(String requestID, String simulation, GeppettoMessageInbound visitor)
	{
		// Simulation already in use
		if(isSimulationInUse())
		{
			switch(visitor.getCurrentRunMode())
			{
			// user attempting load is already in control of simulation servlet
				case CONTROLLING:
					_simulationServerConfig.setIsSimulationLoaded(false);
					// Clear canvas of users connected for new model to be loaded
					for(GeppettoMessageInbound observer : _observers)
					{
						messageClient(null, observer, OUTBOUND_MESSAGE_TYPES.RELOAD_CANVAS);
					}
					loadSimulation(requestID, simulation, visitor);
					break;
				case WAITING:
					// Do Nothing
					break;
				// user attempting to load can't do so since it's not user in
				// control
				case OBSERVING:
					simulationControlsUnavailable(visitor);
					break;
			}
		}
		// simulation not in use
		else
		{
			_simulationServerConfig.setIsSimulationLoaded(false);

			// load simulation
			_simulationInUse = loadSimulation(requestID, simulation, visitor);

			// Simulation just got someone to control it, notify everyone else
			// connected that simulation controls are unavailable.
			for(GeppettoMessageInbound connection : getConnections())
			{
				if(connection != visitor)
				{
					simulationControlsUnavailable(connection);
				}
			}
		}
	}

	/**
	 * Load simulation
	 * 
	 * @param simulation
	 *            - Simulation to load
	 * @param visitor
	 *            - Visitor doing the loading of simulation
	 * 
	 * @return {boolean} - Success or failure
	 */
	private boolean loadSimulation(String requestID, String simulation, GeppettoMessageInbound visitor)
	{

		boolean loaded = false;

		URL url = null;

		// attempt to convert simulation to URL
		try
		{
			url = new URL(simulation);
			// simulation is URL, initialize simulation services
			visitor.getSimulationService().init(url, requestID, _simulationCallbackListener);
			postLoadSimulation(requestID, visitor);
			loaded = true;
		}
		/*
		 * Unable to make url from simulation, must be simulation content. URL validity checked in GeppettoMessageInbound prior to call here
		 */
		catch(MalformedURLException e)
		{
			try
			{
				visitor.getSimulationService().init(simulation, requestID, _simulationCallbackListener);
				postLoadSimulation(requestID, visitor);
				loaded = true;
			}
			catch(GeppettoInitializationException e1)
			{
				messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION);
				loaded = false;
			}
		}
		catch(GeppettoInitializationException e)
		{
			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION);
			loaded = false;
		}

		// set user as controlling
		visitor.setVisitorRunMode(VisitorRunMode.CONTROLLING);

		return loaded;
	}

	public SimulationServerConfig getSimulationServerConfig()
	{
		return _simulationServerConfig;
	}

	/**
	 * Runs scripts that are specified in the simulation
	 * 
	 * @param requestID
	 *            - requestID received from client
	 * @param visitor
	 *            - Visitor loading the simulation
	 */
	private void postLoadSimulation(String requestID, GeppettoMessageInbound visitor)
	{

		messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED);

		JsonObject scriptsJSON = new JsonObject();

		JsonArray scriptsArray = new JsonArray();
		for(URL scriptURL : visitor.getSimulationService().getScripts())
		{
			JsonObject script = new JsonObject();
			script.addProperty("script", scriptURL.toString());

			scriptsArray.add(script);
		}
		scriptsJSON.add("scripts", scriptsArray);

		// notify client if there are scripts
		if(visitor.getSimulationService().getScripts().size() > 0)
		{
			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.FIRE_SIM_SCRIPTS, scriptsJSON.toString());
		}
	}

	/**
	 * Start the simulation
	 */
	public void startSimulation(String requestID, GeppettoMessageInbound controllingUser)
	{
		try
		{
			controllingUser.getSimulationService().start(requestID);
		}
		catch(GeppettoExecutionException e)
		{
			throw new RuntimeException(e);
		}
	}

	/**
	 * Pause the simulation
	 */
	public void pauseSimulation(String requestID, GeppettoMessageInbound controllingUser)
	{
		try
		{
			controllingUser.getSimulationService().pause();
			// notify user simulation has been paused
			messageClient(requestID, controllingUser, OUTBOUND_MESSAGE_TYPES.SIMULATION_PAUSED);
		}
		catch(GeppettoExecutionException e)
		{
			throw new RuntimeException(e);
		}
	}

	/**
	 * Stop the running simulation
	 */
	public void stopSimulation(String requestID, GeppettoMessageInbound controllingUser)
	{
		try
		{
			controllingUser.getSimulationService().stop();
			// notify user simulation has been stopped
			messageClient(requestID, controllingUser, OUTBOUND_MESSAGE_TYPES.SIMULATION_STOPPED);
		}
		catch(GeppettoExecutionException e)
		{
			throw new RuntimeException(e);
		}
	}

	/**
	 * Add visitor to list users Observing simulation
	 * 
	 * @param observingVisitor
	 *            - Geppetto visitor joining list of simulation observers
	 */
	public void observeSimulation(String requestID, GeppettoMessageInbound observingVisitor)
	{
		_observers.add(observingVisitor);

		observingVisitor.setVisitorRunMode(VisitorRunMode.OBSERVING);

		if(!observingVisitor.getSimulationService().isRunning())
		{
			messageClient(requestID, observingVisitor, OUTBOUND_MESSAGE_TYPES.LOAD_MODEL, getSimulationServerConfig().getLoadedScene());
		}
		// Notify visitor they are now in Observe Mode
		messageClient(requestID, observingVisitor, OUTBOUND_MESSAGE_TYPES.OBSERVER_MODE);
	}

	/**
	 * Adds watch lists with variables to be watched
	 * 
	 * @throws GeppettoExecutionException
	 * @throws JsonProcessingException
	 * @throws GeppettoInitializationException
	 */
	public void setWatchedVariables(String requestID, String jsonLists, GeppettoMessageInbound visitor) throws GeppettoExecutionException, GeppettoInitializationException
	{
		List<String> lists = fromJSON(new TypeReference<List<String>>()	{}, jsonLists);
		
		visitor.getSimulationService().setWatchedVariables(lists);

		// serialize watch-lists
		ObjectMapper mapper = new ObjectMapper();
		String serializedLists;
		try
		{
			serializedLists = mapper.writer().writeValueAsString(lists);
		}
		catch(JsonProcessingException e)
		{
			throw new GeppettoExecutionException(e);
		}

		// message the client the watch lists were added
		messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.SET_WATCHED_VARIABLES, serializedLists);

	}


	/**
	 * instructs simulation to clear watch lists
	 */
	public void clearWatchLists(String requestID, GeppettoMessageInbound visitor)
	{
		visitor.getSimulationService().clearWatchLists();

		// message the client the watch lists were cleared
		messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.CLEAR_WATCH);
	}

	/**
	 * is notified with an alert message of status of simulation.
	 * 
	 * @param id
	 *            - ID of new Websocket connection.
	 */
	public void simulationControlsUnavailable(GeppettoMessageInbound visitor)
	{
		messageClient(null, visitor, OUTBOUND_MESSAGE_TYPES.SERVER_UNAVAILABLE);
	}

	/**
	 * On closing a client connection (WebSocket Connection), perform check to see if user leaving was the one in control of simulation if it was running.
	 * 
	 * @param id
	 *            - WebSocket ID of user closing connection
	 */
	public void postClosingConnectionCheck(GeppettoMessageInbound exitingVisitor)
	{

		if(this._simulationServerConfig.getServerBehaviorMode() == ServerBehaviorModes.MULTIUSER)
		{

			// Controlling user is leaving, but simulation might still be
			// running.
			try
			{
				// Pause running simulation upon controlling user's exit
				exitingVisitor.getSimulationService().stop();
			}
			catch(GeppettoExecutionException e)
			{
				_logger.error("Unable to stop simulation for exiting user");
			}

			int simulatorCapacity = exitingVisitor.getSimulationService().getSimulationCapacity();

			int connectionsSize = this.getConnections().size();
			if(connectionsSize >= simulatorCapacity)
			{
				GeppettoMessageInbound nextVisitorInLine = this._queueUsers.get(0);
				messageClient(null, nextVisitorInLine, OUTBOUND_MESSAGE_TYPES.SERVER_AVAILABLE);
				this._queueUsers.remove(nextVisitorInLine);
			}
		}

		else
		{
			/*
			 * If the exiting visitor was running the simulation, notify all the observing visitors that the controls for the simulation became available
			 */
			if(exitingVisitor.getCurrentRunMode() == GeppettoMessageInbound.VisitorRunMode.CONTROLLING)
			{

				// Controlling user is leaving, but simulation might still be
				// running.
				try
				{
					if(exitingVisitor.getSimulationService().isRunning())
					{
						// Pause running simulation upon controlling user's exit
						exitingVisitor.getSimulationService().stop();
					}
				}
				catch(GeppettoExecutionException e)
				{
					_logger.error("Unable to stop simulation for exiting user");
				}

				// Notify all observers
				for(GeppettoMessageInbound visitor : _observers)
				{
					// visitor.setVisitorRunMode(VisitorRunMode.DEFAULT);
					// send message to alert client of server availability
					messageClient(null, visitor, OUTBOUND_MESSAGE_TYPES.SERVER_AVAILABLE);
				}

				_simulationInUse = false;

			}

			/*
			 * Closing connection is that of a visitor in OBSERVE mode, remove the visitor from the list of observers.
			 */
			else if(exitingVisitor.getCurrentRunMode() == GeppettoMessageInbound.VisitorRunMode.OBSERVING)
			{
				// User observing simulation is closing the connection
				if(_observers.contains(exitingVisitor))
				{
					// Remove user from observers list
					_observers.remove(exitingVisitor);
				}
				// User observing simulation is closing the connection
				if(_queueUsers.contains(exitingVisitor))
				{
					// Remove user from observers list
					_queueUsers.remove(exitingVisitor);
				}
			}
		}
	}

	/**
	 * Requests JSONUtility class for a json object with a message to send to the client
	 * 
	 * @param requestID
	 * 
	 * @param connection
	 *            - client to receive the message
	 * @param type
	 *            - type of message to be send
	 * @param string
	 */
	public void messageClient(String requestID, GeppettoMessageInbound connection, OUTBOUND_MESSAGE_TYPES type)
	{
		// get transport message to be sent to the client
		GeppettoTransportMessage transportMsg = TransportMessageFactory.getTransportMessage(requestID, type, null);
		String msg = new Gson().toJson(transportMsg);

		// Send the message to the client
		sendMessage(connection, msg);
	}

	/**
	 * Requests JSONUtility class for a json object with simulation update to be send to the client
	 * 
	 * @param connection
	 *            - client to receive the simulation update
	 * @param connection
	 *            - Type of udpate to be send
	 * @param reloadCanvas
	 *            - update to be sent
	 */
	public void messageClient(String requestID, GeppettoMessageInbound connection, OUTBOUND_MESSAGE_TYPES type, String update)
	{
		// get transport message to be sent to the client
		GeppettoTransportMessage transportMsg = TransportMessageFactory.getTransportMessage(requestID, type, update);
		String msg = new Gson().toJson(transportMsg);

		sendMessage(connection, msg);
	}

	/**
	 * Sends a message to a specific user. The id of the WebSocket connection is used to contact the desired user.
	 * 
	 * @param id
	 *            - ID of WebSocket connection that will be sent a message
	 * @param msg
	 *            - The message the user will be receiving
	 */
	public void sendMessage(GeppettoMessageInbound visitor, String msg)
	{
		try
		{
			long startTime = System.currentTimeMillis();
			CharBuffer buffer = CharBuffer.wrap(msg);
			visitor.getWsOutbound().writeTextMessage(buffer);
			String debug = ((long) System.currentTimeMillis() - startTime) + "ms were spent sending a message of " + msg.length() / 1024 + "KB to the client";
			_logger.info(debug);
		}
		catch(IOException ignore)
		{
			_logger.error("Unable to communicate with client " + ignore.getMessage());
			this.removeConnection(visitor);
		}
	}

	/**
	 * Returns status of server simulation used
	 * 
	 * @return
	 */
	public boolean isSimulationInUse()
	{
		return _simulationInUse;
	}

	public void getSimulationConfiguration(String requestID, String url, GeppettoMessageInbound visitor)
	{
		String simulationConfiguration;

		try
		{
			simulationConfiguration = visitor.getSimulationService().getSimulationConfig(new URL(url));
			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.SIMULATION_CONFIGURATION, simulationConfiguration);
		}
		catch(MalformedURLException e)
		{
			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION_CONFIG, e.getMessage());
		}
		catch(GeppettoInitializationException e)
		{
			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION_CONFIG, e.getMessage());
		}
	}

	public void getVersionNumber(String requestID, GeppettoMessageInbound visitor)
	{

		Properties prop = new Properties();

		try
		{
			prop.load(GeppettoServletController.class.getResourceAsStream("/Geppetto.properties"));
			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.GEPPETTO_VERSION, prop.getProperty("Geppetto.version"));
		}
		catch(IOException e)
		{
			_logger.error("Unable to read GEPPETTO.properties file");
		}
	}

	public void getModelTree(String requestID, String aspectInstancePath, GeppettoMessageInbound visitor)
	{
		String modelTree = visitor.getSimulationService().getModelTree(aspectInstancePath);

		// message the client with results
		this.messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.GET_MODEL_TREE, modelTree);
	}

	public void getSimulationTree(String requestID, String aspectInstancePath, GeppettoMessageInbound visitor)
	{
		String simulationTree = visitor.getSimulationService().getSimulationTree(aspectInstancePath);

		// message the client with results
		this.messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.GET_SIMULATION_TREE, simulationTree);
	}

	
	public void writeModel(String requestID, String instancePath, String format, GeppettoMessageInbound visitor)
	{
		String modelTree = visitor.getSimulationService().writeModel(instancePath, format);

		// message the client with results
		this.messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.WRITE_MODEL, modelTree);
	}

	/**
	 * Sends parsed data from script to visitor client
	 * 
	 * @param requestID
	 *            - Requested ID for process
	 * @param url
	 *            - URL of script location
	 * @param visitor
	 *            - Client doing the operation
	 */
	public void sendScriptData(String requestID, URL url, GeppettoMessageInbound visitor)
	{
		try
		{
			String line = null;
			StringBuilder sb = new StringBuilder();

			BufferedReader br = new BufferedReader(new InputStreamReader(url.openStream()));

			while((line = br.readLine()) != null)
			{
				sb.append(line + "\n");
			}
			String script = sb.toString();

			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.RUN_SCRIPT, script);
		}
		catch(IOException e)
		{
			messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.ERROR_READING_SCRIPT);
		}
	}

	public static <T> T fromJSON(final TypeReference<T> type, String jsonPacket) throws GeppettoExecutionException
	{
		T data = null;

		try
		{
			data = new ObjectMapper().readValue(jsonPacket, type);
		}
		catch(Exception e)
		{
			throw new GeppettoExecutionException("could not de-serialize json");
		}
		return data;
	}

	public void disableUser(String requestID, GeppettoMessageInbound visitor)
	{
		_connections.remove(visitor.getConnectionID());
		postClosingConnectionCheck(visitor);
	}

	public void setParameters(String requestID, String modelPath, Map<String, String> parameters,
			GeppettoMessageInbound visitor) {
		
		boolean parametersSet = visitor.getSimulationService().setParameters(modelPath,parameters);
		
		//return successful message if set parameter succeeded
		if(parametersSet){
			this.messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.SET_PARAMETERS);
		}else{
			String message = "Model Service for " + modelPath 
					+ " doesn't support SetParameters feature";
			//no parameter feature supported by this model service
			this.messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.NO_FEATURE,message);
		}
	}
}
