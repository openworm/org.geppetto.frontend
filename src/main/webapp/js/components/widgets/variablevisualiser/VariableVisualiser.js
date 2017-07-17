/**
 * Variable visualiser Widget class
 * @module Widgets/VariableVisualiser
 * @author Dan Kruchinin (dkruchinin@acm.org)
 */
define(function (require) {

    var Widget = require('../Widget');
    var $ = require('jquery');

    require("./VariableVisualiser.less");

    return Widget.View.extend({
        root: null,
        variable: null,
        options: null,
        default_width: 350,
        default_height: 120,

        /**
         * Initialises variables visualiser with a set of options
         *
         * @param {Object} options - Object with options for the widget
         */
        initialize: function (options) {
            Widget.View.prototype.initialize.call(this, options);

            if (!('width' in options)) {
                options.width = this.default_width;
            }
            if (!('height' in options)) {
                options.height = this.default_height;
            }

            this.render();
            this.setSize(options.height, options.width);
            this.dialog.append("<div class='varvis_header'></div><div class='varvis_body'></div>");
        },

        /**
         * Takes time series data and shows it as a floating point variable changing in time.
         *
         * @command addVariable(state, options)
         * @param {Object} state - time series data (a geppetto simulation variable)
         * @param {Object} options - options for the plotting widget, if null uses default
         */
        setVariable: function (state, options) {
            this.variable = {
                name: state.getInstancePath(),
                state: state
            };

            if (this.root == null) {
                this.root = $("#" + this.id)
            }

            this.setHeader(this.variable.name);
            this.updateVariable(0, false);

            // track change in state of the widget
            this.dirtyView = true;

            return "Variable visualisation added to widget";
        },


        /**
         * Clear variable
         *
         * @command removeVariable(state)
         *
         * @param {Object} state - geppetto similation variable to remove
         */
        clearVariable: function () {
    		if (this.variable == null) {
    			return;
    		}

    		this.variable = null;
    		this.setHeader("");
    		this.setBody("");
        },

        /**
         * Updates variable values
         */
        updateVariable: function (step) {
			if (typeof step != 'undefined' && (this.variable.state.getTimeSeries()!=null || undefined)) {
				if(this.variable.state.getTimeSeries().length>step){
					this.setBody(this.variable.state.getTimeSeries()[step].toFixed(4) + this.variable.state.getUnit());
				}
			}

        },

        /**
         * Change name of the variable (if there's one)
         *
         * @param newName - the new name
         */
        renameVariable: function (newName) {
            if (this.variable != null) {
                this.variable.name = newName;
                this.setHeader(newName);
            }
        },


        /**
         * @private
         */
        setHeader: function (content) {
            this.getSelector("varvis_header").html(content);
        },

        /**
         * @private
         */
        setBody: function (content) {
            this.getSelector("varvis_body").html(content);
        },

        /**
         * @private
         */
        getSelector: function (name) {
            return $(this.root.selector + " ." + name);
        },

        getView: function(){
            var baseView = Widget.View.prototype.getView.call(this);

            // add data
            baseView.dataType = 'object';
            baseView.data = this.variable.name;

            return baseView;
        },

        setView: function(view){
            // set base properties
            Widget.View.prototype.setView.call(this, view);

            if(view.dataType == 'object' && view.data != undefined && view.data != ''){
                var variable = eval(view.data);
                this.setVariable(variable);
            }

            // after setting view through setView, reset dirty flag
            this.dirtyView = false;
        }
    });
});
