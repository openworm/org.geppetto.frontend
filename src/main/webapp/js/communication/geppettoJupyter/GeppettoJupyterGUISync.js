define(function (require, exports, module) {

	var jupyter_widgets = require('@jupyter-widgets/base');
	var GEPPETTO = require('geppetto');

	var $ = require('jquery');
	var _ = require('underscore');

	var ComponentSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			value: undefined,
			parent: null,
			componentType: undefined
		}),

		initialize: function (options) {
			ComponentSync.__super__.initialize.apply(this, arguments);

			this.on("msg:custom", this.handle_custom_messages, this);
			this.on("change:value", this.handle_value_change, this);

		},

		syncValueWithPython: function (value, requirement, context) {
			var jsonValue = JSON.stringify(value);
			this.set('value', jsonValue);
			this.save_changes();
			this.send({ event: 'sync_value', value: jsonValue, requirement: requirement, context: context });
		},

		getParameters: function (parameters) {
			parameters['id'] = this.get('widget_id');
			parameters['name'] = this.get('widget_name');
			parameters['value'] = this.get('value');
			parameters['syncValueWithPython'] = this.syncValueWithPython;
			parameters['isStateless'] = true;
			parameters['read_only'] = false;
			return parameters;
		},

		createComponent: function (componentItem, parameters, container) {

			var component = GEPPETTO.ComponentFactory._addComponent(componentItem, this.componentType, this.getParameters(parameters),
				container, undefined, (this.get("embedded") == false));
			this.component = component;

			return component;
		},

		handle_value_change: function (model, jsonValue, options) {
			var value = "";
			if (jsonValue != undefined && jsonValue != "") {
				value = JSON.parse(jsonValue);
			}
			if (model.get('parent') != null) {
				model.get('parent').forceRender();
			}
			else {
				if (this.component != undefined) {
					if (this.component.state.value !== value || this.component.state.searchText !== value) {
						this.component.setState({ value: value, searchText: value, checked: (value || value == "True") });
					}
				}
			}
		},

		handle_custom_messages: function (msg) {
			if (msg.type === 'connect') {
				var component = GEPPETTO.ComponentFactory.getComponentById(this.get("componentType"), this.id);
				//this could be undefined if we are in the middle of a rename
				if (component != undefined) {
					component.setSyncValueWithPythonHandler(this.syncValueWithPython.bind(this));
					this.component = component;
				}

			}
			else if (msg.type === 'disconnect') {
				this.off("msg:custom", this.handle_custom_messages, this);
				this.off("change:value", this.handle_value_change, this);
				//this could be undefined if we are in the middle of a rename
				if (this.component != undefined) {
					this.component.setSyncValueWithPythonHandler(null);
					this.component = null;
				}
			}
		}
	});

	

	module.exports = {
		ComponentSync: ComponentSync
	};
});
