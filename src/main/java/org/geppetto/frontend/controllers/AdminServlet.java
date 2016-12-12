package org.geppetto.frontend.controllers;

import java.util.Collection;
import java.util.List;


import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.data.model.IUser;
import org.geppetto.core.data.model.local.LocalUser;
import org.geppetto.core.manager.IGeppettoManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class AdminServlet {
	private static Log logger = LogFactory.getLog(AdminServlet.class);

	@Autowired
	private IGeppettoManager geppettoManager;
	
	@RequestMapping(value = "/admin", method = RequestMethod.GET)
	public String admin()
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			IUser user = geppettoManager.getUser();
			user.getUserGroup().getPrivileges();
			return "dist/admin";
		}
		
		return "dist/admin";
	}
	
	@RequestMapping(value = "/user/{login}/users")
	public @ResponseBody Collection<? extends IUser> getUsers(@PathVariable("login") String login)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		Collection<? extends IUser> users = null;
		if(dataManager != null)
		{
			users =  dataManager.getAllUsers();
		}
		return users;
	}
	
	@RequestMapping(value = "/user/{login}/storage")
	public @ResponseBody String getUserStorage(@PathVariable("login") String login)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			return "512KB";
		}
		return null;
	}
}
