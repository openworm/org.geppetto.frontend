class WidgetController {

	constructor(componentID) {
		this.componentID = componentID;
		this.widgets = [];
		this.comments = this.getFileComments();
		this.history = [];
		this.WIDGET_EVENT_TYPE = {
			DELETE: "delete",
			UPDATE: "update",
			RESET_DATA: "reset",
			SELECTION_CHANGED: "select",
		}
	}



	registerWidget(widget) {
		var that = this;
		this.widgets.push(widget);

		GEPPETTO.CommandController.updateHelpCommand(widget, widget.getId(), this.comments);
		GEPPETTO.CommandController.updateTags(widget.getId(), widget);

		//registers remove handler for widget
		widget.$el.on("remove", function () {


			//remove tags and delete object upon destroying widget
			GEPPETTO.CommandController.removeCommands(widget.getId());
			var widgetsList = that.widgets;
			for (var p in widgetsList) {
				if (widgetsList[p].getId() == this.id) {
					widgetsList.splice(p, 1);
					break;
				}
			}

			// remove from component factory dictionary
			var comps = GEPPETTO.ComponentFactory.getComponents()[widget.getComponentType()];
			for (var c in comps) {
				if (comps[c].getId() == this.id) {
					comps.splice(c, 1);
					break;
				}
			}

			//FIXME: Called twice
			GEPPETTO.trigger(GEPPETTO.Events.Component_destroyed, widget.getId());


		});

		//register resize handler for widget
		widget.$el.on("dialogresizestop", function (event, ui) {

			var height = ui.size.height;
			var width = ui.size.width;

			GEPPETTO.CommandController.execute(widget.getId() + ".setSize(" + height + "," + width + ")", true);

			var left = ui.position.left;
			var top = ui.position.top;

			window[widget.getId()].setPosition(left, top);
		});

		// //register drag handler for widget
		widget.$el.on("dialogdragstop", function (event, ui) {

			var left = ui.position.left;
			var top = ui.position.top;

			GEPPETTO.CommandController.execute(widget.getId() + ".setPosition(" + left + "," + top + ")", true);
		});
	}

	/**
	 * Get the comments of a given widget file through an Ajax call. This is used to extract the comments on the methods
	 * and visualize them when using the help command.
	 *
	 * @param {String} file
	 */
	getFileComments(file) {
		//var fileContent = require("raw-loader!./" + GEPPETTO.ComponentFactory.components[this.componentID] + ".js");
		var fileContent = "";

		var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
		var comments = [];
		comments = fileContent.match(STRIP_COMMENTS);
		return comments;
	}

	/**
	 * Removes existing plotting widgets
	 */
	removeWidgets() {
		//remove all existing widgets
		for (var i = 0; i < this.widgets.length; i++) {
			var widget = this.widgets[i];

			//remove commands
			GEPPETTO.CommandController.removeCommands(widget.getId());

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
	getWidgets() {
		return this.widgets;
	}

	addToHistory(label, method, args, id) {
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
			
			this.staticHistoryMenu.unshift({
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
	toggle() {
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

	getWidgetById(id) {
		for (var i = 0; i < this.widgets.length; i++) {
			var widget = this.widgets[i];
			if (widget.getId() == id) {
				return widget;
			}
		}

		return null;
	}

	update(event, parameters) {
		//delete popup widget(s)
		if (event == this.WIDGET_EVENT_TYPE.DELETE) {
			this.removeWidgets();
		}
	}

}

module.exports = WidgetController;


