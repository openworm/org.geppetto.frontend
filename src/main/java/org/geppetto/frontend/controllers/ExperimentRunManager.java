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

import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.ExperimentStatus;
import org.geppetto.core.data.model.IExperiment;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.data.model.IUser;
import org.geppetto.core.simulation.IExperimentRunManager;
import org.geppetto.core.simulation.IGeppettoManagerCallbackListener;
import org.geppetto.simulation.ExperimentRunThread;
import org.geppetto.simulation.IExperimentListener;
import org.geppetto.simulation.RuntimeExperiment;
import org.geppetto.simulation.RuntimeProject;

/**
 * The ExperimentRunManager is a singleton responsible for managing a queue per each user to run the experiments.
 * 
 * @author dandromereschi
 * @author matteocantarelli
 *
 */
public class ExperimentRunManager implements IExperimentRunManager, IExperimentListener
{
	private Map<IUser, List<IExperiment>> queue = new LinkedHashMap<>();

	private List<ExperimentRunThread> experimentRuns = new ArrayList<>();

	private GeppettoManager projectManager = new GeppettoManager();

	private volatile int reqId = 0;

	// TODO How do we send a message to the client if it is connected to say for instance that an experiment was completed?
	private IGeppettoManagerCallbackListener simulationCallbackListener;

	
	public ExperimentRunManager()
	{
		try
		{
			loadExperiments();
		}
		catch(GeppettoInitializationException | GeppettoExecutionException | MalformedURLException e)
		{
			// TODO Handle
			e.printStackTrace();
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulation.IExperimentRunManager#queueExperiment(org.geppetto.core.data.model.IUser, org.geppetto.core.data.model.IExperiment)
	 */
	@Override
	public void queueExperiment(IUser user, IExperiment experiment, IGeppettoProject project)
	{
		experiment.setStatus(ExperimentStatus.QUEUED);
		addExperimentsToQueue(user, Arrays.asList(new IExperiment[] { experiment }), ExperimentStatus.QUEUED);
	}

	/* (non-Javadoc)
	 * @see org.geppetto.core.simulation.IExperimentRunManager#checkExperiment(org.geppetto.core.data.model.IExperiment, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public boolean checkExperiment(IExperiment experiment, IGeppettoProject project)
	{
		// TODO: needs to decide if an experiment should be running or not
		return true;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulation.IExperimentRunManager#runExperiment(org.geppetto.core.data.model.IExperiment)
	 */
	public void runExperiment(IExperiment experiment, IGeppettoProject project) throws GeppettoExecutionException
	{

		RuntimeProject runtimeProject = projectManager.getRuntimeProject(project);
		RuntimeExperiment runtimeExperiment = runtimeProject.getRuntimeExperiment(experiment);

		ExperimentRunThread experimentRun = new ExperimentRunThread(experiment, runtimeExperiment, project, simulationCallbackListener);
		experimentRun.addExperimentListener(this);
		experimentRun.start();
		experiment.setStatus(ExperimentStatus.RUNNING);

		IUser user = getUserForExperiment(experiment);

		synchronized(this)
		{
			queue.get(user).remove(experiment);
		}
		synchronized(experimentRuns)
		{
			experimentRuns.add(experimentRun);
		}
	}

	/**
	 * @throws GeppettoInitializationException
	 * @throws MalformedURLException
	 * @throws GeppettoExecutionException
	 */
	private void loadExperiments() throws GeppettoInitializationException, MalformedURLException, GeppettoExecutionException
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		List<? extends IUser> users = dataManager.getAllUsers();
		for(IUser user : users)
		{
			List<? extends IGeppettoProject> projects = dataManager.getGeppettoProjectsForUser(user.getLogin());
			for(IGeppettoProject project : projects)
			{
				// This could be either when the user decides to open a project or when the ExperimentsRunManager queues an Experiment
				projectManager.loadProject("ERM" + getReqId(), project);
				List<? extends IExperiment> experiments = dataManager.getExperimentsForProject(project.getId());
				addExperimentsToQueue(user, experiments, ExperimentStatus.RUNNING);
				addExperimentsToQueue(user, experiments, ExperimentStatus.QUEUED);
			}
		}
	}

	/**
	 * @param experiment
	 * @return
	 * @throws GeppettoInitializationException
	 */
	private synchronized IUser getUserForExperiment(IExperiment experiment)
	{
		for(Map.Entry<IUser, List<IExperiment>> experimentEntry : queue.entrySet())
		{
			if(experimentEntry.getValue().contains(experiment))
			{
				return experimentEntry.getKey();
			}
		}
		return null;
	}

	/**
	 * @param user
	 * @param experiments
	 * @param status
	 */
	private synchronized void addExperimentsToQueue(IUser user, List<? extends IExperiment> experiments, ExperimentStatus status)
	{
		List<IExperiment> userExperiments = queue.get(user);
		if(userExperiments == null)
		{
			userExperiments = new ArrayList<>();
			queue.put(user, userExperiments);
		}
		for(IExperiment experiment : experiments)
		{
			if(experiment.getStatus() == status)
			{
				experiment.setStatus(ExperimentStatus.QUEUED);
				userExperiments.add(experiment);
			}
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.simulation.IExperimentListener#experimentRunDone(org.geppetto.simulation.ExperimentRun, org.geppetto.core.data.model.IExperiment)
	 */
	@Override
	public void experimentRunDone(ExperimentRunThread experimentRun, IExperiment experiment, IGeppettoProject project) throws GeppettoExecutionException
	{
		experimentRun.removeExperimentListener(this);

		IUser user = getUserForExperiment(experiment);
		if(user != null)
		{
			queue.get(user).remove(experiment);

			RuntimeProject runtimeProject = projectManager.getRuntimeProject(project);
			// When an experiment run is done we close its experiment unless it happens to be also the active one
			if(runtimeProject != null && !experiment.equals(runtimeProject.getActiveExperiment()))
			{
				runtimeProject.closeExperiment(experiment);
			}
			List<? extends IExperiment> experiments = project.getExperiments();
			boolean closeProject = runtimeProject.getActiveExperiment() == null;
			for(int i = 0; i < experiments.size() && closeProject; i++)
			{
				closeProject = experiments.get(i).getStatus() == ExperimentStatus.COMPLETED;
			}
			if(closeProject)
			{
				// close the project when all the user experiments are completed and none of the experiments is active
				projectManager.closeProject("ERM" + getReqId(), project);
			}

		}
	}

	/**
	 * @return
	 */
	private synchronized int getReqId()
	{
		return ++reqId;
	}


}
