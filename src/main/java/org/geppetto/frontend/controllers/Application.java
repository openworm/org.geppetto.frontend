package org.geppetto.frontend.controllers;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.geppetto.core.auth.IAuthService;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.frontend.dashboard.AuthServiceCreator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class Application
{

	public Application()
	{
		super();
	}

	
	@Autowired
	private IGeppettoManager geppettoManager;

	private static Log logger = LogFactory.getLog(Application.class);

	
	@RequestMapping(value = "/", method = RequestMethod.GET)
	public String home()
	{
		try
		{
			IAuthService authService = AuthServiceCreator.getService();

			boolean auth = false;
			
			if(authService == null)
			{
				// Default no persistence, no users
				auth = true;
			}
			else if(geppettoManager.getUser() != null)
			{
				// This is with Geppetto DB, for the user to not be null inside the GeppettoManager somebody must have used
				// the Login servlet
				Subject currentUser = SecurityUtils.getSubject();
				auth = currentUser.isAuthenticated();
			}
			else if(geppettoManager.getUser() == null)
			{
				// This is with any other DB
				auth = authService.isAuthenticated();
			}
			if(auth)
			{
				return "dist/index";
			}
			else
			{

				return "redirect:" + authService.authFailureRedirect();
			}
		}
		catch(GeppettoInitializationException e)
		{
			logger.error("Error while retrieving an authentication service", e);
		}
		return "redirect:http://geppetto.org";
	}

	@RequestMapping(value = "/GeppettoTests.html", method = RequestMethod.GET)
	public String test()
	{
		return "dist/geppettotests";
	}

	@RequestMapping(value = "/dashboard", method = RequestMethod.GET)
	public String dashboard()
	{
		return "dist/dashboard";
	}

}
