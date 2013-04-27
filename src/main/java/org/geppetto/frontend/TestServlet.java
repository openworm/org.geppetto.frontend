package org.geppetto.frontend;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.geppetto.core.model.IModelInterpreter;
import org.geppetto.core.simulator.ISimulator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.InvalidSyntaxException;
import org.osgi.framework.ServiceReference;

/**
 * Servlet used to test service wiring.
 * NOTE: this is throw-away code
 */
public class TestServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	BundleContext _bc = FrameworkUtil.getBundle(this.getClass()).getBundleContext();
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {

			String interpreterDiscoveryID = "sphModelInterpreter";
			String simulatorDiscoveryID = "sphSimulator";
			IModelInterpreter modelInterpreter = this.<IModelInterpreter>getService(interpreterDiscoveryID, IModelInterpreter.class.getName());
			ISimulator simulator = this.<ISimulator>getService(simulatorDiscoveryID, ISimulator.class.getName());
			
			if(modelInterpreter == null){
				response.getWriter().println("modelInterpreter is null");
			}
			else{
				response.getWriter().println("modelInterpreter found: " + modelInterpreter.toString());
			}
			
			if(simulator == null){
				response.getWriter().println("simulator is null");
			}
			else{
				response.getWriter().println("simulator found: " + modelInterpreter.toString());
			}
		} catch (Exception e) {
			response.getWriter().println("error: " + e.getMessage());
		} 
	}
	
	/*
	 * A generic routine to encapsulate boiler-plate code for dynamic service discovery
	 */
	private <T> T getService(String discoveryId, String type) throws InvalidSyntaxException{
		T service = null;
		
		String filter = String.format("(discoverableID=%s)", discoveryId);
		ServiceReference[] sr  =  _bc.getServiceReferences(type, filter);
		if(sr != null && sr.length > 0)
		{
			service = (T) _bc.getService(sr[0]);
		}
		
		return service;
	}
}
