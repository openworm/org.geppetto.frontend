package org.geppetto.frontend.controllers;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.auth.IAuthService;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.frontend.dashboard.AuthServiceCreator;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class Application
{
	
	private static Log logger = LogFactory.getLog(Application.class);
	
	IAuthService authService;

	@RequestMapping(value = "/", method = RequestMethod.GET)
	public String home()
	{
		try
		{
			authService = new AuthServiceCreator(IAuthService.class.getName()).getService();
		}
		catch(GeppettoInitializationException e)
		{
			logger.error("Error while retrieving an authentication service",e);
		}
		if(authService == null || authService.isAuthenticated())
		{
			return "dist/index";
		}
		else
		{
			return "redirect:" + authService.authFailureRedirect();
		}
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
