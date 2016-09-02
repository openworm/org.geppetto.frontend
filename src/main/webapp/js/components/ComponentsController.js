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
 * Controller responsible for managing actions fired by components
 */
define(function (require) {
	return function (GEPPETTO) {
		GEPPETTO.ComponentsController =
		{
				componentsMap : {},
				projectPersisted : false,
				writePermission : GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT),
				login : GEPPETTO.UserController.isLogin(),
				initialized : false,

				executeAction: function (action) {
					eval(action);
				},

				/**
				 * Returns true if user has permission to write and project is persisted
				 */
				permissions : function(){
					var visible = true;
					this.projectPersisted = window.Project.persisted;
					if(!this.writePermission || !this.projectPersisted || !this.login){
						visible = false;
					}

					return visible
				},

				//Responds to GEPPETTO.Events changes and handle React components needed
				//as caused of these changes in events
				addEventDispatcher : function(type,component){
					var self = this;
					if (type == 'SAVECONTROL'){
						this.componentsMap[type] = component;
						GEPPETTO.on(Events.Volatile_project_loaded, function(){
							component.setState({disableSave:!self.writePermission});
						});
					}
					else if (type == 'SPOTLIGHT'){
						this.componentsMap[type] = component;
						GEPPETTO.on(Events.Project_loaded, function () {
							//Hides or Shows tool bar depending on login user permissions
							component.updateToolBarVisibilityState(self.permissions());
						});

						GEPPETTO.on(Events.Project_persisted, function () {
							//Hides or Shows tool bar depending on login user permissions
							component.updateToolBarVisibilityState(self.permissions());
						});
					}
					else if (type == 'EXPERIMENTSTABLE'){
						this.componentsMap[type] = component;
						GEPPETTO.on(Events.Project_loaded, function () {
							var visible = self.permissions();
							component.updateNewExperimentState(visible);
							component.updateIconsStatus(self.login, visible);
						});

						GEPPETTO.on(Events.Project_persisted, function () {
							var visible = self.permissions();
							component.updateNewExperimentState(visible);
							component.updateIconsStatus(self.login, visible);
						});
					}
				},
		}
	}
})
;