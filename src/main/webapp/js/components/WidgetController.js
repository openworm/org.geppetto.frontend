/*******************************************************************************
 *
 * Copyright (c) 2011, 2016 OpenWorm.
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
class WidgetController {

	constructor(componentID) {
		this.componentID = componentID;
		this.widgets = [];
		this.comments = this.getFileComments("geppetto/js/components/" + GEPPETTO.ComponentFactory.components[componentID] + ".js");
		this.history = [];
		this.WIDGET_EVENT_TYPE = {
			DELETE: "delete",
			UPDATE: "update",
			RESET_DATA: "reset",
			SELECTION_CHANGED: "select",
		}
	}

	camelize(str) {
		return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
			if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
			return index == 0 ? match.toUpperCase() : match.toLowerCase();
		});
	}

	registerWidget(widget){
		var that = this;
		this.widgets.push(widget);
					
		GEPPETTO.Console.updateHelpCommand(widget, widget.getId(), this.comments);
		GEPPETTO.Console.updateTags(widget.getId(), widget);

		//registers remove handler for widget
		widget.$el.on("remove", function () {
			//FIXME: Called twice
			
			//remove tags and delete object upon destroying widget
			GEPPETTO.Console.removeCommands(widget.getId());
			var widgetsList = that.widgets;
			for (var p in widgetsList) {
				if (widgetsList[p].getId() == this.id) {
					widgetsList.splice(p, 1);
					break;
				}
			}
		});

		//register resize handler for widget
		widget.$el.on("dialogresizestop", function (event, ui) {

			var height = ui.size.height;
			var width = ui.size.width;

			GEPPETTO.Console.executeImplicitCommand(widget.getId() + ".setSize(" + height + "," + width + ")");

			var left = ui.position.left;
			var top = ui.position.top;

			window[widget.getId()].setPosition(left, top);
		});

		// //register drag handler for widget
		widget.$el.on("dialogdragstop", function (event, ui) {

			var left = ui.position.left;
			var top = ui.position.top;

			GEPPETTO.Console.executeImplicitCommand(widget.getId() + ".setPosition(" + left + "," + top + ")");
		});
	}

	/**
	 * Get the comments of a given widget file through an Ajax call. This is used to extract the comments on the methods
	 * and visualize them when using the help command.
	 *
	 * @param {String} file
	 */
	getFileComments(file) {
		// var comments = "";
		// if (comments.length == 0) {
			var comments = [];
			//retrieve the script to get the comments for all the methods
			$.ajax({
				async: false,
				type: 'GET',
				url: file,
				dataType: "text",
				//at success, read the file and extract the comments
				success: function (data) {
					var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
					comments = data.match(STRIP_COMMENTS);
				},
				error: function () {
					console.log('error fetching file with Ajax request');
				}
			});

			// comments = fetchedComments;
		// }
		return comments;
	}

	/**
	 * Get an available id for an specific widget
	 *
	 * @module WidgetUtility
	 * @param {String} prefix
	 * @param {Array} widgetsList
	 * @returns {String} id - Available id for a widget
	 */
	getAvailableWidgetId () {
		var index = 0;
		var id = "";
		var available;

		do {
			index++;
			id = this.componentID + index;
			available = true;

			for (var p in this.widgets) {
				if (this.widgets[p].getId().toUpperCase() == id.toUpperCase()) {
					available = false;
					break;
				}
			}
		}
		while (available == false);

		return this.camelize(id);
	}

	/**
	 * Removes existing plotting widgets
	 */
	removeWidgets () {
		//remove all existing widgets
		for (var i = 0; i < this.widgets.length; i++) {
			var widget = this.widgets[i];

			//remove commands
			GEPPETTO.Console.removeCommands(widget.getId());

			widget.destroy();

			i--;
		}

		this.widgets = [];
	}
	/**
	 * Returns all plotting widgets objects
	 *
	 * @returns {Array} Array containing all plots
	 */
	getWidgets () {
		return this.widgets;
	}

	addToHistory (label, method, args, id) {
		var elementPresentInHistory = false;
		for (var i = 0; i < this.history.length; i++) {
			if (this.history[i].label == label && this.history[i].method == method) {
				elementPresentInHistory = true;
				//moves it to the first position
				this.history.splice(0, 0, this.history.splice(i, 1)[0]);
				break;
			}
		}
		if (!elementPresentInHistory) {
			this.history.unshift({
				"label": label,
				"method": method,
				"arguments": args,
			});
		}
		
		var widget = this.getWidgetById(id);
		widget.updateNavigationHistoryBar();
	}

	/**
	 * Toggles variable visualiser widget on and off
	 */
	toggle () {
		if (this.widgets.length > 0) {
			this.on = !this.on;
			for (var w in this.widgets) {
				var widget = this.widgets[w];
				if (!this.on) {
					widget.hide();
				} else {
					widget.show();
				}
			}
		}
	}

	getWidgetById(id){
		for (var i = 0; i< this.widgets.length; i++) {
			var widget = this.widgets[i];
			if(widget.getId()==id){
				return widget;
			}
		}
		
		return null;
	}

	update (event, parameters) {
		//delete popup widget(s)
		if (event == this.WIDGET_EVENT_TYPE.DELETE) {
			this.removeWidgets();
		}
	}

}

module.exports = WidgetController;


