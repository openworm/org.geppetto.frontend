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
package org.geppetto.frontend.test;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.model.IAspectConfiguration;
import org.geppetto.core.data.model.ResultsFormat;
import org.geppetto.core.recordings.ConvertDATToRecording;
import org.geppetto.core.services.registry.ServicesRegistry;
import org.geppetto.core.simulation.ISimulatorCallbackListener;
import org.geppetto.core.simulator.ASimulator;
import org.geppetto.model.DomainModel;
import org.geppetto.model.ExperimentState;
import org.geppetto.model.ModelFormat;
import org.junit.Assert;

/**
 * @author matteocantarelli
 *
 */
public class TestSimulatorService extends ASimulator
{

	@Override
	public void initialize(DomainModel model, IAspectConfiguration aspectConfiguration, ExperimentState experimentState, ISimulatorCallbackListener listener) throws GeppettoInitializationException,
			GeppettoExecutionException
	{
		super.initialize(model, aspectConfiguration, experimentState, listener);
		Assert.assertNotNull(aspectConfiguration);
		Assert.assertNotNull(experimentState);
		Assert.assertNotNull(listener);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulator.ISimulator#simulate()
	 */
	@Override
	public void simulate() throws GeppettoExecutionException
	{
		Map<File, ResultsFormat> results = new HashMap<File, ResultsFormat>();
		ConvertDATToRecording converter=new ConvertDATToRecording("./src/test/resources/test/testResults.h5");
		String[] variables={"time(StateVariable)","testVar(testType).c(StateVariable)","testVar(testType).a(StateVariable)","testVar(testType).b(StateVariable)"};
		converter.addDATFile("./src/test/resources/test/testResults.dat", variables);
		try
		{
			converter.convert(this.experimentState);
		}
		catch(Exception e)
		{
			throw new GeppettoExecutionException(e);
		}
		File geppettoResult = new File("./src/test/resources/test/testResults.h5");
		File rawResult = new File("./src/test/resources/test/testResults.dat");
		results.put(geppettoResult, ResultsFormat.GEPPETTO_RECORDING);
		results.put(rawResult, ResultsFormat.RAW);
		getListener().endOfSteps(this.aspectConfiguration, results);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulator.ISimulator#getName()
	 */
	@Override
	public String getName()
	{
		return "Test Simulator";
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulator.ISimulator#getId()
	 */
	@Override
	public String getId()
	{
		return "testSimulator";
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.services.IService#registerGeppettoService()
	 */
	@Override
	public void registerGeppettoService() throws Exception
	{
		List<ModelFormat> modelFormats = new ArrayList<ModelFormat>(Arrays.asList(ServicesRegistry.registerModelFormat("TEST_FORMAT")));
		ServicesRegistry.registerSimulatorService(this, modelFormats);
	}

}
