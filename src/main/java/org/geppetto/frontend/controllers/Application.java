package org.geppetto.frontend.controllers;

import org.geppetto.core.auth.IAuthService;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.frontend.server.AuthServiceCreator;
import org.osgi.framework.BundleContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class Application
{

	@Autowired
	BundleContext bundleContext;

	// @Autowired(required = false)
	IAuthService authService;

	public Application()
	{
	}

	@RequestMapping(value = "/", method = RequestMethod.GET)
	public String home()
	{
		try
		{
			authService = new AuthServiceCreator(IAuthService.class.getName()).getService();
		}
		catch(GeppettoInitializationException e)
		{
			// TODO: logging
			e.printStackTrace();
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
