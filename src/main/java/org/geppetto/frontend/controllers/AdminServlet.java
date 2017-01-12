package org.geppetto.frontend.controllers;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
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
	private final static String DAYS_AGO = " day(s) ago";
	private final static String TODAY = "Today";
	
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
	
	@RequestMapping(value = "/user/{login}/users/all")
	public @ResponseBody Collection<? extends AdminUserObject> getUsers(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getUserObjects(9999);
		}
				
		return null;
	}
	
	@RequestMapping(value = "/user/{login}/users/day")
	public @ResponseBody Collection<? extends AdminUserObject> getUsersByDay(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getUserObjects(1);
		}
				
		return null;
	}
	
	@RequestMapping(value = "/user/{login}/users/week")
	public @ResponseBody Collection<? extends AdminUserObject> getUsersByWeek(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getUserObjects(7);
		}
				
		return null;
	}
	
	@RequestMapping(value = "/user/{login}/users/month")
	public @ResponseBody Collection<? extends AdminUserObject> getUsersByMonth(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getUserObjects(30);
		}
				
		return null;
	}
	
	public Collection<? extends AdminUserObject>  getUserObjects(int timeFrame){
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
			long totalSize = 0;
			userObject = new AdminUserObject();
			if(user.getGeppettoProjects() !=null){
				projects = user.getGeppettoProjects();
				for(IGeppettoProject p : projects){
					totalSize  += S3Manager.getInstance().getFileStorage("projects/"+p.getId()+"/");
					experiments += p.getExperiments().size();
				}
				projectsSize = projects.size();
			}
			userObject.setLogin(user.getLogin());
			userObject.setProjects(projectsSize);
			userObject.setExperiments(experiments);
			userObject.setName(user.getName());
			userObject.setLoginCount(user.loginCount());
			
			SimpleDateFormat formatDate = new SimpleDateFormat("EE MMM dd HH:mm:ss z yyyy");
			
			long days =0;
			try {
				days = this.daysAgo(formatDate.parse(user.getLastLogin()), new Date());
			} catch (ParseException e) {
				
			}
			if(days >0){
				userObject.setLastLogin(String.valueOf(days) + " day(s) ago");
			}else{
				userObject.setLastLogin("Today");
			}
			userObject.setStorage(getStorageSize(totalSize));
			if(days<=timeFrame){
				userObjects.add(userObject);
			}
		}
		
		Collections.sort(userObjects, new Comparator<AdminUserObject>() {

			@Override
			public int compare(AdminUserObject o1, AdminUserObject o2) {
				Integer date =null, date2 = null;
				
				String days1 = o1.getLastLogin().replace(DAYS_AGO, "");
				if(days1.contains(TODAY)){
					date = 0;
				}else{
					date = Integer.valueOf(days1);
					
				}
				
				String days2 = o2.getLastLogin().replace(DAYS_AGO, "");
				if(days2.contains(TODAY)){
					date2 = 0;
				}else{
					date2 = Integer.valueOf(days2);
					
				}

				return date.compareTo(date2);
			}
		});
		return userObjects;
	}

	@RequestMapping(value = "/user/{login}/simulations/all")
	public @ResponseBody Collection<? extends AdminSimulationObject> getSimulations(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getSimulationObjects(99999);
		}
				
		return null;
	}
	
	@RequestMapping(value = "/user/{login}/simulations/day")
	public @ResponseBody Collection<? extends AdminSimulationObject> getSimulationsByDay(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getSimulationObjects(1);
		}
				
		return null;
	}
	
	@RequestMapping(value = "/user/{login}/simulations/week")
	public @ResponseBody Collection<? extends AdminSimulationObject> getSimulationsByWeek(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getSimulationObjects(7);
		}
				
		return null;
	}
	
	@RequestMapping(value = "/user/{login}/simulations/month")
	public @ResponseBody Collection<? extends AdminSimulationObject> getSimulationsByMonth(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getSimulationObjects(30);
		}
				
		return null;
	}
	
	public Collection<? extends AdminSimulationObject> getSimulationObjects(int timeFrame){
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		Collection<? extends IUser> users = null;
		List<AdminSimulationObject> simulationObjects = new ArrayList<AdminSimulationObject>();
		if(dataManager != null)
		{
			users =  dataManager.getAllUsers();
			List<? extends IGeppettoProject> projects;
			List<? extends IExperiment> experiments;
			String totalExperiments = "";
			String totalSimulators = "";
			String simulator;
			for(IUser user: users){
				long totalSize = 0;
				projects = user.getGeppettoProjects();
				for(IGeppettoProject p : projects){
					totalSize  += S3Manager.getInstance().getFileStorage("projects/"+p.getId()+"/");
					experiments = p.getExperiments();
					for(IExperiment e : experiments){
						simulator = e.getAspectConfigurations().get(0).getSimulatorConfiguration().getSimulatorId();
						if(e.getLastRan()!=null){
							AdminSimulationObject simulation = new AdminSimulationObject();
							simulation.setName(user.getName());
							simulation.setExperiment(e.getName());
							simulation.setLogin(user.getLogin());
							simulation.setExperimentLastRun(e.getLastModified().toString());
							simulation.setSimulator(simulator);
							simulation.setStatus(e.getStatus().toString());
							simulation.setStorage(getStorageSize(totalSize));
							
							long days = this.daysAgo(e.getLastRan(), new Date());
							
							if(days<=timeFrame){
								simulationObjects.add(simulation);								
							}
						}
						totalExperiments+= e.getName()+'\n';
						totalSimulators+= simulator+'\n';
					}
				}

				for(AdminSimulationObject object : simulationObjects){
					object.setExperiments(totalExperiments);
					object.setSimulators(totalSimulators);
				}
				totalExperiments = "";
				totalSimulators="";
			}
		}
		return simulationObjects;
	}
	
	private String getStorageSize(long size){
		String storageUnit=" KB";
		double formattedSize =0;
		formattedSize = size/1024;
		if(formattedSize>1000){
			formattedSize = formattedSize/1024;
			storageUnit=" MB";
		}else if(formattedSize>1000000){
			formattedSize = formattedSize/1024/104;
			storageUnit=" GB";
		}
		
		return String.format( "%.2f", formattedSize )+storageUnit;
	}
	
	@RequestMapping(value = "/user/{login}/errors/all")
	public @ResponseBody Collection<? extends AdminErrorObject> getErrors(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getErroObjects(9999);
		}
				
		return null;
	}
	
	@RequestMapping(value = "/user/{login}/errors/day")
	public @ResponseBody Collection<? extends AdminErrorObject> getErrorsByDay(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getErroObjects(1);
		}
				
		return null;
	}
	
	@RequestMapping(value = "/user/{login}/errors/week")
	public @ResponseBody Collection<? extends AdminErrorObject> getErrorsByWeek(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getErroObjects(7);
		}
				
		return null;
	}
	
	@RequestMapping(value = "/user/{login}/errors/month")
	public @ResponseBody Collection<? extends AdminErrorObject> getErrorsByMonth(@PathVariable("login") String login)
	{
		Subject currentUser = SecurityUtils.getSubject();
		if(geppettoManager.getUser() != null && currentUser.isAuthenticated())
		{
			return this.getErroObjects(30);
		}
				
		return null;
	}
	
	public Collection<? extends AdminErrorObject> getErroObjects(int timeFrame){
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
							long days = this.daysAgo(e.getLastRan(), new Date());
							
							if(days<=timeFrame){
								errorObjects.add(error);
							}
						}
					}
				}
			}
		}
		return errorObjects;
	}
	
    public long daysAgo(Date startDate, Date endDate){

		long different = endDate.getTime() - startDate.getTime();
		long secondsInMilli = 1000;
		long minutesInMilli = secondsInMilli * 60;
		long hoursInMilli = minutesInMilli * 60;
		long daysInMilli = hoursInMilli * 24;

		long elapsedDays = different / daysInMilli;

		return elapsedDays;

	}
}
