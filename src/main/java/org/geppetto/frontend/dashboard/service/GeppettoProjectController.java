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
package org.geppetto.frontend.dashboard.service;

import java.util.List;

import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.IExperiment;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.manager.IGeppettoManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class GeppettoProjectController
{

	@Autowired
	private IGeppettoManager geppettoManager;

	@RequestMapping("/dashboard/geppettoproject/{id}")
	public @ResponseBody
	IGeppettoProject getGeppettoProject(@PathVariable("id") int id)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			return dataManager.getGeppettoProjectById(id);
		}
		return null;
	}
	
	@RequestMapping("/dashboard/geppettoproject/{projectId}/experiments/{experimentId}/downloadResults")
	public @ResponseBody
	Object downloadExperimentResults(@PathVariable("projectId") int projectId,@PathVariable("experimentId") int experimentId)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			List<? extends IExperiment> experiments = dataManager.getExperimentsForProject(projectId);
			IExperiment theExperiment;
			for(IExperiment e : experiments){
				if(e.getId() == experimentId)
				{
					// The experiment is found
					theExperiment = e;
					break;
				}
			}
		}
		return null;
	}

	@RequestMapping(value = "/dashboard/geppettoproject/delete/{id}")
	public @ResponseBody
	Object deleteGeppettoProject(@PathVariable("id") int id)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			dataManager.deleteGeppettoProject(id, geppettoManager.getUser());
		}
		return null;
	}

}
