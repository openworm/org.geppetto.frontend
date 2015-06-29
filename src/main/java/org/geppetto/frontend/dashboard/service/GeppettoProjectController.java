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

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Path;
import java.util.List;

import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.IAspectConfiguration;
import org.geppetto.core.data.model.IExperiment;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.core.simulation.ResultsFormat;
import org.geppetto.core.utilities.Zipper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
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
	public @ResponseBody IGeppettoProject getGeppettoProject(@PathVariable("id") int id)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			return dataManager.getGeppettoProjectById(id);
		}
		return null;
	}

	@RequestMapping(value = "/dashboard/geppettoproject/{projectId}/experiments/{experimentId}/downloadResults", produces = "application/zip")
	@ResponseBody
	public FileSystemResource downloadExperimentResults(@PathVariable("projectId") int projectId, @PathVariable("experimentId") int experimentId) throws GeppettoExecutionException, IOException
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			List<? extends IExperiment> experiments = dataManager.getExperimentsForProject(projectId);
			for(IExperiment e : experiments)
			{
				if(e.getId() == experimentId)
				{
					String directory = System.getProperty("user.dir");
					String tmp = File.separator + "geppettoTmp" + File.separator;
					String path = "results" + File.separator + "p" + File.separator + projectId + File.separator + "e" + File.separator
							+ experimentId + File.separator;
					File outputFolder = new File(directory + tmp + path);
					outputFolder.mkdirs();
					for(IAspectConfiguration ac : e.getAspectConfigurations())
					{
						URL result = (geppettoManager.downloadResults(ac.getAspect().getInstancePath(), ResultsFormat.GEPPETTO_RECORDING, e, e.getParentProject()));
						Zipper zipper = new Zipper();
						zipper.getZipFromFile(result, path + ac.getAspect().getInstancePath() + ".zip");

					}
					Zipper zipper = new Zipper();
					// the whole folder with all the zipped results
					Path finalZip = zipper.getZipFromDirectory(outputFolder);
					return new FileSystemResource(finalZip.toFile());

				}
			}
		}
		return null;
	}

	@RequestMapping(value = "/dashboard/geppettoproject/delete/{id}")
	public String deleteGeppettoProject(@PathVariable("id") int id)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			dataManager.deleteGeppettoProject(id, geppettoManager.getUser());
		}
		return "redirect:/dashboard";
	}

}
