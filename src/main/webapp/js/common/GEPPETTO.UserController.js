
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

            setDropboxToken : function(token) {
                this.dropboxToken = token;
            },

            getDropboxToken : function() {
                return this.dropboxToken;
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
            },


            hasWritePermissions : function(){
                var hasPermission = false;

                if(
                    this.isLoggedIn() &&
                    this.hasPermission(GEPPETTO.Resources.WRITE_PROJECT) &&
                    window.Project != undefined &&
                    window.Project.persisted
                ){
                    hasPermission = true;
                }

                return hasPermission;
            },

            canUserEditExperiment: function(){
                var hasPermission = false;

                if(
                    this.isLoggedIn() &&
                    this.hasPermission(GEPPETTO.Resources.WRITE_PROJECT) &&
                    window.Project != undefined &&
                    window.Project.persisted &&
                    window.Project.getActiveExperiment() != null &&
                    window.Project.getActiveExperiment() != undefined &&
                    window.Project.getActiveExperiment().getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN
                ){
                    hasPermission = true;
                }

                return hasPermission;
            }
        };

    };
});
