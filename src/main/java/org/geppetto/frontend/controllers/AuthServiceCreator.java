package org.geppetto.frontend.controllers;

import org.geppetto.core.auth.IAuthService;
import org.geppetto.core.common.GeppettoInitializationException;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.InvalidSyntaxException;
import org.osgi.framework.ServiceReference;

public class AuthServiceCreator
{

	private static BundleContext bc = FrameworkUtil.getBundle(AuthServiceCreator.class).getBundleContext();

	private static IAuthService instance = null;

	/**
	 * A method to get a service of a given type.
	 * 
	 * @param type
	 * @return
	 * @throws InvalidSyntaxException
	 */
	public static IAuthService getService() throws GeppettoInitializationException
	{
		if(instance == null)
		{
			ServiceReference<?>[] sr;
			try
			{
				sr = bc.getServiceReferences(IAuthService.class.getName(), null);
			}
			catch(InvalidSyntaxException e)
			{
				throw new GeppettoInitializationException(e);
			}
			if(sr != null && sr.length > 0)
			{
				instance = (IAuthService) bc.getService(sr[0]);
				for(ServiceReference<?> s : sr)
				{
					if(!((IAuthService) bc.getService(s)).isDefault())
					{
						instance = (IAuthService) bc.getService(s);
					}
				}
			}
		}
		return instance;
	}

}
