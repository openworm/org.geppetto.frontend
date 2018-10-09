define(function (require, exports, module) {

	var jupyter_widgets = require('@jupyter-widgets/base');
	var GEPPETTO = require('geppetto');
	var _ = require('underscore');


	var EventsSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'EventsSync',
			_model_module: "jupyter_geppetto",
			_model_module_version : '~1.0.0',
		}),

		initialize: function () {
			EventsSync.__super__.initialize.apply(this, arguments);
			_this = this;

			GEPPETTO.on(GEPPETTO.Events.Instances_created, function (instances) {
				var instancesIds = []
				for (var instanceIndex in instances) {
					instancesIds.push(instances[instanceIndex].id)
				}
				_this.send({ event: GEPPETTO.Events.Instances_created, data: instancesIds });
			});

			GEPPETTO.on(GEPPETTO.Events.Send_Python_Message, function (data) {
				_this.send({ event: 'Global_message', id: data.id, command: data.command, parameters: data.parameters });
			});

			this.on("msg:custom", this.handle_customMessage, this);
		},

		handle_customMessage: function (msg) {
			//The only custom message we have at the moment is an event
			GEPPETTO.trigger(msg.event, msg.options);
		}

	});


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

		syncValueWithPython: function (value) {
			var jsonValue = JSON.stringify(value);
			this.set('value', jsonValue);
			this.save_changes();
			this.send({ event: 'sync_value', value: jsonValue });
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
		EventsSync: EventsSync,
		ComponentSync: ComponentSync
	};
});