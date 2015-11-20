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

import org.geppetto.core.model.runtime.CompositeNode;
import org.geppetto.core.model.runtime.DynamicsSpecificationNode;
import org.geppetto.core.model.runtime.FunctionNode;
import org.geppetto.core.model.runtime.ParameterSpecificationNode;
import org.geppetto.core.model.runtime.TextMetadataNode;
import org.geppetto.core.model.state.visitors.RuntimeTreeVisitor;

/**
 * Visitor used for setting modified flag on subtree to flase after sending update
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 * 
 */
public class ModelTreeExitVisitor extends RuntimeTreeVisitor
{

	public ModelTreeExitVisitor()
	{
	}


	@Override
	public boolean inCompositeNode(CompositeNode node)
	{
		node.setModified(false);
		return super.inCompositeNode(node);
	}
	
	@Override
	public boolean outCompositeNode(CompositeNode node)
	{
		node.setModified(false);
		return super.outCompositeNode(node);
	}
	
	@Override
	public boolean visitTextMetadataNode(TextMetadataNode node){
		node.setModified(false);
		return super.visitTextMetadataNode(node);
	}
	
	@Override
	public boolean visitParameterSpecificationNode(ParameterSpecificationNode node){
		node.setModified(false);
		return super.visitParameterSpecificationNode(node);
	}
	
	@Override
	public boolean visitFunctionNode(FunctionNode node){
		node.setModified(false);
		return super.visitFunctionNode(node);
	}
	
	@Override
	public boolean visitDynamicsSpecificationNode(DynamicsSpecificationNode node){
		node.setModified(false);
		return super.visitDynamicsSpecificationNode(node);
	}
}
