package org.openworm.simulationengine.frontend;

import java.io.IOException;
import java.lang.reflect.Type;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.openworm.simulationengine.core.model.IModelInterpreter;
import org.openworm.simulationengine.core.simulator.ISimulator;
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

			String discoveryID = "sphModelInterpreter";
			IModelInterpreter modelInterpreter = this.<IModelInterpreter>getService(discoveryID, IModelInterpreter.class.getName());
			
			if(modelInterpreter == null){
				response.getWriter().println("modelInterpreter is null");
			}
			else{
				response.getWriter().println("modelInterpreter found: " + modelInterpreter.toString());
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
