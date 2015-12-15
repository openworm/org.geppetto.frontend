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
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.geppetto.core.data.model.IAspectConfiguration;
import org.geppetto.core.features.ISetParameterFeature;
import org.geppetto.core.model.AModelInterpreter;
import org.geppetto.core.model.GeppettoModelAccess;
import org.geppetto.core.model.ModelInterpreterException;
import org.geppetto.core.services.GeppettoFeature;
import org.geppetto.core.services.registry.ServicesRegistry;
import org.geppetto.model.GeppettoLibrary;
import org.geppetto.model.ModelFormat;
import org.geppetto.model.VariableValue;
import org.geppetto.model.types.CompositeType;
import org.geppetto.model.types.Type;
import org.geppetto.model.types.TypesFactory;
import org.geppetto.model.types.TypesPackage;
import org.geppetto.model.util.GeppettoVisitingException;
import org.geppetto.model.values.Pointer;
import org.geppetto.model.variables.Variable;
import org.geppetto.model.variables.VariablesFactory;

/**
 * @author matteocantarelli
 *
 */
public class TestModelInterpreterService extends AModelInterpreter
{

	private class TestSetParameterFeature implements ISetParameterFeature
	{

		@Override
		public GeppettoFeature getType()
		{
			return GeppettoFeature.SET_PARAMETERS_FEATURE;
		}

		@Override
		public void setParameter(VariableValue variableValue) throws ModelInterpreterException
		{
			// TODO Auto-generated method stub

		}

	}

	public TestModelInterpreterService()
	{
		super();
		this.addFeature(new TestSetParameterFeature());
		this.getName();
		
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
		ServicesRegistry.registerModelInterpreterService(this, modelFormats);

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.services.IService#isSupported(org.geppetto.core.services.GeppettoFeature)
	 */
	@Override
	public boolean isSupported(GeppettoFeature feature)
	{
		switch(feature)
		{
			case DYNAMIC_VISUALTREE_FEATURE:
				return false;
			case SET_PARAMETERS_FEATURE:
			case VARIABLE_WATCH_FEATURE:
				return true;
		}
		return false;
	}




	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.model.IModelInterpreter#importType(java.net.URL, java.lang.String, org.geppetto.model.GeppettoLibrary, org.geppetto.core.model.GeppettoModelAccess)
	 */
	@Override
	public Type importType(URL url, String typeName, GeppettoLibrary library, GeppettoModelAccess commonLibraryAccess) throws ModelInterpreterException
	{
		CompositeType type = TypesFactory.eINSTANCE.createCompositeType();
		try
		{
			type.setId("testType");
			type.setName("testType");

			Variable a = VariablesFactory.eINSTANCE.createVariable();
			a.setId("a");
			a.setName("a");
			a.getTypes().add(commonLibraryAccess.getType(TypesPackage.Literals.STATE_VARIABLE_TYPE));

			Variable b = VariablesFactory.eINSTANCE.createVariable();
			b.setId("b");
			b.setName("b");
			b.getTypes().add(commonLibraryAccess.getType(TypesPackage.Literals.STATE_VARIABLE_TYPE));
			
			Variable c = VariablesFactory.eINSTANCE.createVariable();
			c.setId("c");
			c.setName("c");
			c.getTypes().add(commonLibraryAccess.getType(TypesPackage.Literals.STATE_VARIABLE_TYPE));

			Variable p1 = VariablesFactory.eINSTANCE.createVariable();
			p1.setId("p1");
			p1.setName("p1");
			p1.getTypes().add(commonLibraryAccess.getType(TypesPackage.Literals.PARAMETER_TYPE));

			Variable p2 = VariablesFactory.eINSTANCE.createVariable();
			p2.setId("p2");
			p2.setName("p2");
			p2.getTypes().add(commonLibraryAccess.getType(TypesPackage.Literals.PARAMETER_TYPE));

			type.getVariables().add(a);
			type.getVariables().add(b);
			type.getVariables().add(c);
			type.getVariables().add(p1);
			type.getVariables().add(p2);

			library.getTypes().add(type);
		}
		catch(GeppettoVisitingException e)
		{
			throw new ModelInterpreterException(e);
		}
		return type;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.model.IModelInterpreter#downloadModel(org.geppetto.model.values.Pointer, org.geppetto.model.ModelFormat, org.geppetto.core.data.model.IAspectConfiguration)
	 */
	@Override
	public File downloadModel(Pointer pointer, ModelFormat format, IAspectConfiguration aspectConfiguration) throws ModelInterpreterException
	{
		return new File("ModelFile");
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.model.IModelInterpreter#getSupportedOutputs(org.geppetto.model.values.Pointer)
	 */
	@Override
	public List<ModelFormat> getSupportedOutputs(Pointer pointer) throws ModelInterpreterException
	{
		List<ModelFormat> formats=new ArrayList<ModelFormat>();
		formats.add(ServicesRegistry.getModelFormat("TEST_FORMAT"));
		return formats;
	}

	@Override
	public String getName()
	{
		return "Test Model Interpreter";
	}




}
