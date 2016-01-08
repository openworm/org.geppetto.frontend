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
 * Client class use to augment a model with connection capabilities
 * 
 * @module model/AConnectionCapability
 * @author Matteo Cantarelli
 */

define([ 'jquery' ], function(require) {
	return {
		
		/**
		 * Show input connections for this entity
		 * @command EntityNode.showInputConnections()
		 * @param {boolean} mode- Show/hide input connections for this entity
		 */
		showInputConnections : function(mode){
			if(mode == null || mode == undefined){
				return GEPPETTO.Resources.MISSING_PARAMETER;
			}
			
			if(this.selected == false && (mode)){
				this.select();
			}
			var paths = new Array();
			//match all aspect paths that are connected to this entity
			for(var c in this.getConnections()){
				var connection = this.getConnections()[c];
				
				if(connection.getType() == GEPPETTO.Resources.INPUT_CONNECTION){
					var entity = 
						GEPPETTO.Utility.deepFind(connection.getEntityInstancePath());
					
					paths = paths.concat(this.getAspectPaths(entity));
				}
			}
			
			//show/hide connections
			if(mode){
				GEPPETTO.SceneController.showConnections(paths,GEPPETTO.Resources.INPUT_CONNECTION);
			}
			else{
				GEPPETTO.SceneController.hideConnections(paths);
			}
			
			return paths;
		},
		
		/**
		 * Show connection lines for this entity.
		 
		 * @command EntityNode.showConnectionLines()
		 * @param {boolean} mode - Show or hide connection lines
		 */
		showConnectionLines : function(mode){
			if(mode == null || mode == undefined)
			{
				return GEPPETTO.Resources.MISSING_PARAMETER;
			}

			//show or hide connection lines
			if(mode)
			{
				var origin = this.getAspects()[0].getInstancePath();
				var lines = {};
				for(var c in this.getConnections())
				{
					var connection = this.getConnections()[c];
					
					var entity = GEPPETTO.Utility.deepFind(connection.getEntityInstancePath());
			
					var paths = this.getAspectPaths(entity);
					
					for(var p in paths)
					{
						lines[paths[p]] = connection.getType();
					}
				}
				if(!jQuery.isEmptyObject(lines))
				{
					GEPPETTO.SceneController.showConnectionLines(origin,lines);
				}
			}
			else
			{
				GEPPETTO.SceneController.hideConnectionLines();
			}
		},
		
		/**
		 * Show output connections for this entity.
		 
		 * @command EntityNode.showOutputConnections()
		 * @param {boolean} mode - Show or hide output connections
		 */
		showOutputConnections : function(mode)
		{
			if(mode == null || mode == undefined)
			{
				return GEPPETTO.Resources.MISSING_PARAMETER;
			}
			
			//deselect all previously selected nodes
			if(this.selected == false && (mode))
			{
				this.select();
			}
			
			var paths = new Array();
			for(var c in this.getConnections())
			{
				var connection = this.getConnections()[c];
				
				if(connection.getType() == GEPPETTO.Resources.OUTPUT_CONNECTION)
				{
					var entity = GEPPETTO.Utility.deepFind(connection.getEntityInstancePath());
					paths = paths.concat(this.getAspectPaths(entity));
				}
			}
			
			//show/hide output connections call
			if(mode)
			{
				GEPPETTO.SceneController.showConnections(paths,GEPPETTO.Resources.OUTPUT_CONNECTION);
			}
			else
			{
				GEPPETTO.SceneController.hideConnections(paths);
			}
			return paths;
		}
	}
});
