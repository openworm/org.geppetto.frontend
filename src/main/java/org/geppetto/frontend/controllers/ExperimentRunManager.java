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
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;

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
import org.geppetto.core.manager.Scope;
import org.geppetto.core.model.runtime.AspectNode;
import org.geppetto.core.model.runtime.AspectSubTreeNode.AspectTreeType;
import org.geppetto.simulation.ExperimentRunThread;
import org.geppetto.simulation.IExperimentListener;
import org.geppetto.simulation.RuntimeExperiment;
import org.geppetto.simulation.RuntimeProject;
import org.geppetto.simulation.visitor.FindAspectNodeVisitor;

/**
 * The ExperimentRunManager is a singleton responsible for managing a queue per each user to run the experiments.
 * 
 * @author dandromereschi
 * @author matteocantarelli
 *
 */
public class ExperimentRunManager implements IExperimentListener
{

	private Map<IUser, BlockingQueue<IExperiment>> queue;

	private GeppettoManager geppettoManager;

	private volatile int reqId = 0;

	private Timer timer;

	private static ExperimentRunManager instance;

	static
	{
		instance = new ExperimentRunManager();
	}

	/**
	 * @return
	 */
	public static ExperimentRunManager getInstance()
	{
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
			queue = new ConcurrentHashMap<>();
			geppettoManager = new GeppettoManager(Scope.RUN);
			try
			{
				if(!DataManagerHelper.getDataManager().isDefault())
				{
					loadExperiments();
					timer = new Timer("ExperimentRunChecker");
					timer.schedule(new ExperimentRunChecker(), 0, 1000);
				}
			}
			catch(GeppettoInitializationException | GeppettoExecutionException | MalformedURLException e)
			{
				throw new RuntimeException(e);
			}
		}
	}


	/**
	 * @param user
	 * @param experiment
	 */
	public synchronized void queueExperiment(IUser user, IExperiment experiment)
	{
		experiment.setStatus(ExperimentStatus.QUEUED);

		addExperimentToQueue(user, experiment, ExperimentStatus.QUEUED);
	}


	/**
	 * @param experiment
	 * @return
	 */
	public boolean checkExperiment(IExperiment experiment)
	{
		return experiment.getStatus().equals(ExperimentStatus.QUEUED);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulation.IExperimentRunManager#runExperiment(org.geppetto.core.data.model.IExperiment)
	 */
	void runExperiment(IExperiment experiment) throws GeppettoExecutionException
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

			ExperimentRunThread experimentRun = new ExperimentRunThread(experiment, runtimeExperiment, project, this);
			experimentRun.start();
			experiment.setStatus(ExperimentStatus.RUNNING);
			DataManagerHelper.getDataManager().saveEntity(experiment);

		}
		catch(Exception e)
		{
			simulationError(experiment);
			throw new GeppettoExecutionException(e);
		}
	}

	/**
	 * 
	 */
	private void simulationError(IExperiment experiment)
	{
		experiment.setStatus(ExperimentStatus.ERROR);
		DataManagerHelper.getDataManager().saveEntity(experiment);
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
			for(IGeppettoProject project : user.getGeppettoProjects())
			{
				for(IExperiment e : project.getExperiments())
				{
					e.setParentProject(project);
					if(e.getStatus().equals(ExperimentStatus.RUNNING))
					{
						addExperimentToQueue(user, e, e.getStatus());
					}
				}
				for(IExperiment e : project.getExperiments())
				{
					if(e.getStatus().equals(ExperimentStatus.QUEUED))
					{
						addExperimentToQueue(user, e, e.getStatus());
					}
				}
			}
			dataManager.saveEntity(user);
		}
	}

	/**
	 * @param user
	 * @param experiment
	 * @param status
	 */
	private synchronized void addExperimentToQueue(IUser user, IExperiment experiment, ExperimentStatus status)
	{
		BlockingQueue<IExperiment> userExperiments = queue.get(user);
		if(userExperiments == null)
		{
			userExperiments = new ArrayBlockingQueue<IExperiment>(100);
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
		experimentRun.release();
		geppettoManager.closeProject("ERM" + getReqId(), project);
	}

	/**
	 * @return
	 */
	private synchronized int getReqId()
	{
		return ++reqId;
	}

	public Map<IUser, BlockingQueue<IExperiment>> getQueuedExperiments()
	{
		return this.queue;
	}

}

class ExperimentRunChecker extends TimerTask
{
	private static Log logger = LogFactory.getLog(ExperimentRunChecker.class);
	private Map<IUser, BlockingQueue<IExperiment>> queuedExperiments = ExperimentRunManager.getInstance().getQueuedExperiments();

	public synchronized void run()
	{
		try
		{
			for(IUser user : queuedExperiments.keySet())
			{
				List<IExperiment> ran = new ArrayList<IExperiment>();
				for(IExperiment e : queuedExperiments.get(user))
				{
					if(ExperimentRunManager.getInstance().checkExperiment(e))
					{
						logger.info("Experiment queued found " + e.getName());
						ExperimentRunManager.getInstance().runExperiment(e);
						ran.add(e);
					}

				}
				for(IExperiment ranExperiment : ran)
				{
					queuedExperiments.get(user).remove(ranExperiment);
				}
			}
		}
		catch(GeppettoExecutionException e)
		{
			throw new RuntimeException(e);
		}
	}
}
