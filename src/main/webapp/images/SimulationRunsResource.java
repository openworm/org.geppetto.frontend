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
package org.geppetto.persistence.server.resource;

import java.util.List;

import org.geppetto.persistence.db.DBManager;
import org.geppetto.persistence.db.model.Parameter;
import org.geppetto.persistence.db.model.PersistedData;
import org.geppetto.persistence.db.model.SimulationRun;
import org.geppetto.persistence.server.PersistenceApplication;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.resource.Get;
import org.restlet.resource.ServerResource;

public class SimulationRunsResource extends ServerResource
{
	@Get("json")
	public String getSimulationRuns()
	{
		PersistenceApplication application = (PersistenceApplication) getApplication();
		DBManager dbManager = application.getDbManager();
		List<SimulationRun> simulationRuns = dbManager.getAllEntities(SimulationRun.class);

		JSONObject result = new JSONObject();
		JSONArray simulationRunsArray = new JSONArray();
		try
		{
			for(SimulationRun simulationRun : simulationRuns)
			{
				JSONObject simulationRunObject = new JSONObject();
				simulationRunObject.put("id", simulationRun.getId());
				simulationRunObject.put("start_date", simulationRun.getStartDate());
				simulationRunObject.put("end_date", simulationRun.getEndDate());
				simulationRunObject.put("status", simulationRun.getStatus());

				PersistedData persistedData = simulationRun.getResults();
				JSONObject persistedDataObject = new JSONObject();
				persistedDataObject.put("url", persistedData.getUrl());
				persistedDataObject.put("type", persistedData.getType());
				simulationRunObject.put("persisted_data", persistedDataObject);

				List<Parameter> parameters = simulationRun.getSimulationParameters();
				JSONArray parametersArray = new JSONArray();
				for(Parameter parameter : parameters)
				{
					JSONObject parameterObject = new JSONObject();
					parameterObject.put("instance_path", parameter.getInstancePath());
					parameterObject.put("type", parameter.getType());
					parameterObject.put("value", parameter.getValue());
					parametersArray.put(parameterObject);
				}
				simulationRunObject.put("parameters", parametersArray);

				simulationRunsArray.put(simulationRunObject);
			}
			result.put("simulations_runs", simulationRunsArray);
		}
		catch(JSONException e)
		{
			// ignore
		}
		return result.toString();
	}
}
