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

import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.model.IModelInterpreter;
import org.geppetto.core.model.simulation.Model;
import org.geppetto.core.model.simulation.visitor.BaseVisitor;
import org.geppetto.core.model.simulation.visitor.TraversingVisitor;
import org.geppetto.core.s3.S3Manager;
import org.geppetto.core.utilities.URLReader;
import org.geppetto.simulation.RuntimeExperiment;
import org.geppetto.simulation.visitor.DepthFirstTraverserEntitiesFirst;

/**
 * @author matteocantarelli
 *
 */
public class PersistModelVisitor extends TraversingVisitor
{

	private RuntimeExperiment runtimeExperiment;

	private IGeppettoProject project;

	private Map<String, String> replaceMap = new HashMap<String, String>();

	private Exception exception = null;

	private Path localGeppettoModelFile;

	/**
	 * @param localGeppettoModelFile 
	 * @param runtimeExperiment
	 * @param project
	 */
	public PersistModelVisitor(Path localGeppettoModelFile, RuntimeExperiment runtimeExperiment, IGeppettoProject project)
	{
		super(new DepthFirstTraverserEntitiesFirst(), new BaseVisitor());
		this.runtimeExperiment = runtimeExperiment;
		this.project = project;
		this.localGeppettoModelFile=localGeppettoModelFile;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see com.massfords.humantask.TraversingVisitor#visit(org.geppetto.simulation.model.Model)
	 */
	@Override
	public void visit(Model model)
	{
		try
		{
			IModelInterpreter modelInterpreter = runtimeExperiment.getModelInterpreters().get(model.getInstancePath());
			List<URL> dependentModels = modelInterpreter.getDependentModels();
			for(URL url : dependentModels)
			{
				// let's create a map for the new file paths
				String fileName = url.getPath().substring(url.getPath().lastIndexOf("/")+1);
				String newPath = "projects/"+Long.toString(project.getId()) + "/" + fileName;
				replaceMap.put(url.toString(), newPath);
			}
			for(URL url : dependentModels)
			{
				Path localFile = Paths.get(URLReader.createLocalCopy(url).toURI());
				// let's replace every occurrence of the original URLs inside the file with their copy
				replaceURLs(localFile, replaceMap);
				//noew let's save the file in S3
				S3Manager.getInstance().saveFileToS3(localFile.toFile(), replaceMap.get(url.toString()));
			}
		}
		catch(URISyntaxException | IOException e)
		{
			exception = e;
		}
	}

	/**
	 * This method replaces in the localFile all the occurrences of the old URLs with the new ones
	 * 
	 * @param localFile
	 * @param replaceMap
	 * @throws IOException
	 */
	private void replaceURLs(Path localFile, Map<String, String> replaceMap) throws IOException
	{
		Charset charset = StandardCharsets.UTF_8;

		String content = new String(Files.readAllBytes(localFile), charset);
		for(String old : replaceMap.keySet())
		{
			content = content.replaceAll(Pattern.quote(old), S3Manager.getInstance().getURL(replaceMap.get(old)).toString());
		}
		Files.write(localFile, content.getBytes(charset));
	}


	/**
	 * @return
	 */
	public Exception getException()
	{
		return exception;
	}

	public void processLocalGeppettoFile() throws IOException
	{
		replaceURLs(localGeppettoModelFile,replaceMap);
	}
}
