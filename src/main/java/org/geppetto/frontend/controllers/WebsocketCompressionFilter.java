package org.geppetto.frontend.controllers;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

/**
 * Lets a client opt out of WebSocket compression for its own connection.
 *
 * Some WebSocket stacks negotiate the permessage-deflate extension and then
 * fail to inflate what the server sends. Apple's NSURLSession implementation,
 * used by Safari and by every browser on iOS, is the known case: the client
 * receives a frame that decompresses to truncated data and the connection then
 * drops. Browsers offer the extension unconditionally and expose no API to
 * decline it, so a client cannot opt out by itself - only the server can
 * refuse the offer.
 *
 * A client that has detected the fault reconnects with nodeflate=1. This
 * filter then hides the Sec-WebSocket-Extensions request header, so extension
 * negotiation sees no offer and compression is not enabled for that
 * connection. Every other client is untouched and keeps compression.
 *
 * This must run before the container's own WebSocket upgrade filter, which it
 * does when declared in the deployment descriptor: descriptor-declared filters
 * are matched ahead of those the container adds programmatically at startup.
 *
 * Only the request is altered, and only for the one handshake carrying the
 * parameter; nothing is stored and no other request is affected.
 */
public class WebsocketCompressionFilter implements Filter
{

	private static final String NO_DEFLATE_PARAM = "nodeflate";

	private static final String EXTENSIONS_HEADER = "Sec-WebSocket-Extensions";

	@Override
	public void init(FilterConfig filterConfig) throws ServletException
	{
	}

	@Override
	public void destroy()
	{
	}

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException
	{
		if(request instanceof HttpServletRequest && "1".equals(request.getParameter(NO_DEFLATE_PARAM)))
		{
			chain.doFilter(new NoExtensionsRequest((HttpServletRequest) request), response);
			return;
		}
		chain.doFilter(request, response);
	}

	/**
	 * Presents the request with the Sec-WebSocket-Extensions header removed, so
	 * that the container negotiates no extensions for this handshake.
	 */
	private static class NoExtensionsRequest extends HttpServletRequestWrapper
	{

		NoExtensionsRequest(HttpServletRequest request)
		{
			super(request);
		}

		@Override
		public String getHeader(String name)
		{
			if(EXTENSIONS_HEADER.equalsIgnoreCase(name))
			{
				return null;
			}
			return super.getHeader(name);
		}

		@Override
		public Enumeration<String> getHeaders(String name)
		{
			if(EXTENSIONS_HEADER.equalsIgnoreCase(name))
			{
				return Collections.emptyEnumeration();
			}
			return super.getHeaders(name);
		}

		@Override
		public Enumeration<String> getHeaderNames()
		{
			List<String> names = new ArrayList<String>();
			Enumeration<String> original = super.getHeaderNames();
			while(original != null && original.hasMoreElements())
			{
				String name = original.nextElement();
				if(!EXTENSIONS_HEADER.equalsIgnoreCase(name))
				{
					names.add(name);
				}
			}
			return Collections.enumeration(names);
		}

	}

}
