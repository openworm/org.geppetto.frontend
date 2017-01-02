package org.geppetto.frontend.controllers;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.ExperimentStatus;
import org.geppetto.core.data.model.IExperiment;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.data.model.IUser;
import org.geppetto.core.data.model.UserPrivileges;
import org.geppetto.core.data.model.local.LocalGeppettoProject;
import org.geppetto.core.data.model.local.LocalUser;
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.frontend.controllers.objects.AdminErrorObject;
import org.geppetto.frontend.controllers.objects.AdminSimulationObject;
import org.geppetto.frontend.controllers.objects.AdminUserObject;
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
	public String admin() throws GeppettoInitializationException
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			IUser user = geppettoManager.getUser();
			List<UserPrivileges> privileges = user.getUserGroup().getPrivileges();
			if(privileges.contains(UserPrivileges.ADMIN)){
				return "dist/admin";
			}
		}
		
		return "redirect:http://www.geppetto.org";
	}
	
	@RequestMapping(value = "/user/{login}/users")
	public @ResponseBody Collection<? extends AdminUserObject> getUsers(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
			List<? extends IUser> users = null;
			List<AdminUserObject> userObjects = new ArrayList<AdminUserObject>();
			if(dataManager != null)
			{
				users =  dataManager.getAllUsers();
				
			}
			
			AdminUserObject userObject;
			List<? extends IGeppettoProject> projects;
			for(IUser user: users){
				int projectsSize = 0;
				int experiments = 0;
				userObject = new AdminUserObject();
				if(user.getGeppettoProjects() !=null){
					projects = user.getGeppettoProjects();
					for(IGeppettoProject p : projects){
						experiments = p.getExperiments().size();
					}
					projectsSize = projects.size();
				}
				userObject.setLogin(user.getLogin());
				userObject.setProjects(projectsSize);
				userObject.setExperiments(experiments);
				userObject.setName(user.getName());
				userObject.setLastLogin(user.getLastLogin());
				userObject.setStorage("512kb");
				userObjects.add(userObject);
			}
			
			Collections.sort(userObjects, new Comparator<AdminUserObject>() {

				@Override
				public int compare(AdminUserObject o1, AdminUserObject o2) {
					return o1.getLastLogin().compareTo(o2.getLastLogin());
				}
			});
			return userObjects;
		}
				
		return null;
	}

	@RequestMapping(value = "/user/{login}/simulations")
	public @ResponseBody Collection<? extends AdminSimulationObject> getSimulations(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
			Collection<? extends IUser> users = null;
			List<AdminSimulationObject> simulationObjects = new ArrayList<AdminSimulationObject>();
			if(dataManager != null)
			{
				users =  dataManager.getAllUsers();
				List<? extends IGeppettoProject> projects;
				List<? extends IExperiment> experiments;
				String totalExperimentsAndSimulators = "";
				String simulator;
				for(IUser user: users){
					projects = user.getGeppettoProjects();
					for(IGeppettoProject p : projects){
						experiments = p.getExperiments();
						for(IExperiment e : experiments){
							if(e.getLastRan()!=null){
								AdminSimulationObject simulation = new AdminSimulationObject();
								simulation.setName(user.getName());
								simulation.setExperiment(e.getName());
								simulation.setLogin(user.getLogin());
								simulation.setExperimentLastRun(e.getLastModified().toString());
								simulation.setStorage("512kb");
								simulator = e.getAspectConfigurations().get(0).getSimulatorConfiguration().getSimulatorId();
								simulation.setSimulator(simulator);
								simulationObjects.add(simulation);								
							}
							totalExperimentsAndSimulators+= e.getName() + " --- " + simulator + System.lineSeparator();
						}
					}
					
					for(AdminSimulationObject object : simulationObjects){
						object.setExperimentsAndSimulators(totalExperimentsAndSimulators);
					}
					
					totalExperimentsAndSimulators = "";
				}
			}
			return simulationObjects;
		}
				
		return null;
	}
	
	@RequestMapping(value = "/user/{login}/errors")
	public @ResponseBody Collection<? extends AdminErrorObject> getErrors(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
			Collection<? extends IUser> users = null;
			List<AdminErrorObject> errorObjects = new ArrayList<AdminErrorObject>();
			if(dataManager != null)
			{
				users =  dataManager.getAllUsers();
				List<? extends IGeppettoProject> projects;
				List<? extends IExperiment> experiments;
				for(IUser user: users){
					projects = user.getGeppettoProjects();
					for(IGeppettoProject p : projects){
						experiments = p.getExperiments();
						for(IExperiment e : experiments){
							if(e.getStatus() == ExperimentStatus.ERROR){
								AdminErrorObject error = new AdminErrorObject();
								error.setName(user.getName());
								error.setExperiment(e.getName());
								error.setLogin(user.getLogin());
								error.setError(e.getDetails());
								error.setSimulator(e.getAspectConfigurations().get(0).getSimulatorConfiguration().getSimulatorId());
								errorObjects.add(error);
							}
						}
					}
				}
			}
			return errorObjects;
		}
				
		return null;
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
