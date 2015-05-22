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
import java.lang.reflect.Type;
import java.net.MalformedURLException;
import java.net.URL;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoErrorCodes;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.ExperimentStatus;
import org.geppetto.core.data.model.IExperiment;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.core.model.runtime.AspectSubTreeNode;
import org.geppetto.core.model.runtime.RuntimeTreeRoot;
import org.geppetto.core.model.state.visitors.SerializeTreeVisitor;
import org.geppetto.core.services.ModelFormat;
import org.geppetto.core.simulation.IGeppettoManagerCallbackListener;
import org.geppetto.frontend.messages.OutboundMessages;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;

/**
 * Class that handles the Web Socket connections the servlet is receiving.
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author matteocantarelli
 * 
 */
public class ConnectionHandler implements IGeppettoManagerCallbackListener
{

	private static Log logger = LogFactory.getLog(ConnectionHandler.class);

	@Autowired
	private SimulationServerConfig simulationServerConfig;

	private WebsocketConnection websocketConnection;

	private IGeppettoManager geppettoManager;

	/**
	 * @param websocketConnection
	 * @param geppettoManager
	 */
	protected ConnectionHandler(WebsocketConnection websocketConnection, IGeppettoManager geppettoManager)
	{
		this.websocketConnection = websocketConnection;
		this.geppettoManager = new GeppettoManager(geppettoManager);
		this.geppettoManager.setCallback(this);
	}

	/**
	 * @param requestID
	 * @param projectId
	 */
	public void loadProjectFromId(String requestID, String projectId)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		try
		{
			IGeppettoProject geppettoProject = dataManager.getGeppettoProjectById(Long.parseLong(projectId));
			loadGeppettoProject(requestID, geppettoProject);
		}
		catch(NumberFormatException e)
		{
			websocketConnection.sendMessage(requestID, OutboundMessages.ERROR_LOADING_PROJECT, "");
		}
	}

	/**
	 * @param requestID
	 * @param projectContent
	 */
	public void loadProjectFromContent(String requestID, String projectContent)
	{
		IGeppettoProject geppettoProject = DataManagerHelper.getDataManager().getProjectFromJson(getGson(), projectContent);
		loadGeppettoProject(requestID, geppettoProject);
	}

	/**
	 * @param requestID
	 * @param urlString
	 */
	public void loadProjectFromURL(String requestID, String urlString)
	{
		URL url;
		try
		{
			url = new URL(urlString);
			BufferedReader reader = new BufferedReader(new InputStreamReader(url.openStream()));
			IGeppettoProject geppettoProject = DataManagerHelper.getDataManager().getProjectFromJson(getGson(), reader);
			loadGeppettoProject(requestID, geppettoProject);
		}
		catch(IOException e)
		{
			error(e, "Could not load geppetto project");
		}
	}

	/**
	 * @param requestID
	 * @param geppettoProject
	 */
	public void loadGeppettoProject(String requestID, IGeppettoProject geppettoProject)
	{
		try
		{
			geppettoManager.loadProject(requestID, geppettoProject);
			// serialize project prior to sending it to client
			Gson gson = new Gson();
			String json = gson.toJson(geppettoProject);
			websocketConnection.sendMessage(requestID, OutboundMessages.PROJECT_LOADED, json);

		}
		catch(MalformedURLException | GeppettoInitializationException | GeppettoExecutionException e)
		{
			error(e, "Could not load geppetto project");
		}

	}

	/**
	 * @param requestID
	 * @param experimentID
	 * @param projectId
	 */
	public void loadExperiment(String requestID, long experimentID, long projectId)
	{
		try
		{
			IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
			IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
			// run the matched experiment
			if(experiment != null)
			{
				RuntimeTreeRoot runtimeTree = geppettoManager.loadExperiment(requestID, experiment);

				SerializeTreeVisitor serializeTreeVisitor = new SerializeTreeVisitor();
				runtimeTree.apply(serializeTreeVisitor);
				String scene = serializeTreeVisitor.getSerializedTree();
				websocketConnection.sendMessage(requestID, OutboundMessages.EXPERIMENT_LOADED, scene);
				logger.info("The experiment " + experimentID + " was loaded and the runtime tree was sent to the client");
			}
			else
			{
				error(null, "Error loading experiment, the experiment " + experimentID + " was not found in project " + projectId);
			}

		}
		catch(GeppettoExecutionException e)
		{
			error(e, "Error loading experiment");
		}
	}

	/**
	 * Run the Experiment
	 */
	public void runExperiment(String requestID, long experimentID, long projectId)
	{
		try
		{
			IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
			IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
			// run the matched experiment
			if(experiment != null)
			{
				geppettoManager.runExperiment(requestID, experiment);
			}
			else
			{
				error(null, "Error running experiment, the experiment " + experimentID + " was not found in project " + projectId);
			}

		}
		catch(GeppettoExecutionException e)
		{
			error(e, "Error running experiment");
		}
	}

	/**
	 * Adds watch lists with variables to be watched
	 * 
	 * @param requestID
	 * @param jsonLists
	 * @throws GeppettoExecutionException
	 * @throws GeppettoInitializationException
	 */
	public void setWatchedVariables(String requestID, String jsonLists, long experimentID, long projectId) throws GeppettoExecutionException, GeppettoInitializationException
	{
		List<String> lists = fromJSON(new TypeReference<List<String>>()
		{
		}, jsonLists);

		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);

		geppettoManager.setWatchedVariables(lists, experiment, geppettoProject);

		// serialize watch-lists
		ObjectMapper mapper = new ObjectMapper();
		String serializedLists;
		try
		{
			serializedLists = mapper.writer().writeValueAsString(lists);

			// send to the client the watch lists were added
			websocketConnection.sendMessage(requestID, OutboundMessages.SET_WATCHED_VARIABLES, serializedLists);
		}
		catch(JsonProcessingException e)
		{
			error(e, "There was an error serializing the watched lists");
		}
	}

	/**
	 * @param requestID
	 * @param experimentID
	 * @param projectId
	 */
	public void clearWatchLists(String requestID, long experimentID, long projectId)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
		geppettoManager.clearWatchLists(experiment, geppettoProject);
		websocketConnection.sendMessage(requestID, OutboundMessages.CLEAR_WATCH, "");
	}

	/**
	 * @param requestID
	 */
	public void getVersionNumber(String requestID)
	{
		Properties prop = new Properties();
		try
		{
			prop.load(ConnectionHandler.class.getResourceAsStream("/Geppetto.properties"));
			websocketConnection.sendMessage(requestID, OutboundMessages.GEPPETTO_VERSION, prop.getProperty("Geppetto.version"));
		}
		catch(IOException e)
		{
			error(e, "Unable to read GEPPETTO.properties file");
		}
	}

	/**
	 * @param requestID
	 * @param experimentId
	 * @param projectId
	 */
	public void playExperiment(String requestID, long experimentId, long projectId)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentId, geppettoProject);

		if(experiment != null)
		{
			Map<String, AspectSubTreeNode> simulationTree;
			try
			{
				simulationTree = geppettoManager.playExperiment(requestID, experiment);

				String simulationTreeString = "[";
				for(Map.Entry<String, AspectSubTreeNode> entry : simulationTree.entrySet())
				{
					SerializeTreeVisitor updateClientVisitor = new SerializeTreeVisitor();
					entry.getValue().apply(updateClientVisitor);
					simulationTreeString += "{\"aspectInstancePath\":" + '"' + entry.getKey() + '"' + ",\"simulationTree\":{" + updateClientVisitor.getSerializedTree() + "} },";
				}
				simulationTreeString = simulationTreeString.substring(0, simulationTreeString.length() - 1);
				simulationTreeString += "]";

				websocketConnection.sendMessage(requestID, OutboundMessages.EXPERIMENT_UPDATE, simulationTreeString);
			}
			catch(GeppettoExecutionException e)
			{
				error(e, "Error playing the experiment " + experimentId);
			}
		}
		else
		{
			error(null, "Error playing experiment, the experiment " + experimentId + " was not found in project " + projectId);
		}
	}
	
	/**
	 * @param requestID
	 * @param aspectInstancePath
	 */
	public void getModelTree(String requestID, String aspectInstancePath, long experimentID, long projectId)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
		Map<String, AspectSubTreeNode> modelTree;
		try
		{
			modelTree = geppettoManager.getModelTree(aspectInstancePath, experiment, geppettoProject);

			String modelTreeString = "[";
			for(Map.Entry<String, AspectSubTreeNode> entry : modelTree.entrySet())
			{
				SerializeTreeVisitor updateClientVisitor = new SerializeTreeVisitor();
				entry.getValue().apply(updateClientVisitor);
				modelTreeString += "{\"aspectInstancePath\":" + '"' + entry.getKey() + '"' + ",\"modelTree\":{" + updateClientVisitor.getSerializedTree() + "} },";
			}
			modelTreeString = modelTreeString.substring(0, modelTreeString.length() - 1);
			modelTreeString += "]";

			websocketConnection.sendMessage(requestID, OutboundMessages.GET_MODEL_TREE, modelTreeString);
		}
		catch(GeppettoExecutionException e)
		{
			error(e, "Error populating the model tree for " + aspectInstancePath);
		}
	}

	/**
	 * @param requestID
	 * @param aspectInstancePath
	 */
	public void getSimulationTree(String requestID, String aspectInstancePath, long experimentID, long projectId)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
		Map<String, AspectSubTreeNode> simulationTree;
		try
		{
			simulationTree = geppettoManager.getSimulationTree(aspectInstancePath, experiment, geppettoProject);

			String simulationTreeString = "[";
			for(Map.Entry<String, AspectSubTreeNode> entry : simulationTree.entrySet())
			{
				SerializeTreeVisitor updateClientVisitor = new SerializeTreeVisitor();
				entry.getValue().apply(updateClientVisitor);
				simulationTreeString += "{\"aspectInstancePath\":" + '"' + entry.getKey() + '"' + ",\"simulationTree\":{" + updateClientVisitor.getSerializedTree() + "} },";
			}
			simulationTreeString = simulationTreeString.substring(0, simulationTreeString.length() - 1);
			simulationTreeString += "]";

			websocketConnection.sendMessage(requestID, OutboundMessages.GET_SIMULATION_TREE, simulationTreeString);
		}
		catch(GeppettoExecutionException e)
		{
			error(e, "Error populating the simulation tree for " + aspectInstancePath);
		}

	}

	public void downloadModel(String requestID, String aspectInstancePath, String format, long experimentID, long projectId)
	{
		System.out.println("taka");

		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
		// try
		// {
		geppettoManager.downloadModel(aspectInstancePath, ModelFormat.COLLADA, experiment, geppettoProject);

		websocketConnection.sendMessage(requestID, OutboundMessages.DOWNLOAD_MODEL, "");
		// }
		// catch(GeppettoExecutionException e)
		// {
		// error(e, "Error populating the simulation tree for " + aspectInstancePath);
		// }
	}

	/**
	 * @param requestID
	 * @param url
	 * @param visitor
	 */
	public void sendScriptData(String requestID, URL url, WebsocketConnection visitor)
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

			websocketConnection.sendMessage(requestID, OutboundMessages.RUN_SCRIPT, script);
		}
		catch(IOException e)
		{
			error(e, "Error while reading the script at " + url);
		}
	}

	public void userBecameIdle(String requestID)
	{
		ConnectionsManager.getInstance().removeConnection(websocketConnection);
		// TODO what do we do?
	}

	public void setParameters(String requestID, String modelPath, Map<String, String> parameters)
	{

		// boolean parametersSet = visitor.getSimulationService().setParameters(modelPath, parameters);
		//
		// // return successful message if set parameter succeeded
		// if(parametersSet)
		// {
		// this.messageClient(requestID, OUTBOUND_MESSAGE_TYPES.SET_PARAMETERS);
		// }
		// else
		// {
		// String message = "Model Service for " + modelPath + " doesn't support SetParameters feature";
		// // no parameter feature supported by this model service
		// this.messageClient(requestID, OUTBOUND_MESSAGE_TYPES.NO_FEATURE, message);
		// }
	}

	/**
	 * @param experimentID
	 * @param geppettoProject
	 * @return
	 */
	private IExperiment retrieveExperiment(long experimentID, IGeppettoProject geppettoProject)
	{
		IExperiment theExperiment = null;
		// Look for experiment that matches id passed
		for(IExperiment e : geppettoProject.getExperiments())
		{
			if(e.getId() == experimentID)
			{
				// The experiment is found
				theExperiment = e;
				break;
			}
		}
		return theExperiment;
	}

	/**
	 * @param projectId
	 * @return
	 */
	private IGeppettoProject retrieveGeppettoProject(long projectId)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		return dataManager.getGeppettoProjectById(projectId);
	}

	/**
	 * @param type
	 * @param jsonPacket
	 * @return
	 * @throws GeppettoExecutionException
	 */
	public <T> T fromJSON(final TypeReference<T> type, String jsonPacket) throws GeppettoExecutionException
	{
		T data = null;

		try
		{
			data = new ObjectMapper().readValue(jsonPacket, type);
		}
		catch(IOException e)
		{
			error(e, "Error deserializing the JSON document");
		}

		return data;
	}

	/**
	 * @return
	 */
	private Gson getGson()
	{
		GsonBuilder builder = new GsonBuilder();
		builder.registerTypeAdapter(Date.class, new JsonDeserializer<Date>()
		{
			@Override
			public Date deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException
			{
				return new Date(json.getAsJsonPrimitive().getAsLong());
			}
		});
		return builder.create();
	}

	/**
	 * @return
	 */
	public SimulationServerConfig getSimulationServerConfig()
	{
		return simulationServerConfig;
	}

	/**
	 * Receives update from simulation when there are new ones. From here the updates are send to the connected clients
	 * 
	 */
	@Deprecated
	@Override
	public void updateReady(GeppettoEvents event, String requestID, String sceneUpdate)
	{

		// TODO Check Is this needed at all? Why the connection handler cannot be the one implementing the CallbackListener -> Changed this
		// TODO CHeck what is the conceptual difference between GeppettoEvents and OutboundMessages?
		long start = System.currentTimeMillis();
		Date date = new Date(start);
		DateFormat formatter = new SimpleDateFormat("HH:mm:ss:SSS");
		String dateFormatted = formatter.format(date);
		logger.info("Simulation Frontend Update Starting: " + dateFormatted);

		OutboundMessages action = null;
		String update = "";

		// switch on message type
		switch(event)
		{
			case PROJECT_LOADED:
			{
				action = OutboundMessages.LOAD_PROJECT;

				sceneUpdate = sceneUpdate.substring(1, sceneUpdate.length() - 1);
				// pack sceneUpdate and variableWatchTree in the same JSON string
				update = "{" + sceneUpdate + "}";

				break;
			}
			case EXPERIMENT_RUNNING:
				action = OutboundMessages.EXPERIMENT_RUNNING;

				sceneUpdate = sceneUpdate.substring(1, sceneUpdate.length() - 1);
				update = "{ " + sceneUpdate + "}";

				break;
			case EXPERIMENT_UPDATE:
			{
				action = OutboundMessages.EXPERIMENT_UPDATE;

				sceneUpdate = sceneUpdate.substring(1, sceneUpdate.length() - 1);
				update = "{ " + sceneUpdate + "}";

				break;
			}
			case EXPERIMENT_QUEUED:
			{
				// action = OUTBOUND_MESSAGE_TYPES.;

				break;
			}
			default:
			{
			}
		}

		// Notify all connected clients about update either to load model or
		// update current one.
		websocketConnection.sendMessage(requestID, action, update);

		logger.info("Simulation Frontend Update Finished: Took:" + (System.currentTimeMillis() - start));
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulation.ISimulationCallbackListener#error(org.geppetto.core.common.GeppettoErrorCodes, java.lang.String, java.lang.String)
	 */
	@Override
	@Deprecated
	public void error(GeppettoErrorCodes errorCode, String classSource, String errorMessage, Exception e)
	{
		String jsonExceptionMsg = e == null ? "" : e.toString();
		String jsonErrorMsg = errorMessage == null ? "" : errorMessage;
		String error = "{ \"error_code\": \"" + errorCode.toString() + "\", \"source\": \"" + classSource + "\", \"message\": \"" + jsonErrorMsg + "\", \"exception\": \"" + jsonExceptionMsg + "\"}";
		logger.error(errorMessage, e);
		websocketConnection.sendMessage(null, OutboundMessages.ERROR, error);
	}

	@Deprecated
	public void message(String message)
	{
		String info = "{ \"content\": \"" + message + "\"}";
		logger.info(message);
		// Notify all connected clients about update either to load model or update current one.
		websocketConnection.sendMessage(null, OutboundMessages.INFO_MESSAGE, info);
	}

	/**
	 * @param e
	 * @param errorMessage
	 */
	private void error(Exception e, String errorMessage)
	{
		String jsonExceptionMsg = e == null ? "" : e.toString();
		String jsonErrorMsg = errorMessage == null ? "" : errorMessage;
		String error = "{ \"error_code\": \"" + GeppettoErrorCodes.GENERIC + "\", \"message\": \"" + jsonErrorMsg + "\", \"exception\": \"" + jsonExceptionMsg + "\"}";
		logger.error(errorMessage, e);
		websocketConnection.sendMessage(null, OutboundMessages.ERROR, error);
	}

	@Override
	public void updateReady(GeppettoEvents event, RuntimeTreeRoot runtimeTree)
	{
		SerializeTreeVisitor serializeTreeVisitor = new SerializeTreeVisitor();
		runtimeTree.apply(serializeTreeVisitor);

		// Notify all connected clients about update either to load model or
		// update current one.
		// TODO Check the null request id, these messages are not 1:1 responses
		websocketConnection.sendMessage(null, OutboundMessages.EXPERIMENT_UPDATE, serializeTreeVisitor.getSerializedTree());

	}

	/**
	 * @param requestID
	 * @param projectId
	 */
	public void checkExperiments(String requestID, String projectId)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		try
		{
			IGeppettoProject geppettoProject = dataManager.getGeppettoProjectById(Long.parseLong(projectId));
			if(geppettoProject != null)
			{
				List<? extends IExperiment> experiments = geppettoProject.getExperiments();
				for(IExperiment e : experiments)
				{
					if(e.getStatus() != null)
					{
						if(e.getStatus().equals(ExperimentStatus.COMPLETED))
						{
							// TODO Notify client experiment is completed
							// TODO We should notify for either every status or status changes there's nothing special
							// about COMPLETE
						}
					}
					else
					{
						String msg = "Check Experiment: Status for projct " + projectId + " is null";
						error(new GeppettoExecutionException(msg), msg);
					}
				}
			}
			else
			{
				String msg = "Check Experiment: Cannot find project " + projectId;
				error(new GeppettoExecutionException(msg), msg);
			}
		}
		catch(NumberFormatException e)
		{
			error(e, "Check Experiment: Errror parsing project id");
		}
	}
}
