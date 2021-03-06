package org.geppetto.frontend.controllers;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.apache.commons.io.FileUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.beans.PathConfiguration;
import org.geppetto.core.common.GeppettoAccessException;
import org.geppetto.core.common.GeppettoErrorCodes;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.ExperimentStatus;
import org.geppetto.core.data.model.IAspectConfiguration;
import org.geppetto.core.data.model.IExperiment;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.data.model.ResultsFormat;
import org.geppetto.core.data.model.UserPrivileges;
import org.geppetto.core.datasources.GeppettoDataSourceException;
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.core.manager.Scope;
import org.geppetto.core.model.GeppettoSerializer;
import org.geppetto.core.services.registry.ServicesRegistry;
import org.geppetto.core.simulation.IGeppettoManagerCallbackListener;
import org.geppetto.core.utilities.URLReader;
import org.geppetto.core.utilities.Zipper;
import org.geppetto.frontend.Resources;
import org.geppetto.frontend.controllers.WebsocketConnection.BatchExperiment;
import org.geppetto.frontend.controllers.WebsocketConnection.NewExperiment;
import org.geppetto.frontend.messages.OutboundMessages;
import org.geppetto.model.ExperimentState;
import org.geppetto.model.GeppettoModel;
import org.geppetto.model.ModelFormat;
import org.geppetto.model.datasources.QueryResults;
import org.geppetto.model.datasources.RunnableQuery;
import org.geppetto.model.util.GeppettoModelException;
import org.geppetto.simulation.GeppettoManagerConfiguration;
import org.geppetto.simulation.manager.GeppettoManager;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

/**
 * Class that handles the Web Socket connections the servlet is receiving. FIXME: REMOVE ALL THE MANUAL CONSTRUCTION OF JSON STRINGS, USE GSON INSTEAD
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

	// the geppetto project active for this connection
	private IGeppettoProject geppettoProject;

	/**
	 * @param websocketConnection
	 * @param geppettoManager
	 */
	protected ConnectionHandler(WebsocketConnection websocketConnection, IGeppettoManager geppettoManager,GeppettoManagerConfiguration geppettoManagerConfiguration)
	{
		this.websocketConnection = websocketConnection;
		// FIXME This is extremely ugly, a session based geppetto manager is
		// autowired in the websocketconnection
		// but a session bean cannot travel outside a conenction thread so a new
		// one is instantiated and initialised
		this.geppettoManager = new GeppettoManager(geppettoManager, geppettoManagerConfiguration);
		this.geppettoManager.setSimulationListener(this);
	}

	/**
	 * @param requestID
	 * @param projectId
	 */
	public void loadProjectFromId(String requestID, long projectId, long experimentId)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		try
		{
			IGeppettoProject geppettoProject = dataManager.getGeppettoProjectById(projectId);
			if(geppettoProject == null)
			{
				websocketConnection.sendMessage(requestID, OutboundMessages.ERROR_LOADING_PROJECT, "Project not found");
			}
			else
			{
				loadGeppettoProject(requestID, geppettoProject, experimentId);
			}
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
		loadGeppettoProject(requestID, geppettoProject, -1l);
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
			url = URLReader.getURL(urlString);
			int index = url.toString().lastIndexOf('/');
			String baseURL = url.toString().substring(0, index);
			BufferedReader reader = new BufferedReader(new InputStreamReader(url.openStream()));
			IGeppettoProject geppettoProject = DataManagerHelper.getDataManager().getProjectFromJson(getGson(), reader, baseURL);
			loadGeppettoProject(requestID, geppettoProject, -1l);
		}
		catch(IOException e)
		{
			error(e, "Could not load geppetto project from url: " + urlString );
		}
	}

	/**
	 * @param requestID
	 * @param geppettoProject
	 */
	public void loadGeppettoProject(String requestID, IGeppettoProject geppettoProject, long experimentId)
	{
		try
		{
			geppettoManager.loadProject(requestID, geppettoProject);
			boolean readOnly = true;
			if(geppettoProject.isVolatile())
			{
				readOnly = false;
			}
			else
			{
				List<? extends IGeppettoProject> userProjects = geppettoManager.getUser().getGeppettoProjects();
				for(IGeppettoProject p : userProjects)
				{
					if(p.getId() == geppettoProject.getId())
					{
						readOnly = false;
					}
				}
			}

			// serialize project prior to sending it to client
			Gson gson = new Gson();
			String projectJSON = gson.toJson(geppettoProject);
			boolean persisted = geppettoProject.isVolatile();
			String update = "{\"persisted\":" + !persisted + ",\"project\":" + projectJSON + ",\"isReadOnly\":" + readOnly + "}";

			setConnectionProject(geppettoProject);
			websocketConnection.sendMessage(requestID, OutboundMessages.PROJECT_LOADED, update);

			String geppettoModelJSON = GeppettoSerializer.serializeToJSON(((GeppettoManager) geppettoManager).getRuntimeProject(geppettoProject).getGeppettoModel(), true);
			websocketConnection.sendMessage(requestID, OutboundMessages.GEPPETTO_MODEL_LOADED, geppettoModelJSON);

			if(experimentId != -1)
			{
				loadExperiment(requestID, experimentId, geppettoProject.getId());
			}
			else if(geppettoProject.getActiveExperimentId() != -1)
			{
				loadExperiment(requestID, geppettoProject.getActiveExperimentId(), geppettoProject.getId());
			}

		}
		catch(GeppettoInitializationException | GeppettoExecutionException | GeppettoAccessException | IOException e)
		{
			error(e, "Could not load geppetto project");
		}

	}

	/**
	 * @param projectId
	 */
	public void newExperiment(String requestID, long projectId)
	{

		IGeppettoProject project = retrieveGeppettoProject(projectId);

		try
		{
			IExperiment experiment = geppettoManager.newExperiment(requestID, project);
			Gson gson = new Gson();
			String json = gson.toJson(experiment);
			websocketConnection.sendMessage(requestID, OutboundMessages.EXPERIMENT_CREATED, json);

		}
		catch(GeppettoExecutionException | GeppettoAccessException e)
		{
			error(e, "Error creating a new experiment");
		}

	}

	/**
	 * Creates new experiments in a batch
	 * 
	 * @param requestID
	 * @param projectId
	 * @param batchSize
	 *            - how many experiments we need to create
	 * @param names
	 *            - experiment names
	 */
	public void newExperimentBatch(String requestID, long projectId, BatchExperiment batchExperiment)
	{
		IGeppettoProject project = retrieveGeppettoProject(projectId);
		Gson gson = new Gson();
		List<IExperiment> experiments = new ArrayList<IExperiment>();
		try
		{
			for(NewExperiment e : batchExperiment.experiments)
			{
				IExperiment experiment = geppettoManager.newExperiment(requestID, project);
				experiment.setName(e.name);
				// set watched variables
				geppettoManager.setWatchedVariables(e.watchedVariables, experiment, project, true);
				
				// set model paramerers
				for (Map.Entry<String, String> entry : e.modelParameters.entrySet()) {
				    String key = entry.getKey();
				    String value = entry.getValue();
				    Map<String, String> modelParam = new HashMap<String, String>();
				    modelParam.put(key, value);
				    geppettoManager.setModelParameters(modelParam, experiment, project);
				}
				IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
				// set simulator parameters
				for(IAspectConfiguration aspectConfiguration : experiment.getAspectConfigurations())
				{
					if(aspectConfiguration.getInstance().equals(e.aspectPath))
					{
						aspectConfiguration.getSimulatorConfiguration().setTimestep(e.timeStep);
						aspectConfiguration.getSimulatorConfiguration().setLength(e.duration);
						aspectConfiguration.getSimulatorConfiguration().setSimulatorId(e.simulator);
						aspectConfiguration.getSimulatorConfiguration().getParameters().putAll(e.simulatorParameters);
						dataManager.saveEntity(aspectConfiguration.getSimulatorConfiguration());
					}
				}
				experiments.add(experiment);
			}

			websocketConnection.sendMessage(requestID, OutboundMessages.EXPERIMENT_BATCH_CREATED, gson.toJson(experiments));
		}
		catch(GeppettoExecutionException | GeppettoAccessException e)
		{
			error(e, "Error creating batch experiments");
		}

	}

	/**
	 * @param projectId
	 */
	public void cloneExperiment(String requestID, long projectId, long experimentID)
	{

		IGeppettoProject project = retrieveGeppettoProject(projectId);

		try
		{
			IExperiment originalExperiment = retrieveExperiment(experimentID, project);
			IExperiment cloneExperiment = geppettoManager.cloneExperiment(requestID, project, originalExperiment);

			Gson gson = new Gson();
			String json = gson.toJson(cloneExperiment);
			websocketConnection.sendMessage(requestID, OutboundMessages.EXPERIMENT_CREATED, json);

		}
		catch(GeppettoExecutionException | GeppettoAccessException e)
		{
			error(e, "Error creating a new experiment");
		}

	}

	/**
	 * @param requestID
	 * @param experimentID
	 * @param projectId
	 */
	public void loadExperiment(String requestID, long experimentID, long projectId)
	{
		long start = System.currentTimeMillis();
		websocketConnection.sendMessage(requestID, OutboundMessages.EXPERIMENT_LOADING, "");
		try
		{
			IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
			IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
			// run the matched experiment
			if(experiment != null)
			{
				ExperimentState experimentState = geppettoManager.loadExperiment(requestID, experiment);
				websocketConnection.sendMessage(requestID, OutboundMessages.EXPERIMENT_LOADED, GeppettoSerializer.serializeToJSON(experimentState));
				logger.info("The experiment " + experimentID + " was loaded and the runtime tree was sent to the client");

			}
			else
			{
				error(null, "Error loading experiment, the experiment " + experimentID + " was not found in project " + projectId);
			}

		}
		catch(GeppettoExecutionException | GeppettoAccessException e)
		{
			error(e, "Error loading experiment");
		}
		catch(IOException e)
		{
			error(e, "Error loading experiment");
		}
		logger.debug("Loading experiment took " + (System.currentTimeMillis() - start) + "ms");
	}

	/**
	 * Run the Experiment
	 */
	public void runExperiment(String requestID, long experimentID, long projectId)
	{

		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
		try
		{
			// run the matched experiment
			if(experiment != null)
			{
				// TODO: If experiment is in ERROR state, user won't be able
				// to run again.
				// We reset it to DESIGN to allow user to run it for second
				// time
				if(experiment.getStatus() == ExperimentStatus.ERROR)
				{
					experiment.setStatus(ExperimentStatus.DESIGN);
				}
				geppettoManager.runExperiment(requestID, experiment);
			}
			else
			{
				error(null, "Error running experiment, the experiment " + experimentID + " was not found in project " + projectId);
			}

		}
		catch(GeppettoExecutionException | GeppettoAccessException e)
		{
			error(e, "Error running experiment");
		}
	}

	/**
	 * @param requestID
	 * @param projectId
	 * @param experimentId
	 * @param dataSourceId
	 * @param variableId
	 */
	public void fetchVariable(String requestID, Long projectId, String dataSourceId, String[] variableId)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		try
		{
			GeppettoModel geppettoModel = geppettoManager.fetchVariable(dataSourceId, variableId, geppettoProject);

			String serializedModel = GeppettoSerializer.serializeToJSON(geppettoModel, true);

			websocketConnection.sendMessage(requestID, OutboundMessages.VARIABLE_FETCHED, serializedModel);
		}
		catch(GeppettoDataSourceException e)
		{
			error(e, "Error fetching variable " + variableId);
		}
		catch(IOException e)
		{
			error(e, "Error fetching variable " + variableId);
		}
		catch(GeppettoModelException e)
		{
			error(e, "Error fetching variable " + variableId);
		}
		catch(GeppettoExecutionException e)
		{
			error(e, "Error fetching variable " + variableId);
		}

	}

	/**
	 * @param requestID
	 * @param projectId
	 * @param experimentId
	 * @param dataSourceServiceId
	 * @param variableId
	 * @throws GeppettoExecutionException
	 */
	public void resolveImportType(String requestID, Long projectId, List<String> typePaths)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		try
		{
			GeppettoModel geppettoModel = geppettoManager.resolveImportType(typePaths, geppettoProject);
			websocketConnection.sendMessage(requestID, OutboundMessages.IMPORT_TYPE_RESOLVED, GeppettoSerializer.serializeToJSON(geppettoModel, true));
		}
		catch(IOException e)
		{
			error(e, "Error importing type " + typePaths);
		}
		catch(GeppettoExecutionException e)
		{
			error(e, "Error importing type " + typePaths);
		}

	}

	/**
	 * @param requestID
	 * @param projectId
	 * @param runnableQueryParameters
	 */
	public void runQuery(String requestID, Long projectId, List<RunnableQuery> runnableQueries)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		QueryResults results;
		try
		{
			results = geppettoManager.runQuery(runnableQueries, geppettoProject);
			websocketConnection.sendMessage(requestID, OutboundMessages.RETURN_QUERY_RESULTS, GeppettoSerializer.serializeToJSON(results, true));
		}
		catch(GeppettoDataSourceException | GeppettoModelException | GeppettoExecutionException | IOException e)
		{
			error(e, "Error running query");
		}

	}

	/**
	 * @param requestID
	 * @param projectId
	 * @param runnableQueries
	 */
	public void runQueryCount(String requestID, Long projectId, List<RunnableQuery> runnableQueries)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		int count;
		try
		{
			count = geppettoManager.runQueryCount(runnableQueries, geppettoProject);
			websocketConnection.sendMessage(requestID, OutboundMessages.RETURN_QUERY_COUNT, Integer.toString(count));
		}
		catch(GeppettoDataSourceException | GeppettoModelException | GeppettoExecutionException e)
		{
			error(e, "Error running query count");
		}
	}

	/**
	 * @param requestID
	 * @param projectId
	 * @param experimentId
	 * @param path
	 */
	public void resolveImportValue(String requestID, Long projectId, Long experimentId, String path)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentId, geppettoProject);
		try
		{
			GeppettoModel geppettoModel = geppettoManager.resolveImportValue(path, experiment, geppettoProject);
			websocketConnection.sendMessage(requestID, OutboundMessages.IMPORT_VALUE_RESOLVED, GeppettoSerializer.serializeToJSON(geppettoModel, true));
		}
		catch(IOException e)
		{
			error(e, "Error importing value " + path);
		} catch (GeppettoExecutionException e) {
			error(e, "Error importing value " + path);	
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
	public void setWatchedVariables(String requestID, List<String> variables, long experimentID, long projectId, boolean watch) throws GeppettoExecutionException, GeppettoInitializationException
	{

		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);

		if(geppettoProject.isVolatile())
		{
			info(requestID, Resources.VOLATILE_PROJECT.toString());
			return;
		}
		else
		{
			try
			{
				geppettoManager.setWatchedVariables(variables, experiment, geppettoProject, watch);
			}
			catch(GeppettoExecutionException | GeppettoAccessException e)
			{
				error(e, "Error setting watched variables");
			}

			// serialize watch-lists
			ObjectMapper mapper = new ObjectMapper();
			String serializedLists;

			try
			{
				serializedLists = mapper.writer().writeValueAsString(variables);

				// send to the client the watch lists were added
				websocketConnection.sendMessage(requestID, OutboundMessages.WATCHED_VARIABLES_SET, serializedLists);
			}
			catch(JsonProcessingException e)
			{
				error(e, "There was an error serializing the watched lists");
			}
		}

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
	 * @param variables
	 */
	public void getExperimentState(String requestID, long experimentId, long projectId, List<String> variables)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentId, geppettoProject);

		if(experiment != null)
		{
			try
			{
				ExperimentState experimentState = geppettoManager.getExperimentState(requestID, experiment, variables);
				websocketConnection.sendMessage(requestID, OutboundMessages.GET_EXPERIMENT_STATE, GeppettoSerializer.serializeToJSON(experimentState));
			}
			catch(GeppettoExecutionException | GeppettoAccessException e)
			{
				error(e, "Error playing the experiment " + experimentId);
			}
			catch(IOException e)
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
	 * @param format
	 * 
	 */
	public void downloadModel(String requestID, String aspectInstancePath, String format, long experimentID, long projectId)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);

		ModelFormat modelFormat = ServicesRegistry.getModelFormat(format);
		try
		{

			if(modelFormat == null && format != null)
			{
				// FIXME There is a method called ERROR for sending errors to
				// the GUI, also the error code and the outbound message are
				// different
				// things, there's no need to have a separate message for each
				// error
				websocketConnection.sendMessage(requestID, OutboundMessages.ERROR_DOWNLOADING_MODEL, "");
			}
			else
			{
				// Convert model
				File file = geppettoManager.downloadModel(aspectInstancePath, modelFormat, experiment, geppettoProject);

				// Zip folder
				Zipper zipper = new Zipper(PathConfiguration.createExperimentTmpPath(Scope.CONNECTION, projectId, experimentID, aspectInstancePath, file.getName() + ".zip"));
				Path path = zipper.getZipFromDirectory(file);

				// Send zip file to the client
				websocketConnection.sendBinaryMessage(requestID, path);
				websocketConnection.sendMessage(requestID, OutboundMessages.DOWNLOAD_MODEL, "");
			}
		}
		catch(GeppettoExecutionException | IOException | GeppettoAccessException e)
		{
			error(e, "Error downloading model for " + aspectInstancePath + " in format " + format);
		}
	}

	/**
	 * @param requestID
	 * @param aspectInstancePath
	 * 
	 */
	public void getSupportedOuputs(String requestID, String aspectInstancePath, long experimentID, long projectId)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
		try
		{
			List<ModelFormat> supportedOutputs = geppettoManager.getSupportedOuputs(aspectInstancePath, experiment, geppettoProject);

			String supportedOutputsString = "[";
			for(ModelFormat supportedOutput : supportedOutputs)
			{
				supportedOutputsString += "\"" + supportedOutput.getModelFormat() + "\",";
			}
			supportedOutputsString = supportedOutputsString.substring(0, supportedOutputsString.length() - 1);
			supportedOutputsString += "]";

			websocketConnection.sendMessage(requestID, OutboundMessages.GET_SUPPORTED_OUTPUTS, supportedOutputsString);
		}
		catch(GeppettoExecutionException | GeppettoAccessException e)
		{
			error(e, "Error getting supported outputs for " + aspectInstancePath);
		}
	}

	/**
	 * @param requestID
	 * @param projectId 
	 * @param urlString
	 * @param visitor
	 */
	public void sendScriptData(String requestID, Long projectId, String urlString, WebsocketConnection visitor)
	{
		try
		{
			String line = null;
			StringBuilder sb = new StringBuilder();

			IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
			URL url = URLReader.getURL(urlString,geppettoProject.getBaseURL());

			BufferedReader br = new BufferedReader(new InputStreamReader(url.openStream()));

			while((line = br.readLine()) != null)
			{
				sb.append(line + "\n");
			}
			String script = sb.toString();

			websocketConnection.sendMessage(requestID, OutboundMessages.SCRIPT_FETCHED, script);
		}
		catch(IOException e)
		{
			error(e, "Error while reading the script at " + urlString);
		}
	}

	/**
	 * @param requestID
	 * @param url
	 * @param visitor
	 */
	public void sendDataSourceResults(String requestID, String dataSourceName, URL url, WebsocketConnection visitor)
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

			JsonObject obj = new JsonObject();
			obj.addProperty("data_source_name", dataSourceName);
			obj.addProperty("results", script);

			String message = obj.toString();

			websocketConnection.sendMessage(requestID, OutboundMessages.DATASOURCE_RESULTS_FETCHED, message);
		}
		catch(IOException e)
		{
			error(e, "Error while reading the script at " + url);
		}
	}

	/**
	 * @param requestID
	 * @param modelPath
	 * @param modelParameters
	 * @param projectId
	 * @param experimentID
	 */
	public void setParameters(String requestID, Map<String, String> modelParameters, long projectId, long experimentID)
	{

		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
		if(geppettoProject.isVolatile())
		{
			info(requestID, Resources.VOLATILE_PROJECT.toString());
			return;
		}
		else
		{
			try
			{
				ExperimentState experimentState = geppettoManager.setModelParameters(modelParameters, experiment, geppettoProject);
				websocketConnection.sendMessage(requestID, OutboundMessages.UPDATE_MODEL_TREE, GeppettoSerializer.serializeToJSON(experimentState));
			}
			catch(GeppettoExecutionException | GeppettoAccessException | IOException e)
			{
				error(e, "There was an error setting parameters");
			}
		}
	}

	/**
	 * @param requestID
	 * @param view
	 * @param projectId
	 * @param experimentID
	 */
	public void setExperimentView(String requestID, String view, long projectId, long experimentID)
	{

		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentID, geppettoProject);
		try
		{
			geppettoManager.setExperimentView(view, experiment, geppettoProject);
		}
		catch(GeppettoExecutionException | GeppettoAccessException e)
		{
			error(e, "There was an error setting experiment view");
		}
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
			public Date deserialize(JsonElement json, java.lang.reflect.Type typeOfT, JsonDeserializationContext context) throws JsonParseException
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
	 * @param exception
	 * @param errorMessage
	 */
	private void error(Exception exception, String errorMessage)
	{
		String exceptionMessage = "";
		if(exception != null)
		{
			exceptionMessage = exception.getCause() == null ? exception.getMessage() : exception.toString();
		}
		Error error = new Error(GeppettoErrorCodes.EXCEPTION, errorMessage, exceptionMessage, 0);
		logger.error(errorMessage, exception);
		websocketConnection.sendMessage(null, OutboundMessages.ERROR, getGson().toJson(error));

	}

	/**
	 * @param requestID
	 * @param exception
	 * @param errorMessage
	 */
	private void info(String requestID, String message)
	{
		logger.info(message);
		websocketConnection.sendMessage(requestID, OutboundMessages.INFO_MESSAGE, getGson().toJson(message));

	}

	private class Error
	{
		public Error(GeppettoErrorCodes errorCode, String errorMessage, String jsonExceptionMsg, long id)
		{
			this.error_code = errorCode.toString();
			message = errorMessage;
			exception = jsonExceptionMsg;
			this.id = id;
		}

		String error_code;
		String message;
		String exception;
		long id;
	}

	/**
	 * @param requestID
	 * @param projectId
	 */
	public void checkExperimentStatus(String requestID, String projectId)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		try
		{
			IGeppettoProject geppettoProject = dataManager.getGeppettoProjectById(Long.parseLong(projectId));
			if(geppettoProject != null)
			{
				List<? extends IExperiment> experiments = geppettoManager.checkExperimentsStatus(requestID, geppettoProject);
				String status = "[";
				for(IExperiment e : experiments)
				{
					// FIXME
					status += "{\"projectID\":" + '"' + projectId + '"' + ",\"experimentID\":" + '"' + e.getId() + '"' + ",\"status\":" + '"' + e.getStatus().toString() + '"' + "},";

				}
				status = status.substring(0, status.length() - 1);
				status += "]";
				websocketConnection.sendMessage(requestID, OutboundMessages.EXPERIMENT_STATUS, status);
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

	/**
	 * @param requestID
	 * @param experimentId
	 * @param projectId
	 */
	public void deleteExperiment(String requestID, long experimentId, long projectId)
	{

		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentId, geppettoProject);

		if(experiment != null)
		{
			try
			{
				geppettoManager.deleteExperiment(requestID, experiment);
				String update = "{\"id\":" + '"' + experiment.getId() + '"' + ",\"name\":" + '"' + experiment.getName() + '"' + "}";
				websocketConnection.sendMessage(requestID, OutboundMessages.DELETE_EXPERIMENT, update);
			}
			catch(GeppettoExecutionException | GeppettoAccessException e)
			{
				error(e, "Error while deleting the experiment");
			}
		}
		else
		{
			error(null, "Error deleting experiment, the experiment " + experimentId + " was not found in project " + projectId);
		}

	}

	/**
	 * @param requestID
	 * @param projectId
	 */
	public void makeProjectPublic(String requestID, long projectId, boolean isPublic)
	{

		try
		{
			IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);

			if(geppettoProject != null)
			{

				geppettoManager.makeProjectPublic(requestID, geppettoProject, isPublic);
				String update = "{\"id\":" + '"' + geppettoProject.getId() + '"' + ",\"isPublic\":" + geppettoProject.isPublic() + "}";
				websocketConnection.sendMessage(requestID, OutboundMessages.PROJECT_MADE_PUBLIC, update);
			}
			else
			{
				error(null, "Error making project  public " + projectId + ".");
			}
		}
		catch(GeppettoExecutionException | GeppettoAccessException e)
		{
			error(e, "Error making project public");
		}

	}

	/**
	 * @param requestID
	 * @param projectId
	 */
	public void persistProject(String requestID, long projectId)
	{

		try
		{
			IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);

			if(geppettoProject != null)
			{

				geppettoManager.persistProject(requestID, geppettoProject);
				PersistedProject persistedProject = new PersistedProject(geppettoProject.getId(), geppettoProject.getActiveExperimentId());
				websocketConnection.sendMessage(requestID, OutboundMessages.PROJECT_PERSISTED, getGson().toJson(persistedProject));
			}
			else
			{
				error(null, "Error persisting project  " + projectId + ".");
			}
		}
		catch(GeppettoExecutionException | GeppettoAccessException e)
		{
			error(e, "Error persisting project");
		}

	}

	class PersistedProject
	{
		long projectID;
		long activeExperimentID;

		public PersistedProject(long projectID, long activeExperimentID)
		{
			super();
			this.projectID = projectID;
			this.activeExperimentID = activeExperimentID;
		}

	}

    public void getDropboxToken(String requestID) {
        try {
            websocketConnection.sendMessage(requestID, OutboundMessages.GET_DROPBOX_TOKEN, geppettoManager.getDropboxToken());
        }
        catch (Exception e)
            {
                error(e, "Unable to get dropbox token.");
            }
    }

	/**
	 * @param requestID
	 * @param key
	 */
	public void linkDropBox(String requestID, String key)
	{
		try
		{
			geppettoManager.linkDropBoxAccount(key);
			websocketConnection.sendMessage(requestID, OutboundMessages.DROPBOX_LINKED, null);
		}
		catch(Exception e)
		{
			error(e, "Unable to link dropbox account.");
		}
	}

	/**
	 * @param requestID
	 * @param key
	 */
	public void unLinkDropBox(String requestID, String key)
	{
		try
		{
			geppettoManager.unlinkDropBoxAccount(key);
			websocketConnection.sendMessage(null, OutboundMessages.DROPBOX_UNLINKED, null);
		}
		catch(Exception e)
		{
			error(e, "Unable to unlink dropbox account.");
		}
	}

	/**
	 * @param aspectPath
	 * @param projectId
	 * @param experimentId
	 * @param format
	 */
	public void uploadModel(String aspectPath, long projectId, long experimentId, String format)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentId, geppettoProject);
		ModelFormat modelFormat = ServicesRegistry.getModelFormat(format);
		try
		{
			geppettoManager.uploadModelToDropBox(aspectPath, experiment, geppettoProject, modelFormat);
			websocketConnection.sendMessage(null, OutboundMessages.MODEL_UPLOADED, null);
		}
		catch(Exception e)
		{
			error(e, "Unable to upload results for aspect : " + aspectPath);
		}
	}

	/**
	 * @param aspectPath
	 * @param projectId
	 * @param experimentId
	 * @param format
	 */
	public void uploadResults(String aspectPath, long projectId, long experimentId, String format)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentId, geppettoProject);
		ResultsFormat resultsFormat = ServicesRegistry.getResultsFormat(format);
		try
		{
			geppettoManager.uploadResultsToDropBox(aspectPath, experiment, geppettoProject, resultsFormat);
			websocketConnection.sendMessage(null, OutboundMessages.RESULTS_UPLOADED, null);
		}
		catch(GeppettoExecutionException | GeppettoAccessException e)
		{
			error(e, "Unable to upload results for aspect : " + aspectPath);
		}
	}

	/**
	 * @param requestID
	 * @param aspectPath
	 * @param projectId
	 * @param experimentId
	 * @param format
	 */
	public void downloadResults(String requestID, String aspectPath, long projectId, long experimentId, String format)
	{
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentId, geppettoProject);
		ResultsFormat resultsFormat = ServicesRegistry.getResultsFormat(format);
		try
		{
			if(resultsFormat == null)
			{
				websocketConnection.sendMessage(requestID, OutboundMessages.ERROR_DOWNLOADING_RESULTS, "");
			}
			else
			{
				// Convert model
				URL url = geppettoManager.downloadResults(aspectPath, resultsFormat, experiment, geppettoProject);

				if(url != null)
				{
					// Zip folder
					Zipper zipper = new Zipper(PathConfiguration.createExperimentTmpPath(Scope.CONNECTION, projectId, experimentId, aspectPath, URLReader.getFileName(url)));
					Path path = zipper.getZipFromFile(url);

					// Send zip file to the client
					websocketConnection.sendBinaryMessage(requestID, path);
					websocketConnection.sendMessage(requestID, OutboundMessages.DOWNLOAD_RESULTS, "");
				}
				else
				{
					error(new GeppettoExecutionException("Results of type " + format + " not found in the current experiment"), "Error downloading results for " + aspectPath + " in format " + format);
				}
			}
		}
		catch(GeppettoExecutionException | IOException | GeppettoAccessException e)
		{
			error(e, "Error downloading results for " + aspectPath + " in format " + format);
		}
	}

	/**
	 * @param requestID
	 * @param projectId
	 * @param properties
	 */
	public void saveProjectProperties(String requestID, long projectId, Map<String, String> properties)
	{
		if(DataManagerHelper.getDataManager().isDefault())
		{
			info(requestID, Resources.UNSUPPORTED_OPERATION.toString());
		}
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		if(geppettoProject.isVolatile())
		{
			info(requestID, Resources.VOLATILE_PROJECT.toString());
			return;
		}
		else
		{
			IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
			if(properties != null)
			{
				for(String p : properties.keySet())
				{
					switch(p)
					{
						case "name":
						{
							geppettoProject.setName(properties.get(p));
							break;
						}
					}
				}
			}
			dataManager.saveEntity(geppettoProject);
			websocketConnection.sendMessage(requestID, OutboundMessages.PROJECT_PROPS_SAVED, "");
		}
	}

	/**
	 * @param requestID
	 * @param projectId
	 * @param experimentId
	 * @param properties
	 */
	public void saveExperimentProperties(String requestID, long projectId, long experimentId, Map<String, String> properties)
	{
		if(DataManagerHelper.getDataManager().isDefault())
		{
			info(requestID, Resources.UNSUPPORTED_OPERATION.toString());
		}
		IGeppettoProject geppettoProject = retrieveGeppettoProject(projectId);
		IExperiment experiment = retrieveExperiment(experimentId, geppettoProject);
		if(geppettoProject.isVolatile())
		{
			info(requestID, Resources.VOLATILE_PROJECT.toString());
			return;
		}
		else
		{
			IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
			for(String p : properties.keySet())
			{
				switch(p)
				{
					case "name":
					{
						experiment.setName(properties.get(p));
						dataManager.saveEntity(experiment);
						break;
					}
					case "description":
					{
						experiment.setDescription(properties.get(p));
						dataManager.saveEntity(experiment);
						break;
					}
					case "script":
					{
						experiment.setScript(properties.get(p));
						dataManager.saveEntity(experiment);
						break;
					}
					case "timeStep":
					{
						String aspectPath = properties.get("aspectInstancePath");
						for(IAspectConfiguration aspectConfiguration : experiment.getAspectConfigurations())
						{
							if(aspectConfiguration.getInstance().equals(aspectPath))
							{
								aspectConfiguration.getSimulatorConfiguration().setTimestep(Float.parseFloat(properties.get(p)));
								dataManager.saveEntity(aspectConfiguration.getSimulatorConfiguration());
								break;
							}
						}
						break;
					}
					case "length":
					{
						String aspectPath = properties.get("aspectInstancePath");
						for(IAspectConfiguration aspectConfiguration : experiment.getAspectConfigurations())
						{
							if(aspectConfiguration.getInstance().equals(aspectPath))
							{
								aspectConfiguration.getSimulatorConfiguration().setLength(Float.parseFloat(properties.get(p)));
								dataManager.saveEntity(aspectConfiguration.getSimulatorConfiguration());
								break;
							}
						}
						break;
					}
					case "simulatorId":
					{
						String aspectPath = properties.get("aspectInstancePath");
						for(IAspectConfiguration aspectConfiguration : experiment.getAspectConfigurations())
						{
							if(aspectConfiguration.getInstance().equals(aspectPath))
							{
								aspectConfiguration.getSimulatorConfiguration().setSimulatorId(properties.get(p));
								dataManager.saveEntity(aspectConfiguration.getSimulatorConfiguration());
								break;
							}
						}
						break;
					}
					case "conversionServiceId":
					{
						String aspectPath = properties.get("aspectInstancePath");
						for(IAspectConfiguration aspectConfiguration : experiment.getAspectConfigurations())
						{
							if(aspectConfiguration.getInstance().equals(aspectPath))
							{
								aspectConfiguration.getSimulatorConfiguration().setConversionServiceId(properties.get(p));
								dataManager.saveEntity(aspectConfiguration.getSimulatorConfiguration());
								break;
							}
						}
						break;
					}
					case "aspectInstancePath":
					{
						break;
					}
					default:
					{
						if(p.startsWith("SP$"))
						{
							// This is a simulator parameter
							String aspectPath = properties.get("aspectInstancePath");
							for(IAspectConfiguration aspectConfiguration : experiment.getAspectConfigurations())
							{
								if(aspectConfiguration.getInstance().equals(aspectPath))
								{

									Map<String, String> parameters = aspectConfiguration.getSimulatorConfiguration().getParameters();
									if(parameters == null)
									{
										parameters = new HashMap<String, String>();
										aspectConfiguration.getSimulatorConfiguration().setParameters(parameters);
									}
									parameters.put(p.substring(p.indexOf("$") + 1), properties.get(p));
									dataManager.saveEntity(aspectConfiguration.getSimulatorConfiguration());
									break;
								}
							}
							break;
						}
						else
						{
							String msg = "Cannot find parameter " + p + " in the experiment";
							error(new GeppettoExecutionException(msg), msg);
						}
					}
				}
			}
			// send back id of experiment saved, and if the experiment modified
			// was in ERROR state change
			// it back to DESIGN to allow re-running
			ExperimentStatus status = experiment.getStatus();
			if(status == ExperimentStatus.ERROR)
			{
				experiment.setStatus(ExperimentStatus.DESIGN);
			}
			String update = "{\"id\":" + '"' + experiment.getId() + '"' + ",\"status\":" + '"' + experiment.getStatus() + '"' + "}";
			websocketConnection.sendMessage(requestID, OutboundMessages.EXPERIMENT_PROPS_SAVED, update);
		}
	}

	/**
	 * 
	 */
	public void closeProject()
	{
		try
		{
			geppettoManager.closeProject(null, geppettoProject);
		}
		catch(GeppettoExecutionException e)
		{
			logger.error("Error while closing the project", e);
		}

		ConnectionsManager.getInstance().removeConnection(websocketConnection);

	}

	/**
	 * @param geppettoProject
	 * @throws GeppettoExecutionException
	 */
	public void setConnectionProject(IGeppettoProject geppettoProject) throws GeppettoExecutionException
	{
		if(this.geppettoProject != null)
		{
			geppettoManager.closeProject(null, this.geppettoProject);
		}
		this.geppettoProject = geppettoProject;
	}

	/**
	 * Sends to the client login user privileges
	 * 
	 * @param requestID
	 */
	public void checkUserPrivileges(String requestID)
	{
		boolean hasPersistence = false;
		try
		{
			hasPersistence = !AuthServiceCreator.getService().isDefault();
		}
		catch(GeppettoInitializationException e)
		{
			error(e, "Unable to determine whether persistence services are available or not");
		}

		UserPrivilegesDT userPrivileges = new UserPrivilegesDT();
		if(this.geppettoManager.getUser() != null)
		{
			userPrivileges.userName = this.geppettoManager.getUser().getLogin();
		}
		userPrivileges.hasPersistence = hasPersistence;
		userPrivileges.loggedIn = this.geppettoManager.getUser() != null;

		if(this.geppettoManager.getUser() != null)
		{
			List<UserPrivileges> privileges = this.geppettoManager.getUser().getUserGroup().getPrivileges();
			for(UserPrivileges up : privileges)
			{
				userPrivileges.privileges.add(up.toString());
			}
		}
		websocketConnection.sendMessage(requestID, OutboundMessages.USER_PRIVILEGES, getGson().toJson(userPrivileges));
	}

	private class UserPrivilegesDT
	{
		public String userName = "";
		public boolean loggedIn = false;
		public boolean hasPersistence = false;
		public List<String> privileges = new ArrayList<String>();
	}

	@Override
	public void experimentError(String titleMessage, String logMessage, Exception exception, IExperiment experiment)
	{
		Error error = new Error(GeppettoErrorCodes.EXCEPTION, titleMessage, logMessage, experiment.getId());
		logger.error(logMessage, exception);

		String jsonError = this.getGson().toJson(error);

		if(!geppettoProject.isVolatile())
		{
			IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
			// stores only first 2000 characters of error message
			if(jsonError.length() < 10000)
			{
				experiment.setDetails(jsonError);
				dataManager.saveEntity(experiment);
			}
		}

		websocketConnection.sendMessage(null, OutboundMessages.ERROR_RUNNING_EXPERIMENT, jsonError);
	}

	public void downloadProject(String requestID, long projectId)
	{
		try
		{

			Path zipPath = this.geppettoManager.downloadProject(geppettoProject);

			if(zipPath != null)
			{
				// Send zip file to the client
				websocketConnection.sendBinaryMessage(requestID, zipPath);
				websocketConnection.sendMessage(requestID, OutboundMessages.DOWNLOAD_PROJECT, null);

				// clean temporary directory where files where written
				FileUtils.cleanDirectory(zipPath.toFile().getParentFile());
			}
			else
			{
				error(null, "Error downloading project");
			}
		}
		catch(Exception e)
		{
			error(e, "Error downloading project");
		}
	}
}
