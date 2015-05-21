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

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.JsonRequestException;
import org.geppetto.core.data.model.IUser;
import org.geppetto.core.manager.IGeppettoManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class UserResource
{
	private static Log logger = LogFactory.getLog(UserResource.class);

	@Autowired
	private IGeppettoManager geppettoManager;

	private volatile static int guestId;

	@RequestMapping("/dashboard/currentuser")
	public @ResponseBody
	IUser getCurrentUser()
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(!currentUser.isAuthenticated() && geppettoManager.getUser() == null)
		{
			IUser guest = getGuestUser();
			try
			{
				geppettoManager.setUser(guest);
			}
			catch(GeppettoExecutionException e)
			{
				logger.error(e);
			}
			return guest;
		}
		try
		{
			if(!DataManagerHelper.getDataManager().isDefault())
			{
				geppettoManager.setUser(DataManagerHelper.getDataManager().getUserByLogin((String) currentUser.getPrincipal()));
			}
		}
		catch(GeppettoExecutionException e)
		{
			logger.error(e);
		}
		return geppettoManager.getUser();
	}

	private IUser getGuestUser()
	{
		synchronized(this)
		{
			guestId++;
		}
		return DataManagerHelper.getDataManager().newUser("guest" + guestId);
	}

	@RequestMapping("/dashboard/logout")
	public @ResponseBody
	Object logout()
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			if(dataManager.isDefault())
			{
				return new JsonRequestException("Could not logout user", HttpStatus.BAD_REQUEST);
			}
			else
			{
				return new JsonRequestException("Not implemented", HttpStatus.NOT_IMPLEMENTED);
			}
		}
		return null;
	}

}
