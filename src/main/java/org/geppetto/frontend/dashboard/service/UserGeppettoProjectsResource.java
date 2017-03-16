package org.geppetto.frontend.dashboard.service;

import java.util.Collection;

import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.manager.IGeppettoManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class UserGeppettoProjectsResource
{
	@Autowired
	private IGeppettoManager geppettoManager;

	@RequestMapping("/user/{login}/geppettoprojects")
	public @ResponseBody
	Collection<? extends IGeppettoProject> getGeppettoProjects(@PathVariable("login") String login)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			return dataManager.getGeppettoProjectsForUser(login);
		}
		return null;
	}
}
