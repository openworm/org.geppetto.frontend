/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/
/**
 * Keeps track of privileges login user has
 *
 */
define(function(require)
{

    return function(GEPPETTO)
    {
        GEPPETTO.UserController =
        {
        	userName : null,
            privileges : null,
            loggedIn : false,
            persistence : false,
            
            setUserPrivileges : function(userPrivileges){
            	this.userName = userPrivileges.userName;
            	this.persistence = userPrivileges.hasPersistence;
            	this.loggedIn = userPrivileges.loggedIn;
            	
            	this.privileges = $.map(userPrivileges.privileges, function(value, index) {
            	    return [value];
            	});
            },
            
            getUserPrivileges : function(){
            	return this.privileges;
            },
            
            getUserName : function(){
            	return this.userName;
            },
            
            isLoggedIn : function(){
            	return this.loggedIn;
            },

            hasPersistence : function(){
            	return this.persistence;
            },
            
            hasPermission : function(privilege){
            	if(this.privileges!=null || undefined){
            		if(this.privileges.indexOf(privilege)>-1){
            			return true;
            		}
            	}
            	
            	return false;
            }
        };

    };
});
