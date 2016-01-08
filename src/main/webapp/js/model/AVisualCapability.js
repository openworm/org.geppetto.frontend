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
 * Client class use to represent an instance object (instantiation of a variable).
 * 
 * @module model/AVisualCapability
 * @author Giovanni Idili
 */

define([ 'jquery' ], function(require) {
	return {
		visible : true,
		selected : false,
		
		/**
		 * Hides the instance or class of instances
		 *
		 * @command AVisualCapability.hide()
		 *
		 */
		hide : function() {
			// TODO: adapt to types / variables
			
			// TODO: FIXME
			// TODO: swap out showAspect for appropriate method
			GEPPETTO.SceneController.hideAspect(this.getInstancePath());
			this.visible = false;

			var message = GEPPETTO.Resources.HIDE_ASPECT + this.getInstancePath();
			return message;
		},
		
		/**
		 * Shows the instance or class of instances
		 *
		 * @command AVisualCapability.show()
		 *
		 */
		show : function() {
			// TODO: adapt to types / variables
			
			// TODO: FIXME
			// TODO: swap out showAspect for appropriate method 
			GEPPETTO.SceneController.showAspect(this.getInstancePath());

			this.visible = true;

			var message = GEPPETTO.Resources.SHOW_ASPECT + this.getInstancePath();
			return message;
		},
		
		/**
		 * Change the opacity of an instance or class of instances
		 *
		 * @command AVisualCapability.setOpacity(opacity)
		 *
		 */
		setOpacity : function(opacity) {
			// TODO: adapt to types / variables
			
			// TODO: FIXME
			GEPPETTO.SceneController.setOpacity(this.getInstancePath(), opacity);
		},
		
		/**
		 * Change the color of an instance or class of instances
		 *
		 * @command AVisualCapability.setColor(color)
		 *
		 */
		setColor : function(color) {
			// TODO: adapt to types / variables
			
			// TODO: FIXME
			GEPPETTO.SceneController.setColor(this.getInstancePath(), color);
		},
		
		/**
		 * Select the instance or class of instances
		 *
		 * @command AVisualCapability.select()
		 *
		 */
		select : function() 
		{
			// TODO: adapt to types / variables
			
			var message;
			if (!this.selected) 
			{
				//first, before doing anything, we check what is currently selected

				if(G.getSelectionOptions().unselected_transparent) 
				{
					//something is already selected, we make everything not selected transparent
					GEPPETTO.SceneController.setGhostEffect(true);
				}

				
				this.selected = true;
				this.get("parent").selected=true;
				GEPPETTO.SceneController.selectAspect(this.getInstancePath());
				message = GEPPETTO.Resources.SELECTING_ASPECT + this.getInstancePath();

				//Behavior: if the parent entity has connections change the opacity of what is not connected
				//Rationale: help exploration of networks by hiding non connected
				if(this.getParent().getConnections().length>0)
				{
					//allOtherMeshes will contain a list of all the non connected entities in the scene for the purpose
					//of changing their opacity
					var allOtherMeshes= $.extend({}, GEPPETTO.getVARS().meshes);
					//look on the simulation selection options and perform necessary
					//operations
					if(G.getSelectionOptions().show_inputs)
					{
						var inputs=this.getParent().showInputConnections(true);
						for(var i in inputs)
						{
							delete allOtherMeshes[inputs[i]];
						}
					}
					if(G.getSelectionOptions().show_outputs)
					{
						var outputs=this.getParent().showOutputConnections(true);
						for(var o in outputs)
						{
							delete allOtherMeshes[outputs[o]];
						}
					}
					if(G.getSelectionOptions().draw_connection_lines)
					{
						this.getParent().showConnectionLines(true);
					}
					if(G.getSelectionOptions().unselected_transparent)
					{
						GEPPETTO.SceneController.ghostEffect(allOtherMeshes,true);	
					}
					
						
				}
				//signal selection has changed in simulation
				GEPPETTO.trigger(Events.Select);
			} else {
				message = GEPPETTO.Resources.ASPECT_ALREADY_SELECTED;
			}

			return message;
		},
		
		/**
		 * Deselects the instance or class of instances
		 *
		 * @command AVisualCapability.deselect()
		 *
		 */
		deselect : function() {
			// TODO: adapt to types / variables
			
			var message;

			if (this.selected) {
				message = GEPPETTO.Resources.DESELECTING_ASPECT
						+ this.instancePath;
				GEPPETTO.SceneController.deselectAspect(this.getInstancePath());
				this.selected = false;

				if(G.getSelectionOptions().unselected_transparent)
				{
					GEPPETTO.SceneController.setGhostEffect(false);
				}
				if(G.getSelectionOptions().show_inputs)
				{
					this.getParent().showInputConnections(false);
				}
				if(G.getSelectionOptions().show_outputs)
				{
					this.getParent().showOutputConnections(false);
				}
				if(G.getSelectionOptions().draw_connection_lines)
				{
					this.getParent().showConnectionLines(false);
				}

				//trigger event that selection has been changed
				GEPPETTO.trigger(Events.Selection);
			} else {
				message = GEPPETTO.Resources.ASPECT_NOT_SELECTED;
			}
			return message;
		},
		
		/**
		 * Zooms to instance or class of instances
		 *
		 * @command AVisualCapability.zoomTo()
		 *
		 */
		 zoomTo : function()
		 {
			// TODO: adapt to types / variables
				
			// TODO: FIXME
			GEPPETTO.SceneController.zoomToMesh(this.getInstancePath());
			return GEPPETTO.Resources.ZOOM_TO_ENTITY + this.getInstancePath();
	     },
	     
		/**
		 * Set the type of geometry to be used for this aspect
		 */
		setGeometryType : function(type, thickness)
		{
			// TODO: adapt to types / variables
			
			// TODO: FIXME
			if(GEPPETTO.SceneController.setGeometryType(this, type, thickness)){
				return "Geometry type successfully changed for " + this.getInstancePath(); 
			}
			else {
				return "Error changing the geometry type for " + this.getInstancePath();
			}
		},
	}
});
