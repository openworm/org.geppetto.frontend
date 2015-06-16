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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.ExperimentStatus;
import org.geppetto.core.data.model.IAspectConfiguration;
import org.geppetto.core.data.model.IExperiment;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.data.model.IUser;
import org.geppetto.core.model.runtime.AspectNode;
import org.geppetto.core.model.runtime.AspectSubTreeNode.AspectTreeType;
import org.geppetto.core.simulation.IExperimentRunManager;
import org.geppetto.core.simulation.IGeppettoManagerCallbackListener;
import org.geppetto.simulation.ExperimentRunThread;
import org.geppetto.simulation.IExperimentListener;
import org.geppetto.simulation.RuntimeExperiment;
import org.geppetto.simulation.RuntimeProject;
import org.geppetto.simulation.visitor.FindAspectNodeVisitor;
import org.springframework.stereotype.Component;

/**
 * The ExperimentRunManager is a singleton responsible for managing a queue per each user to run the experiments.
 * 
 * @author dandromereschi
 * @author matteocantarelli
 *
 */
@Component
public class ExperimentRunManager implements IExperimentRunManager, IExperimentListener
{
	private Map<IUser, List<IExperiment>> queue = new LinkedHashMap<>();

	private List<ExperimentRunThread> experimentRuns = new ArrayList<>();

	private GeppettoManager geppettoManager = new GeppettoManager();

	private volatile int reqId = 0;

	// TODO How do we send a message to the client if it is connected to say for instance that an experiment was completed?
	private IGeppettoManagerCallbackListener simulationCallbackListener;

	private Timer timer;

	private static ExperimentRunManager instance;

	/**
	 * @return
	 */
	public static ExperimentRunManager getInstance()
	{
		if(instance == null)
		{
			instance = new ExperimentRunManager();
		}
		return instance;
	}

	/**
	 * 
	 */
	private ExperimentRunManager()
	{
		if(instance == null)
		{
			instance = this;
			try
			{
				loadExperiments();
				timer = new Timer();
				timer.schedule(new ExperimentRunChecker(), 0, 1000);
			}
			catch(GeppettoInitializationException | GeppettoExecutionException | MalformedURLException e)
			{
				// TODO Handle
				e.printStackTrace();
			}
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulation.IExperimentRunManager#queueExperiment(org.geppetto.core.data.model.IUser, org.geppetto.core.data.model.IExperiment)
	 */
	@Override
	public void queueExperiment(IUser user, IExperiment experiment)
	{
		experiment.setStatus(ExperimentStatus.QUEUED);

		addExperimentToQueue(user, experiment, ExperimentStatus.QUEUED);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulation.IExperimentRunManager#checkExperiment(org.geppetto.core.data.model.IExperiment, org.geppetto.core.data.model.IGeppettoProject)
	 */
	@Override
	public boolean checkExperiment(IExperiment experiment)
	{
		return experiment.getStatus().equals(ExperimentStatus.QUEUED);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulation.IExperimentRunManager#runExperiment(org.geppetto.core.data.model.IExperiment)
	 */
	public void runExperiment(IExperiment experiment) throws GeppettoExecutionException
	{
		try
		{
			IGeppettoProject project = experiment.getParentProject();
			geppettoManager.loadProject(String.valueOf(this.getReqId()), project);
			RuntimeProject runtimeProject = geppettoManager.getRuntimeProject(project);
			runtimeProject.openExperiment(String.valueOf(this.getReqId()), experiment);
			RuntimeExperiment runtimeExperiment = runtimeProject.getRuntimeExperiment(experiment);

			// Populate Simulation Tree
			List<? extends IAspectConfiguration> aspectConfigs = experiment.getAspectConfigurations();
			for(IAspectConfiguration aspectConfig : aspectConfigs)
			{
				String aspect = aspectConfig.getAspect().getInstancePath();

				// Clear Simulation Tree
				FindAspectNodeVisitor findAspectNodeVisitor = new FindAspectNodeVisitor(aspect);
				runtimeExperiment.getRuntimeTree().apply(findAspectNodeVisitor);
				AspectNode node = findAspectNodeVisitor.getAspectNode();
				node.flushSubTree(AspectTreeType.SIMULATION_TREE);

				// Populate Simulation Tree per aspect
				runtimeExperiment.populateSimulationTree(aspect);
			}

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
		catch(Exception e)
		{
			throw new GeppettoExecutionException(e);
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
				geppettoManager.loadProject("ERM" + getReqId(), project);
				List<? extends IExperiment> experiments = dataManager.getExperimentsForProject(project.getId());
				for(IExperiment e : experiments)
				{
					if(e.getStatus().equals(ExperimentStatus.RUNNING))
					{
						addExperimentToQueue(user, e, e.getStatus());
					}
				}
				for(IExperiment e : experiments)
				{
					if(e.getStatus().equals(ExperimentStatus.QUEUED))
					{
						addExperimentToQueue(user, e, e.getStatus());
					}
				}
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
	 * @param experiment
	 * @param status
	 */
	private synchronized void addExperimentToQueue(IUser user, IExperiment experiment, ExperimentStatus status)
	{
		List<IExperiment> userExperiments = queue.get(user);
		if(userExperiments == null)
		{
			userExperiments = new ArrayList<>();
			queue.put(user, userExperiments);
		}
		if(experiment.getStatus() == status)
		{
			experiment.setStatus(ExperimentStatus.QUEUED);
			userExperiments.add(experiment);
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

		RuntimeProject runtimeProject = geppettoManager.getRuntimeProject(project);
		runtimeProject.closeExperiment(experiment);
		List<? extends IExperiment> experiments = project.getExperiments();
		boolean closeProject = runtimeProject.getActiveExperiment() == null;
		for(int i = 0; i < experiments.size() && closeProject; i++)
		{
			closeProject = experiments.get(i).getStatus() == ExperimentStatus.COMPLETED;
		}
		if(closeProject)
		{
			// close the project when all the user experiments are completed and none of the experiments is active
			geppettoManager.closeProject("ERM" + getReqId(), project);
		}

	}

	/**
	 * @return
	 */
	private synchronized int getReqId()
	{
		return ++reqId;
	}

	public Map<IUser, List<IExperiment>> getQueuedExperiments()
	{
		return this.queue;
	}

}

class ExperimentRunChecker extends TimerTask
{
	private static Log logger = LogFactory.getLog(ExperimentRunChecker.class);
	private Map<IUser, List<IExperiment>> queuedExperiments = ExperimentRunManager.getInstance().getQueuedExperiments();

	public void run()
	{
		try
		{
			for(IUser user : queuedExperiments.keySet())
			{
				for(IExperiment e : queuedExperiments.get(user))
				{
					if(ExperimentRunManager.getInstance().checkExperiment(e))
					{
						logger.info("Experiment queued found " + e.getName());
						ExperimentRunManager.getInstance().runExperiment(e);
					}

				}
			}
		}
		catch(GeppettoExecutionException e)
		{
			throw new RuntimeException(e);
		}
	}
}
