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

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.beans.PathConfiguration;
import org.geppetto.core.common.GeppettoAccessException;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.model.ExperimentStatus;
import org.geppetto.core.data.model.IExperiment;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.data.model.IPersistedData;
import org.geppetto.core.data.model.ISimulationResult;
import org.geppetto.core.data.model.IUser;
import org.geppetto.core.data.model.ResultsFormat;
import org.geppetto.core.data.model.UserPrivileges;
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.core.manager.Scope;
import org.geppetto.core.model.runtime.AspectSubTreeNode;
import org.geppetto.core.model.runtime.RuntimeTreeRoot;
import org.geppetto.core.s3.S3Manager;
import org.geppetto.core.services.DropboxUploadService;
import org.geppetto.core.services.ModelFormat;
import org.geppetto.core.utilities.URLReader;
import org.geppetto.core.utilities.Zipper;
import org.geppetto.simulation.RuntimeProject;
import org.springframework.stereotype.Component;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

/**
 * GeppettoManager is the implementation of IGeppettoManager which represents the Java API entry point for Geppetto. This class is instantiated with a session scope, which means there is one
 * GeppettoManager per each session/connection therefore only one user is associated with a GeppettoManager. A GeppettoManager is also instantiated by the ExperimentRunManager to handle the queued
 * activities in the database.
 * 
 * @author dandromereschi
 * @author matteocantarelli
 * 
 */
@Component
public class GeppettoManager implements IGeppettoManager
{

	private static Log logger = LogFactory.getLog(GeppettoManager.class);

	// these are the runtime projects for a
	private Map<IGeppettoProject, RuntimeProject> projects = new LinkedHashMap<>();

	private DropboxUploadService dropboxService = new DropboxUploadService();

	private IUser user;

	// By default
	private Scope scope = Scope.CONNECTION;

	public GeppettoManager()
	{
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
		logger.info("New Geppetto Manager class");
	}

	public GeppettoManager(IGeppettoManager manager)
	{
		super();
		if(manager instanceof GeppettoManager)
		{
			GeppettoManager other = (GeppettoManager) manager;
			this.projects.putAll(other.projects);
			this.user = other.getUser();
		}
	}

	public GeppettoManager(Scope scope)
	{
		super();
		this.scope = scope;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IProjectManager#loadProject(java.lang.String, org.geppetto.core.data.model.IGeppettoProject)
	 */
	public void loadProject(String requestId, IGeppettoProject project) throws MalformedURLException, GeppettoInitializationException, GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.READ_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to load project.");
		}
		
		// RuntimeProject is created and populated when loadProject is called
		if(!projects.containsKey(project))
		{
			RuntimeProject runtimeProject = new RuntimeProject(project, this);
			projects.put(project, runtimeProject);
		}
		else
		{
			throw new GeppettoExecutionException("Cannot load two instances of the same project");
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IProjectManager#closeProject(java.lang.String, org.geppetto.core.data.model.IGeppettoProject)
	 */
	public void closeProject(String requestId, IGeppettoProject project) throws GeppettoExecutionException
	{
		if(!projects.containsKey(project) && projects.get(project) == null)
		{
			throw new GeppettoExecutionException("A project without a runtime project cannot be closed");
		}
		try
		{
			PathConfiguration.deleteProjectTmpFolder(getScope(), project.getId());
		}
		catch(IOException e)
		{
			throw new GeppettoExecutionException(e);
		}
		projects.get(project).release();
		projects.remove(project);
	}

	/**
	 * @param project
	 * @return
	 * @throws GeppettoExecutionException
	 */
	public RuntimeProject getRuntimeProject(IGeppettoProject project) throws GeppettoExecutionException
	{
		if(!projects.containsKey(project))
		{
			throw new GeppettoExecutionException("The project with ID:" + project.getId() + " and Name:" + project.getName() + "is not loaded");
		}
		return projects.get(project);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IExperimentManager#loadExperiment(java.lang.String, org.geppetto.core.data.model.IExperiment, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public RuntimeTreeRoot loadExperiment(String requestId, IExperiment experiment) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.READ_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to load experiment.");
		}
		
		IGeppettoProject project = experiment.getParentProject();
		try
		{
			if(!projects.containsKey(project) || projects.get(project) == null)
			{
				throw new GeppettoExecutionException("Cannot load an experiment for a project that was not loaded");
			}
			getRuntimeProject(project).openExperiment(requestId, experiment);
		}
		catch(MalformedURLException | GeppettoInitializationException e)
		{
			throw new GeppettoExecutionException(e);
		}

		getRuntimeProject(project).setActiveExperiment(experiment);
		return getRuntimeProject(project).getRuntimeExperiment(experiment).getRuntimeTree();

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IExperimentManager#runExperiment(java.lang.String, org.geppetto.core.data.model.IExperiment, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public void runExperiment(String requestId, IExperiment experiment) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.RUN_EXPERIMENT)){
			throw new GeppettoAccessException("Insufficient access rights to run experiment.");
		}
		
		if(experiment.getStatus().equals(ExperimentStatus.DESIGN))
		{
			ExperimentRunManager.getInstance().queueExperiment(user, experiment);
		}
		else
		{
			throw new GeppettoExecutionException("Cannot run an experiment whose status is not design");
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IExperimentManager#playExperiment(java.lang.String, org.geppetto.core.data.model.IExperiment)
	 */
	@Override
	public Map<String, AspectSubTreeNode> playExperiment(String requestId, IExperiment experiment) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.READ_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to play experiment.");
		}
		
		if(experiment.getStatus().equals(ExperimentStatus.COMPLETED))
		{
			return getRuntimeProject(experiment.getParentProject()).getRuntimeExperiment(experiment).updateRuntimeTreesWithResults();
		}
		else
		{
			throw new GeppettoExecutionException("Cannot play an experiment whose status is not completed");
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IProjectManager#deleteProject(java.lang.String, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public void deleteProject(long projectID) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.WRITE_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to delete project.");
		}
		
		DataManagerHelper.getDataManager().deleteGeppettoProject(projectID, user);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IProjectManager#persistProject(java.lang.String, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public void persistProject(String requestId, IGeppettoProject project) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.WRITE_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to persist project.");
		}
		
		try
		{
			if(project.isVolatile())
			{
				if(getRuntimeProject(project).getActiveExperiment() != null)
				{
					// the project will have a new id after saving it therefore we update the hashmap as the hashcode will be different
					// since it's id based
					DataManagerHelper.getDataManager().addGeppettoProject(project, getUser());

					// save Geppetto Model
					URL url = new URL(project.getGeppettoModel().getUrl());
					Path localGeppettoModelFile = Paths.get(URLReader.createLocalCopy(scope, project.getId(), url).toURI());

					// save each model inside GeppettoModel and save every file referenced inside every model
					PersistModelVisitor persistModelVisitor = new PersistModelVisitor(localGeppettoModelFile, getRuntimeProject(project).getRuntimeExperiment(
							getRuntimeProject(project).getActiveExperiment()), project);
					getRuntimeProject(project).getGeppettoModel().accept(persistModelVisitor);
					if(persistModelVisitor.getException() != null)
					{
						throw new GeppettoExecutionException(persistModelVisitor.getException());
					}
					persistModelVisitor.processLocalGeppettoFile();
					String fileName = URLReader.getFileName(url);
					String newPath = "projects/" + Long.toString(project.getId()) + "/" + fileName;
					S3Manager.getInstance().saveFileToS3(localGeppettoModelFile.toFile(), newPath);
					project.getGeppettoModel().setURL(S3Manager.getInstance().getURL(newPath).toString());
					// save Geppetto Scripts
					for(IExperiment experiment : project.getExperiments())
					{
						if(experiment.getScript() != null)
						{
							URL scriptURL = new URL(experiment.getScript());
							Path localScript = Paths.get(URLReader.createLocalCopy(scope, project.getId(), scriptURL).toURI());
							String newScriptPath = "projects/" + Long.toString(project.getId()) + "/" + experiment.getId() + "/script.js";
							S3Manager.getInstance().saveFileToS3(localScript.toFile(), newScriptPath);
							experiment.setScript(S3Manager.getInstance().getURL(newScriptPath).toString());
						}
					}
					DataManagerHelper.getDataManager().saveEntity(project);

				}
				else
				{
					throw new GeppettoExecutionException("Cannot persist a project without an active experiment");
				}
			}
			else
			{
				throw new GeppettoExecutionException("Persist failed: Project '" + project.getName() + "' is already persisted");
			}
		}
		catch(MalformedURLException e)
		{
			throw new GeppettoExecutionException(e);
		}
		catch(IOException e)
		{
			throw new GeppettoExecutionException(e);
		}
		catch(URISyntaxException e)
		{
			throw new GeppettoExecutionException(e);
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IExperimentManager#newExperiment(java.lang.String, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public IExperiment newExperiment(String requestId, IGeppettoProject project) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.WRITE_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to create new experiment.");
		}
		
		IExperiment experiment = DataManagerHelper.getDataManager().newExperiment("New Experiment " + (project.getExperiments().size() + 1), "", project);
		getRuntimeProject(project).populateNewExperiment(experiment);
		return experiment;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IExperimentManager#deleteExperiment(java.lang.String, org.geppetto.core.data.model.IExperiment, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public void deleteExperiment(String requestId, IExperiment experiment) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.WRITE_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to delete experiment.");
		}
		
		IGeppettoProject project = experiment.getParentProject();
		if(getRuntimeProject(project).getRuntimeExperiment(experiment) != null)
		{
			getRuntimeProject(project).closeExperiment(experiment);
		}

		DataManagerHelper.getDataManager().deleteExperiment(experiment);
		if(project.getActiveExperimentId() == experiment.getId())
		{
			project.setActiveExperimentId(-1);
		}
		project.getExperiments().remove(experiment);
		DataManagerHelper.getDataManager().saveEntity(project);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IDropBoxManager#linkDropBoxAccount()
	 */
	@Override
	public void linkDropBoxAccount(String key) throws Exception
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.DROPBOX_INTEGRATION)){
			throw new GeppettoAccessException("Insufficient access rights to link dropbox account.");
		}
		
		String authToken = dropboxService.link(key);
		getUser().setDropboxToken(authToken);
		DataManagerHelper.getDataManager().saveEntity(getUser());
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IDropBoxManager#unlinkDropBoxAccount()
	 */
	@Override
	public void unlinkDropBoxAccount(String key) throws Exception
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.DROPBOX_INTEGRATION)){
			throw new GeppettoAccessException("Insufficient access rights to unlink dropbox account.");
		}
		
		dropboxService.unlink(key);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IDropBoxManager#uploadModelToDropBox(java.lang.String, org.geppetto.core.services.IModelFormat)
	 */
	@Override
	public void uploadModelToDropBox(String aspectID, IExperiment experiment, IGeppettoProject project, ModelFormat format) throws Exception
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.DROPBOX_INTEGRATION)){
			throw new GeppettoAccessException("Insufficient access rights to upload model to dropbox.");
		}
		
		if(getUser() != null)
		{
			if(getUser().getDropboxToken() != null)
			{
				dropboxService.init(user.getDropboxToken());
			}
			// ConSvert model
			File file = this.downloadModel(aspectID, format, experiment, project);
			Zipper zipper = new Zipper(PathConfiguration.createExperimentTmpPath(Scope.CONNECTION, project.getId(), experiment.getId(), aspectID, file.getName() + ".zip"));
			Path path = zipper.getZipFromDirectory(file);
			dropboxService.upload(path.toFile());
		}

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IDropBoxManager#uploadResultsToDropBox(java.lang.String, org.geppetto.core.simulation.ResultsFormat)
	 */
	@Override
	public void uploadResultsToDropBox(String aspectID, IExperiment experiment, IGeppettoProject project, ResultsFormat format) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.DROPBOX_INTEGRATION)){
			throw new GeppettoAccessException("Insufficient access rights to upload results to dropbox.");
		}
		
		if(getUser() != null)
		{
			if(getUser().getDropboxToken() != null)
			{
				dropboxService.init(user.getDropboxToken());
			}
		}
		getRuntimeProject(project).getRuntimeExperiment(experiment).uploadResults(aspectID, format, dropboxService);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IRuntimeTreeManager#getModelTree(java.lang.String, org.geppetto.core.data.model.IExperiment, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public Map<String, AspectSubTreeNode> getModelTree(String aspectInstancePath, IExperiment experiment, IGeppettoProject project) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.READ_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to get runtime tree.");
		}
		
		return getRuntimeProject(project).getRuntimeExperiment(experiment).populateModelTree(aspectInstancePath);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IRuntimeTreeManager#getSimulationTree(java.lang.String, org.geppetto.core.data.model.IExperiment, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public Map<String, AspectSubTreeNode> getSimulationTree(String aspectInstancePath, IExperiment experiment, IGeppettoProject project) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.READ_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to get simulation tree.");
		}
		
		return getRuntimeProject(project).getRuntimeExperiment(experiment).populateSimulationTree(aspectInstancePath);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IRuntimeTreeManager#setModelParameters(java.lang.String, java.util.Map, org.geppetto.core.data.model.IExperiment, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public AspectSubTreeNode setModelParameters(String aspectInstancePath, Map<String, String> parameters, IExperiment experiment, IGeppettoProject project) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.WRITE_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to set model parameters.");
		}
		
		AspectSubTreeNode setParameters = getRuntimeProject(project).getRuntimeExperiment(experiment).setModelParameters(aspectInstancePath, parameters);
		DataManagerHelper.getDataManager().saveEntity(project);
		return setParameters;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IRuntimeTreeManager#setWatchedVariables(java.util.List, org.geppetto.core.data.model.IExperiment, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public void setWatchedVariables(List<String> watchedVariables, IExperiment experiment, IGeppettoProject project) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.WRITE_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to set watched variables.");
		}
		
		getRuntimeProject(project).getRuntimeExperiment(experiment).setWatchedVariables(watchedVariables);
		DataManagerHelper.getDataManager().saveEntity(project);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IRuntimeTreeManager#clearWatchLists(org.geppetto.core.data.model.IExperiment, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public void clearWatchLists(IExperiment experiment, IGeppettoProject project) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.WRITE_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to clear watched variables.");
		}
		
		getRuntimeProject(project).getRuntimeExperiment(experiment).clearWatchLists();
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IDownloadManager#downloadModel(java.lang.String, org.geppetto.core.services.IModelFormat)
	 */
	@Override
	public File downloadModel(String aspectInstancePath, ModelFormat format, IExperiment experiment, IGeppettoProject project) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.DOWNLOAD)){
			throw new GeppettoAccessException("Insufficient access rights to download model.");
		}
		
		return getRuntimeProject(project).getRuntimeExperiment(experiment).downloadModel(aspectInstancePath, format);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IDownloadManager#supportedOuputs(java.lang.String)
	 */
	@Override
	public List<ModelFormat> getSupportedOuputs(String aspectInstancePath, IExperiment experiment, IGeppettoProject project) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.READ_PROJECT)){
			throw new GeppettoAccessException("Insufficient access rights to get supported outputs.");
		}
		
		return getRuntimeProject(project).getRuntimeExperiment(experiment).supportedOuputs(aspectInstancePath);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IDownloadManager#downloadResults(org.geppetto.core.simulation.ResultsFormat)
	 */
	@Override
	public URL downloadResults(String aspectPath, ResultsFormat resultsFormat, IExperiment experiment, IGeppettoProject project) throws GeppettoExecutionException, GeppettoAccessException
	{
		if(!user.getUserGroup().getPrivileges().contains(UserPrivileges.DOWNLOAD)){
			throw new GeppettoAccessException("Insufficient access rights to download results.");
		}
		
		logger.info("Downloading results for " + aspectPath + " in format " + resultsFormat.toString());
		for(ISimulationResult result : experiment.getSimulationResults())
		{
			if(result.getAspect().getInstancePath().equals(aspectPath))
			{
				if(result.getFormat().equals(resultsFormat))
				{
					try
					{
						IPersistedData resultObject = result.getResult();
						String url = resultObject.getUrl();
						return URLReader.getURL(url);
					}
					catch(Exception e)
					{
						throw new GeppettoExecutionException(e);
					}
				}
			}
		}
		return null;
	}

	public IUser getUser()
	{
		return user;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IGeppettoManager#setUser(org.geppetto.core.data.model.IUser)
	 */
	@Override
	public void setUser(IUser user) throws GeppettoExecutionException
	{
		if(this.user != null)
		{
			String message = "A GeppettoManager is being reused, an user was already set and setUser is being called. Current user:" + this.user.getName() + ", attempted new user:" + user.getName();
			logger.error(message);
			throw new GeppettoExecutionException(message);
		}
		this.user = user;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IExperimentManager#cancelExperimentRun(java.lang.String, org.geppetto.core.data.model.IExperiment)
	 */
	@Override
	public void cancelExperimentRun(String requestId, IExperiment experiment)
	{
		// TODO Auto-generated method stub

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IProjectManager#checkExperimentsStatus(java.lang.String, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public List<? extends IExperiment> checkExperimentsStatus(String requestId, IGeppettoProject project)
	{
		// TODO This could be more sophisticated and return only the projects which have changed their status because of a run
		return project.getExperiments();
	}


	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.manager.IGeppettoManager#getScope()
	 */
	@Override
	public Scope getScope()
	{
		return scope;
	}
}
