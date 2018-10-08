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

			GEPPETTO.on(GEPPETTO.Events.Select, function (instance, geometryIdentifier, point) {
				_this.send({ event: GEPPETTO.Events.Select, data: instance.id, geometryIdentifier: geometryIdentifier, point: point });
			});
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


	var ModelSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'ModelSync',
			_model_module: "jupyter_geppetto",
			_model_module_version : '~1.0.0',
			name: '',
			id: '',
			stateVariables: [],
			derived_state_variables: [],
			geometries: [],
			point_process_sphere: null,
			original_model: ''
		}),

		mergeModel: function () {
			GEPPETTO.ControlPanel.clearData();
			var diffReport = GEPPETTO.ModelFactory.mergeModel(this.getPayload(), true);

			var instances = this.createInstanceForStateVariables();
			GEPPETTO.trigger(GEPPETTO.Events.Instances_created, instances);
		},

		loadModel: function () {
			window.Instances = [];
			GEPPETTO.ControlPanel.clearData();
			GEPPETTO.Manager.loadModel({ geppetto_model_loaded: JSON.stringify(this.getPayload()) });

			var instances = this.createInstanceForStateVariables();

			GEPPETTO.trigger(GEPPETTO.Events.Instances_created, instances);

			GEPPETTO.ExperimentsController.playExperimentReady = true;

			this.splitAllGeometries();
		},

		handle_custom_messages: function (msg) {
			if (msg.type === 'load') {
				if (msg.hard_reload) {
					this.loadModel();
				}
				else {
					this.mergeModel();
				}
			}
			else if (msg.type === 'reload') {
				// If a Geppetto extension is defining a custom behavior to load the kernel we call it
				if (window.customJupyterModelLoad != undefined) {
					window.customJupyterModelLoad(msg.module, msg.model);
				}
			}
		},

		initialize: function () {
			ModelSync.__super__.initialize.apply(this, arguments);
			this.on("msg:custom", this.handle_custom_messages, this);

			this.on("change:original_model", function (model, value, options) {
				GEPPETTO.trigger('OriginalModelLoaded', value);
			});
		}
	}, {
			serializers: _.extend({
				stateVariables: { deserialize: jupyter_widgets.unpack_models },
				derived_state_variables: { deserialize: jupyter_widgets.unpack_models }
			}, jupyter_widgets.WidgetModel.serializers)
		});

	var ExperimentSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'ExperimentSync',
			_model_module: "jupyter_geppetto",
			_model_module_version : '~1.0.0',
			id: '',
			name: '',
			lastModified: '',
			status: ''
		}),

		getPayload: function (value) {
			return { update: JSON.stringify([{ "projectID": window.Project.id, "experimentID": Project.getActiveExperiment().id, "status": value }]) };
		},

		initialize: function () {
			ExperimentSync.__super__.initialize.apply(this, arguments);

			this.on("change:status", function (model, value, options) {
				GEPPETTO.Manager.updateExperimentsStatus(value);
			});
		}
	});

	var ProjectSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'ProjectSync',
			_model_module: "jupyter_geppetto",
			_model_module_version : '~1.0.0',

			id: '',
			name: '',
			experiments: []
		}),

		getPayload: function () {
			var payload = { id: this.get('id'), name: this.get('name'), experiments: [] }

			for (var i = 0; i < this.get('experiments').length; i++) {
				payload['experiments'].push(this.get('experiments')[i].attributes);
			}
			return payload
		},

		initialize: function () {
			ProjectSync.__super__.initialize.apply(this, arguments);

			// Load the project
			GEPPETTO.Manager.loadProject(this.getPayload(), false);
			// Load the first experiment
			GEPPETTO.Manager.loadExperiment(1, [], []);
		}
	}, {
			serializers: _.extend({
				experiments: { deserialize: jupyter_widgets.unpack_models },
			}, jupyter_widgets.WidgetModel.serializers)
		}
	);

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
		ModelSync: ModelSync,
		ExperimentSync: ExperimentSync,
		ProjectSync: ProjectSync,
		EventsSync: EventsSync,
		ComponentSync: ComponentSync
	};
});