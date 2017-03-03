package org.geppetto.frontend.admin;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
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
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.core.s3.S3Manager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class AdminServlet
{
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
			if(privileges.contains(UserPrivileges.ADMIN))
			{
				return "admin";
			}
		}

		return "redirect:http://www.geppetto.org";
	}

	private boolean hasAdminRights()
	{
		IUser user = geppettoManager.getUser();
		List<UserPrivileges> privileges = user.getUserGroup().getPrivileges();
		if(privileges.contains(UserPrivileges.ADMIN))
		{
			return true;
		}

		return false;
	}

	@RequestMapping(value = "/user/{login}/users/all")
	public @ResponseBody Collection<? extends AdminUserObject> getUsers(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getUserObjects(9999);
			}
		}

		return null;
	}

	@RequestMapping(value = "/user/{login}/users/day")
	public @ResponseBody Collection<? extends AdminUserObject> getUsersByDay(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getUserObjects(1);
			}
		}

		return null;
	}

	@RequestMapping(value = "/user/{login}/users/week")
	public @ResponseBody Collection<? extends AdminUserObject> getUsersByWeek(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getUserObjects(7);
			}
		}

		return null;
	}

	@RequestMapping(value = "/user/{login}/users/month")
	public @ResponseBody Collection<? extends AdminUserObject> getUsersByMonth(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getUserObjects(30);
			}
		}

		return null;
	}

	public Collection<? extends AdminUserObject> getUserObjects(int timeFrame)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		List<? extends IUser> users = null;
		List<AdminUserObject> userObjects = new ArrayList<AdminUserObject>();
		if(dataManager != null)
		{
			users = dataManager.getAllUsers();

		}

		AdminUserObject userObject;
		List<? extends IGeppettoProject> projects;
		for(IUser user : users)
		{
			int projectsSize = 0;
			int experiments = 0;
			userObject = new AdminUserObject();
			if(user.getGeppettoProjects() != null)
			{
				projects = user.getGeppettoProjects();
				for(IGeppettoProject p : projects)
				{
					experiments += p.getExperiments().size();
				}
				projectsSize = projects.size();
			}
			userObject.setLogin(user.getLogin());
			userObject.setProjects(projectsSize);
			userObject.setExperiments(experiments);
			userObject.setName(user.getName());
			userObject.setLoginCount(user.getLoginTimeStamps().size());

			long days = -1;
			List<Date> timeStamps = user.getLoginTimeStamps();
			Date lastLogin = null;
			if(timeStamps.size() > 0)
			{
				lastLogin = timeStamps.get(timeStamps.size() - 1);
			}
			if(lastLogin != null)
			{
				days = this.daysAgo(lastLogin, new Date());
			}

			if(days > 0)
			{
				userObject.setLastLogin(String.valueOf(days) + " day(s) ago");
			}
			else if(days == 0)
			{
				userObject.setLastLogin("Today");
			}
			else if(days == -1)
			{
				userObject.setLastLogin("Unknown");
			}

			if(days != -1)
			{
				if(days <= timeFrame)
				{
					userObject.setStorage("Show Size");
					userObjects.add(userObject);
				}
			}
			else
			{
				if(timeFrame > 30)
				{
					userObject.setStorage("Show Size");
					userObjects.add(userObject);
				}
			}

		}

		return userObjects;
	}

	@RequestMapping(value = "/user/{login}/simulations/all")
	public @ResponseBody Collection<? extends AdminSimulationObject> getSimulations(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getSimulationObjects(99999);
			}
		}

		return null;
	}

	@RequestMapping(value = "/user/{login}/simulations/day")
	public @ResponseBody Collection<? extends AdminSimulationObject> getSimulationsByDay(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getSimulationObjects(1);
			}
		}

		return null;
	}

	@RequestMapping(value = "/user/{login}/simulations/week")
	public @ResponseBody Collection<? extends AdminSimulationObject> getSimulationsByWeek(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getSimulationObjects(7);
			}
		}

		return null;
	}

	@RequestMapping(value = "/user/{login}/simulations/month")
	public @ResponseBody Collection<? extends AdminSimulationObject> getSimulationsByMonth(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getSimulationObjects(30);
			}
		}

		return null;
	}

	public Collection<? extends AdminSimulationObject> getSimulationObjects(int timeFrame)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		Collection<? extends IUser> users = null;
		List<AdminSimulationObject> simulationObjects = new ArrayList<AdminSimulationObject>();
		if(dataManager != null)
		{
			users = dataManager.getAllUsers();
			List<? extends IGeppettoProject> projects;
			List<? extends IExperiment> experiments;
			String simulator;
			for(IUser user : users)
			{
				projects = user.getGeppettoProjects();
				for(IGeppettoProject p : projects)
				{
					experiments = p.getExperiments();
					for(IExperiment e : experiments)
					{
						if(!e.getStatus().equals(ExperimentStatus.DESIGN) && e.getAspectConfigurations().size() > 0)
						{

							AdminSimulationObject simulation = new AdminSimulationObject();
							simulation.setName(user.getName());
							simulation.setExperiment(e.getName());
							simulation.setLogin(user.getLogin());
							long numericalDate = e.getLastModified().getTime();
							simulation.setExperimentLastRun(numericalDate);
							simulation.setStatus(e.getStatus().toString());
							simulation.setError(e.getDetails());
							simulation.setProject(p.getName());

							long days = this.daysAgo(e.getEndDate(), new Date());

							if(days <= timeFrame || (days == -1 && timeFrame > 30))
							{
								simulationObjects.add(simulation);

								if(e.getAspectConfigurations().get(0).getSimulatorConfiguration() != null)
								{
									simulator = e.getAspectConfigurations().get(0).getSimulatorConfiguration().getSimulatorId();
									simulation.setSimulator(simulator);
								}
							}

						}
					}
				}
			}

		}
		return simulationObjects;

	}

	@RequestMapping(value = "/user/{login}/storage/{user}")
	private @ResponseBody String getStorageSize(@PathVariable("login") String login, @PathVariable("user") String user)
	{
		Subject currentUser = SecurityUtils.getSubject();
		long totalSize = 0;
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
			Collection<? extends IUser> users = null;
			if(dataManager != null)
			{
				users = dataManager.getAllUsers();
				for(IUser u : users)
				{
					if(u.getLogin().equals(user))
					{
						if(u.getGeppettoProjects() != null)
						{
							List<? extends IGeppettoProject> projects = u.getGeppettoProjects();
							for(IGeppettoProject p : projects)
							{
								totalSize += S3Manager.getInstance().getFileStorage("projects/" + p.getId() + "/");
							}
						}
					}
				}
			}
		}

		return calculateStorage(totalSize);
	}
	
	@RequestMapping(value = "/user/{login}/storage/{user}/{simulationId}")
	private @ResponseBody String getStorageSizeSimulation(@PathVariable("login") String login, @PathVariable("user") String user, 
			@PathVariable("simulationId") String simulationId)
	{
		Subject currentUser = SecurityUtils.getSubject();
		long totalSize = 0;
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
			Collection<? extends IUser> users = null;
			if(dataManager != null)
			{
				users = dataManager.getAllUsers();
				for(IUser u : users)
				{
					if(u.getLogin().equals(user))
					{
						if(u.getGeppettoProjects() != null)
						{
							List<? extends IGeppettoProject> projects = u.getGeppettoProjects();
							for(IGeppettoProject p : projects)
							{
								totalSize += S3Manager.getInstance().getFileStorage("projects/" + p.getId() + "/");
							}
						}
					}
				}
			}
		}

		return calculateStorage(totalSize);
	}

	private String calculateStorage(long size)
	{

		String storageUnit = " KB";
		double formattedSize = 0;
		formattedSize = size / 1024;
		if(formattedSize > 1000)
		{
			formattedSize = formattedSize / 1024;
			storageUnit = " MB";
		}
		else if(formattedSize > 1000000)
		{
			formattedSize = formattedSize / 1024 / 104;
			storageUnit = " GB";
		}

		return String.format("%.2f", formattedSize) + storageUnit;
	}

	@RequestMapping(value = "/user/{login}/errors/all")
	public @ResponseBody Collection<? extends AdminErrorObject> getErrors(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getErrorObjects(9999);
			}
		}

		return null;
	}

	@RequestMapping(value = "/user/{login}/errors/day")
	public @ResponseBody Collection<? extends AdminErrorObject> getErrorsByDay(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getErrorObjects(1);
			}
		}

		return null;
	}

	@RequestMapping(value = "/user/{login}/errors/week")
	public @ResponseBody Collection<? extends AdminErrorObject> getErrorsByWeek(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getErrorObjects(7);
			}
		}

		return null;
	}

	@RequestMapping(value = "/user/{login}/errors/month")
	public @ResponseBody Collection<? extends AdminErrorObject> getErrorsByMonth(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			if(this.hasAdminRights())
			{
				return this.getErrorObjects(30);
			}
		}

		return null;
	}

	public Collection<? extends AdminErrorObject> getErrorObjects(int timeFrame)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		Collection<? extends IUser> users = null;
		List<AdminErrorObject> errorObjects = new ArrayList<AdminErrorObject>();
		if(dataManager != null)
		{
			users = dataManager.getAllUsers();
			List<? extends IGeppettoProject> projects;
			List<? extends IExperiment> experiments;
			for(IUser user : users)
			{
				projects = user.getGeppettoProjects();
				for(IGeppettoProject p : projects)
				{
					experiments = p.getExperiments();
					for(IExperiment e : experiments)
					{
						if(e.getStatus() == ExperimentStatus.ERROR)
						{
							AdminErrorObject error = new AdminErrorObject();
							error.setName(user.getName());
							error.setExperiment(e.getName());
							error.setLogin(user.getLogin());
							error.setError(e.getDetails());
							error.setProject(p.getName());
							error.setSimulator(e.getAspectConfigurations().get(0).getSimulatorConfiguration().getSimulatorId());
							long days = this.daysAgo(e.getEndDate(), new Date());

							if(days <= timeFrame)
							{
								errorObjects.add(error);
							}
						}
					}
				}
			}
		}
		return errorObjects;
	}

	/**
	 * @param startDate
	 * @param endDate
	 * @return
	 */
	public long daysAgo(Date startDate, Date endDate)
	{
		long elapsedDays = -1;
		if(startDate != null && endDate != null)
		{
			long different = endDate.getTime() - startDate.getTime();
			long secondsInMilli = 1000;
			long minutesInMilli = secondsInMilli * 60;
			long hoursInMilli = minutesInMilli * 60;
			long daysInMilli = hoursInMilli * 24;

			elapsedDays = different / daysInMilli;

		}

		return elapsedDays;

	}
}
