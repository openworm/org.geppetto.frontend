
package org.geppetto.frontend.controllers;

import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.SimpleAccount;
import org.apache.shiro.realm.AuthenticatingRealm;
import org.apache.shiro.subject.SimplePrincipalCollection;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.IUser;

public class GeppettoRealm extends AuthenticatingRealm
{

	@Override
	protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		if(dataManager != null)
		{
			IUser user = dataManager.getUserByLogin((String) token.getPrincipal());
			SimplePrincipalCollection principals = new SimplePrincipalCollection(user, getName());
			SimpleAccount info = new SimpleAccount(principals, user.getPassword());
			return info;
		}
		return null;
	}

}
