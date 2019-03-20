package org.geppetto.frontend.controllers;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.Scanner;

import javax.servlet.ServletContext;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.geppetto.core.auth.IAuthService;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.DefaultGeppettoDataManager;
import org.geppetto.core.data.model.IUser;
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.core.utilities.URLReader;
import org.geppetto.frontend.tests.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

@Controller
public class Application
{
	@Autowired
	private IGeppettoManager geppettoManager;

	private static Log logger = LogFactory.getLog(Application.class);

	private String getGeppetto(HttpServletRequest req, String page){
		try
		{
			IAuthService authService = AuthServiceCreator.getService();
			boolean auth = false;

			if(authService.isDefault())
			{
				// Default no persistence, no users
				auth = true;
				if(geppettoManager.getUser() == null)
				{
					try
					{
						IUser user = DefaultGeppettoDataManager.getGuestUser();
						logger.info("There is no user set for this geppettoManager, one was created: " + user);
						geppettoManager.setUser(user);
					}
					catch(GeppettoExecutionException e)
					{
						logger.error(e);
					}
				}
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
				// This is with any other authentication system from another web application.
				// since sharing the scope session across the different web application bundles
				// is more complex than expected (if possible at all) we are using cookies
				if (req.getCookies() != null) {
				    for(Cookie c : req.getCookies())
					{
					    if(c.getName().equals(authService.getSessionId()))
						{
						    auth = authService.isAuthenticated(c.getValue());
						    break;
						}
					}
				}
			}
			if(auth)
			{
				return "geppetto";
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

	@RequestMapping(value = "/geppetto", method = RequestMethod.GET)
	public String geppetto(HttpServletRequest req, Model model)
	{
		return getGeppetto(req, "");
	}

	@RequestMapping(value = "/**", method = RequestMethod.GET)
	public String geppettoExtension(HttpServletRequest req, Model model)
	{
		String path = "/build/static" + req.getServletPath() + ".html";
		if (Application.class.getResource(path) != null){
			InputStream content = Application.class.getResourceAsStream(path);
			model.addAttribute("content", new String(new Scanner(content, "UTF-8").useDelimiter("\\A").next()));
		}
		return getGeppetto(req, "");
	}
	
	@RequestMapping(value = "/geppettotestingprojects", method = RequestMethod.GET)
	public @ResponseBody Test getTestingProjects(@RequestParam String url) throws IOException
	{
		URL resource = URLReader.getURL(url);
		BufferedReader reader = new BufferedReader(new InputStreamReader(resource.openStream()));
		return new Gson().fromJson(reader, Test.class);
	}

	@RequestMapping(value = "/", method = RequestMethod.GET)
	public String root(HttpServletRequest request, HttpServletResponse response)
	{
		JsonParser parser = new JsonParser();
		HttpSession session = request.getSession();
		ServletContext sc = session.getServletContext();
		try {
			String s = sc.getRealPath("/");
			JsonObject obj = (JsonObject) parser.parse(new FileReader(s+"/GeppettoConfiguration.json"));

			JsonElement rootRedirectElement =  obj.get("rootRedirect");
			String rootRedirect =rootRedirectElement.toString().replace("\"", "");

			//if not redirect is specified in GeppettoConfiguration.json then redirect to dashboard by default
			if(rootRedirect == null || rootRedirect.isEmpty()){
				rootRedirect="dashboard";
			}else if(!rootRedirect.equals("dashboard")){
				rootRedirect= "redirect:" + rootRedirect;
			}
			
			return rootRedirect;
		} catch (Exception e) {
			logger.error("Can't redirect using rootURL from GeppettoConfiguration.json");
		}

		return "dashboard";
	}
}
