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
 * Controller class for connectivity widget. Use to make calls to widget from inside Geppetto.
 *
 * @constructor
 *
 * @module Widgets/NetworkActivity
 *
 * @author Kenny Ashton (kwashton12@gmail.com)
 * @author David Forcier (forcier.david1@gmail.com)
 */
define(function(require) {
	var AWidgetController = require('widgets/AWidgetController');
	var NetworkActivity = require('widgets/networkactivity/NetworkActivity');
	
	/**
	 * @exports Widgets/Connectivity/ConnectivityController
	 */
	return AWidgetController.View.extend ({
		
		
		initialize: function(){
			this.widgets = new Array();
		},
		
		/**
		 * Adds a new NetworkActivity Widget to Geppetto
		 */
		addNetworkActivityWidget : function(){
			//look for a name and id for the new widget
			var id = this.getAvailableWidgetId("NetworkActivity", this.widgets);
			var name = id;

			//create tree visualiser widget
			var cnt = window[name] = new NetworkActivity({id:id, name:name,visible:false, width: 500, height: 500});

			//create help command for tree visualiser d3
			cnt.help = function(){return GEPPETTO.Utility.getObjectCommands(id);};

			//store in local stack
			this.widgets.push(cnt);

			GEPPETTO.WidgetsListener.subscribe(this,id);

			//add commands help option
			GEPPETTO.Console.updateHelpCommand("assets/js/widgets/networkactivity/NetworkActivity.js", cnt, id);

			//update tags for autocompletion
			GEPPETTO.Console.updateTags(cnt.getId(), cnt);

			return cnt;
		},
		
		/**
		 * Receives updates from widget listener class to update NetworkActivity widget(s)
		 * 
		 * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
		 */
		update: function(event) {
			//delete networkActivity widget(s)
			if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
				this.removeWidgets();
			}
			//update networkActivity widgets
			else if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.UPDATE) {
				//loop through all existing widgets
				for(var i = 0; i < this.widgets.length; i++) {
					var cnt = this.widgets[i];

					//update networkActivities with new data set
					cnt.updateDataSet();
				}
			}
		},
			
			
			
	});
});