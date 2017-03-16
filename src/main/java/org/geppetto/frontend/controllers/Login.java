
package org.geppetto.frontend.controllers;

import java.io.IOException;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

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
				IUser user = (IUser) currentUser.getPrincipal();
				user.addLoginTimeStamp(new Date());
				DataManagerHelper.getDataManager().saveEntity(user);
				geppettoManager.setUser(user);
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