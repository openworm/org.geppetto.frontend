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

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.core.model.GeppettoModelReader;
import org.geppetto.core.utilities.URLReader;
import org.geppetto.model.GeppettoModel;
import org.geppetto.model.util.GeppettoModelTraversal;
import org.geppetto.model.util.GeppettoVisitingException;
import org.geppetto.simulation.visitor.PopulateModelReferencesVisitor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class GeppettoProjectsController
{

	@Autowired
	private IGeppettoManager geppettoManager;

	@RequestMapping("/geppettoprojects")
	public @ResponseBody Collection<? extends IGeppettoProject> getAllGeppettoProjects()
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			return dataManager.getGeppettoProjectsForUser(geppettoManager.getUser().getLogin());
		}
		return null;
	}

	@RequestMapping(value = "/geppettoProjectsCompact", method = { RequestMethod.GET, RequestMethod.POST })
	public @ResponseBody List<Map<String, String>> getAllGeppettoProjectsCompact() throws GeppettoInitializationException, IOException, GeppettoVisitingException
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			List<Map<String, String>> allProjectsCompact = new ArrayList<Map<String, String>>();
			if(geppettoManager.getUser() != null)
			{

				Collection<? extends IGeppettoProject> projects = dataManager.getGeppettoProjectsForUser(geppettoManager.getUser().getLogin());
				for(IGeppettoProject project : projects)
				{
					Map<String, String> projectMap = new HashMap<String, String>();
					projectMap.put("id", Long.toString(project.getId()));
					projectMap.put("name", project.getName());
					allProjectsCompact.add(projectMap);
				}

			}
			else
			{
				Map<String, String> projectMap = new HashMap<String, String>();
				projectMap.put("name", "No user logged in " + geppettoManager.toString());
				allProjectsCompact.add(projectMap);
			}
			return allProjectsCompact;

		}
		return null;
	}

	@RequestMapping(value = "/projectswithref", method = { RequestMethod.GET, RequestMethod.POST })
	public @ResponseBody Collection<? extends IGeppettoProject> getAllGeppettoProjectsWithReference(@RequestParam String reference) throws GeppettoInitializationException, IOException,
			GeppettoVisitingException
	{
		List<IGeppettoProject> projectsFound = new ArrayList<IGeppettoProject>();
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			Collection<? extends IGeppettoProject> projects = dataManager.getGeppettoProjectsForUser(geppettoManager.getUser().getLogin());
			for(IGeppettoProject project : projects)
			{
				GeppettoModel geppettoModel = GeppettoModelReader.readGeppettoModel(URLReader.getURL(project.getGeppettoModel().getUrl()));
				PopulateModelReferencesVisitor populateModelReferencesVisitor = new PopulateModelReferencesVisitor();
				GeppettoModelTraversal.apply(geppettoModel, populateModelReferencesVisitor);
				if(populateModelReferencesVisitor.getModelReferences().contains(reference))
				{
					projectsFound.add(project);
				}
			}
		}
		return projectsFound;
	}
}
