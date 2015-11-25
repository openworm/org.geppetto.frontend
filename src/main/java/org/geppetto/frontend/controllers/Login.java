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

import javax.servlet.http.HttpServletResponse;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.subject.Subject;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.IUser;
import org.geppetto.core.manager.IGeppettoManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class Login
{

	private static Log logger = LogFactory.getLog(Login.class);

	@Autowired
	private IGeppettoManager geppettoManager;

	public Login()
	{
	}

	@RequestMapping(value = "/login", method = {RequestMethod.GET, RequestMethod.POST})
	public @ResponseBody
	IUser login(@RequestParam String username, @RequestParam String password, @RequestParam(defaultValue="",required=false) String url, @RequestParam(defaultValue="web",required=false) String outputFormat, HttpServletResponse response) throws IOException
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(!dataManager.isDefault())
		{
			Subject currentUser = SecurityUtils.getSubject();
			if(!currentUser.isAuthenticated())
			{
				UsernamePasswordToken token = new UsernamePasswordToken(username, password);
				currentUser.login(token);
			}

			try
			{
				geppettoManager.setUser((IUser) currentUser.getPrincipal());
			}
			catch(GeppettoExecutionException e)
			{
				logger.error(e);
			}
		}
		if (outputFormat.equals("web"))
			response.sendRedirect("/" + url);
		return geppettoManager.getUser();
	}

	@RequestMapping(value = "/logout", method = RequestMethod.GET)
	public String logout(@RequestParam(defaultValue="web",required=false) String outputFormat, HttpServletResponse response) throws IOException
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(!dataManager.isDefault())
		{
			Subject currentUser = SecurityUtils.getSubject();
			if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
			{
				currentUser.logout();
				try
				{
					geppettoManager.setUser(null);
				}
				catch(GeppettoExecutionException e)
				{
					logger.error(e);
				}
			}
		}
		if (outputFormat.equals("web"))
			response.sendRedirect("/");
		return null;
		
	}

}