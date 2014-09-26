/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2014 OpenWorm.
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
 * Variable visualiser Widget class
 * @module Widgets/VariableVisualiser
 * @author Dan Kruchinin (dkruchinin@acm.org)
 */
define(function(require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');

	return Widget.View.extend({
		table: null,
		variables: [],
		options: null,

		/**
		 * Initialises viriables visualiser with a set of options
		 *
		 * @param {Object} options - Object with options for the widget
		 */
		initialize: function(options) {
			this.id = options.id;
			this.name = options.name;
			this.options = options;

			this.render();
			this.dialog.append("<table class='varvis'><thead></thead><tbody></tbody></table>");
		},

		/**
		 * Takes time series data and shows it as a floating point variable changing in time.
		 *
		 * @command addVariable(state, options)
		 * @param {Object} state - time series data (a geppetto simulation variable)
		 * @param {Object} options - options for the plotting widget, if null uses default
		 */
		addVariable: function(state, options) {
			var variable = {
				name: state.getName(),
				state: state
			};

			this.setVariableOptions(variable, options);
			this.variables.push(variable);
			if (this.table == null) {
				this.table = $("#" + this.id + " table")
			}

			this.updateVariables();
			return "Variable visualisation added to widget";
		},


		/**
		 * Removes the variable from variables table
		 *
		 * @command removeVariable(state)
		 *
		 * @param {Object} state - geppetto similation variable to remove
		 */
		removeVariable: function(state) {
			if(state == null) {
				return;
			}
			for (var i = 0; i < this.variables.length; i++) {
				if (this.variables[i].state.getInstancePath() == state.getInstancePath()) {
					this.variables.splice(i, 1);
					break;
				}
			}

			this.updateVariables();
		},

		/**
		 * Updates variables values
		 */
		updateVariables: function() {
			var tbody = this.table.children('tbody');
			tbody.empty();

			var rows = "";
			for (var i = 0; i < this.variables.length; i++) {
				var v = this.variables[i];

				rows += "<tr><td>" + v.name + "</td>";
				rows += "<td>" + v.state.getValue() + "</td></tr>";
			}

			tbody = tbody.html(rows);
		},

		/**
		 * Change variable's name
		 *
		 * @param oldName - old variable name
		 * @param newName - new variable name
		 */
		renameVariable: function(oldName, newName) {
			var v = this.findVariableByName(oldName);
			if (v != null) {
				v.name = newName;
				this.updateVariables();
			}
		},

		/**
		 * Resets variables
		 */
		cleanVariables: function() {
			this.variables = []
		},

		/**
		 * @private
		 */
		findVariableByName: function(name) {
			for (var i = 0; i < this.variables.length; i++) {
				if (this.variables[i].name === name) {
					return this.variables[i];
				}
			}

			return null;
		},

		/**
		 * @private
		 */
		setVariableOptions: function(variable, options) {
			if (options != null) {
				if ('name' in options) {
					variable.name = options.name;
				}
			}
		}
	});
});
