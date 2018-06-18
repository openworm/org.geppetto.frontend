package org.geppetto.frontend.controllers;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.websocket.server.ServerEndpoint;

import org.geppetto.frontend.controllers.WebsocketConnection;
import org.springframework.beans.factory.annotation.Configurable;

/**
 * Simple Hello servlet.
 */
@Configurable
public final class GeppettoServlet extends HttpServlet {    
	public GeppettoServlet() {
		System.out.println("Servlet has started");
	}
	
	   public void init() throws ServletException {
		   System.out.println("Servlet init has started");
		//new WebsocketConnection();
	   }

	   public void doGet(HttpServletRequest request, HttpServletResponse response)
	      throws ServletException, IOException {
	   }

	   public void destroy() {
	      // do nothing.
	   }
} 