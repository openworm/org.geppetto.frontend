

package org.geppetto.frontend.controllers;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;
import org.springframework.beans.factory.annotation.Configurable;

@Configurable
public class GeppettoServlet extends WebSocketServlet
{

	/**
	 *
	 */
	private static final long serialVersionUID = 1L;
	
	
	@Override
	protected StreamInbound createWebSocketInbound(String subProtocol, HttpServletRequest request)
	{
		return new WebsocketConnection();
	}

	@Override
	public void init() throws ServletException
	{
		super.init();	
	}
}
