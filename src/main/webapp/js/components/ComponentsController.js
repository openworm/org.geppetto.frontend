
/**
 * Controller responsible for managing actions fired by components
 */
define(function (require) {

	return function (GEPPETTO) {
		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		//MATTEO: I am removing this, don't add anything to this file
		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		GEPPETTO.ComponentsController =
		{
				componentsMap : {},
				initialized : false,

				executeAction: function (action) {
					eval(action);
				},

				/**
				 * Returns true if user has permission to write and project is persisted
				 */
				permissions : function(){
					var visible = true;
					if(!GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT) || !window.Project.persisted || !GEPPETTO.UserController.isLoggedIn()){
						visible = false;
					}

					return visible
				}
			
		}
	}
})
;
