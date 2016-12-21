define(function (require, exports, module) {

	require('./vendor/jupyter_widgets');

	var GEPPETTO = require('geppetto');
	var GeppettoJupyterUtils = require('./GeppettoJupyterUtils');

	var EventsSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'EventsSync',
			_model_module: "model",
		}),

		initialize: function () {
			EventsSync.__super__.initialize.apply(this);
			_this = this;

			GEPPETTO.on(Events.Select, function (data) {
				_this.send({ event: Events.Select, data: data.id });
			});
		}
	});

	var StateVariableSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'StateVariableSync',
			_model_module: "model",

			name: '',
			id: '',
			units: '',
			timeSeries: [],

			geppettoInstance: null
		}),

		getPayload: function () {
			return {
				eClass: 'Variable',
				types: [{ $ref: "//@libraries.0/@" + GeppettoJupyterUtils.getTypeById('StateVariable') }],

				initialValues: [{ value: { eClass: 'PhysicalQuantity', unit: { unit: this.get('units') } } }],
				id: this.get('id'),
				name: this.get('name'),
				timeSeries: this.get('timeSeries')
			}
		},

		initialize: function () {
			StateVariableSync.__super__.initialize.apply(this);

			this.on("change:timeSeries", function (model, value, options) {
				this.get('geppettoInstance').setTimeSeries(value);
				//TODO This code is copy and paste from updateExperiment, reason why we should do this in a way we reuse all of that
				if (value.length > GEPPETTO.ExperimentsController.maxSteps) {
					GEPPETTO.ExperimentsController.maxSteps = value.length;
				}
			});
		}
	}, {
			serializers: _.extend({
				timeSeries: { deserialize: jupyter_widgets.unpack_models },
			}, jupyter_widgets.WidgetModel.serializers)
		});

	var GeometrySync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'GeometrySync',
			_model_module: "model",

			id: '',
			name: '',
			bottomRadius: -1,
			topRadius: -1,
			positionX: -1,
			positionY: -1,
			positionZ: -1,
			distalX: -1,
			distalY: -1,
			distalZ: -1,

			geppettoInstance: null
		}),

		getPayload: function () {
			var value;
			if (this.name == 'soma') {
				value = {
					eClass: 'Sphere',
					position: {
						eClass: "Point",
						x: 0,
						y: 0,
						z: 0
					},
					radius: this.get('topRadius')
				}
			}
			else {
				value = {
					eClass: 'Cylinder',
					bottomRadius: this.get('bottomRadius'),
					topRadius: this.get('topRadius'),
					distal: {
						eClass: "Point",
						x: this.get('distalX'),
						y: this.get('distalY'),
						z: this.get('distalZ')
					},
					position: {
						eClass: "Point",
						x: this.get('positionX'),
						y: this.get('positionY'),
						z: this.get('positionZ')
					}
				}
			}

			return {
				eClass: 'Variable',
				initialValues: [{
					key: "geppettoModel#//@libraries.0/@" + GeppettoJupyterUtils.getTypeById('Visual'),
					value: value
				}],
				id: this.get('id'),
				name: this.get('name'),
				types: [{ $ref: "//@libraries.0/@" + GeppettoJupyterUtils.getTypeById('Visual') }],
			}
		},

		initialize: function () {
			GeometrySync.__super__.initialize.apply(this);

			//TODO: We need to use another way of handling this event: group them. Review bqplot
			this.on("change:bottomRadius", function (model, value, options) {
				console.log("changing radius");
			});
			this.on("change:topRadius", function (model, value, options) {
				console.log("changing radius");
			});
		}
	});

	var ModelSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'ModelSync',
			_model_module: "model",

			name: '',
			id: '',
			stateVariables: [],
			geometries: []
		}),

		getPayload: function () {

			var geppettoModelPayload = {
				eClass: 'GeppettoModel',
				//libraries: [{ synched: true }],
				libraries: [GeppettoJupyterUtils.getGeppettoCommonLibrary()]
			}


			var geppettoVariables = [];

			// Add StateVariable
			var geppettoStateVariables = [];
			for (var i = 0; i < this.get('stateVariables').length; i++) {
				// Add time as variable
				if (this.get('stateVariables')[i].get('id') == 'time') {
					geppettoVariables.push(this.get('stateVariables')[i].getPayload())
				}
				else {
					//Create array with states variables
					geppettoStateVariables.push(this.get('stateVariables')[i].getPayload())
				}
			}

			// Add model as variable
			var modelVariable = {
				eClass: 'Variable',
				id: this.get('id'),
				name: this.get('name'),
				anonymousTypes: [
					{
						eClass: 'CompositeType',
						id: this.get('id'),
						name: this.get('name'),
						abstract: false,
						variables: geppettoStateVariables
					}
				]
			}
			geppettoVariables.push(modelVariable)

			// Add morphologies
			if (this.get('geometries').length > 0) {
				var geppettoMorphologiesVariables = [];
				for (var i = 0; i < this.get('geometries').length; i++) {
					geppettoMorphologiesVariables.push(this.get('geometries')[i].getPayload());
				}
				var compositeVisualType = {
					eClass: 'CompositeVisualType',
					id: this.get('id') + 'VisualType',
					name: this.get('name') + ' Visual Type',
					variables: geppettoMorphologiesVariables
				}

				var neuronLibrary = {
					"eClass": "GeppettoLibrary",
					"id": "neuron",
					"name": "Geppetto Neuron Library",
					"types": [compositeVisualType]
				};
				geppettoModelPayload.libraries.push(neuronLibrary)
				modelVariable.anonymousTypes[0]['visualType'] = { $ref: "//@libraries.1/@types.0" }
			}

			geppettoModelPayload['variables'] = geppettoVariables;
			return geppettoModelPayload;
		},

		initialize: function () {
			ModelSync.__super__.initialize.apply(this);

			GEPPETTO.SimulationHandler.loadModel({ geppetto_model_loaded: JSON.stringify(this.getPayload()) });
			

			this.on("change:stateVariables", function (model, value, options) {
				window.Instances = []

				GEPPETTO.SimulationHandler.loadModel({ geppetto_model_loaded: JSON.stringify(this.getPayload()) });

				//TODO: We wouldnt have to do this if it was Python backend sending an experimentStatus once javascript were to ask the server
				//TODO: that in turn would create the instances for us, call ExperimentsController.updateExperiment, etc
				var instances = Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesOfMetaType("StateVariableType"));
				GEPPETTO.ControlPanel.setData(instances);
				GEPPETTO.ExperimentsController.watchVariables(instances, true);
				GEPPETTO.ExperimentsController.playExperimentReady = true;

				for (var i = 0; i < this.get('stateVariables').length; i++) {
					for (var j = 0; j < instances.length; j++) {
						//TODO Wont work for more complex nesting, we'll need the path to come from Python
						if (instances[j].getInstancePath().includes(this.get('stateVariables')[i].get('id'))) {
							this.get('stateVariables')[i].set('geppettoInstance', instances[j]);

							break;
						}
					}
				}
			});

			this.on("change:geometries", function (model, value, options) {
				window.Instances = []
				GEPPETTO.ControlPanel.setData([]);
				GEPPETTO.SimulationHandler.loadModel({ geppetto_model_loaded: JSON.stringify(this.getPayload()) });

				

				//TODO: We wouldnt have to do this if it was Python backend sending an experimentStatus once javascript were to ask the server
				//TODO: that in turn would create the instances for us, call ExperimentsController.updateExperiment, etc
				var instances = Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesOfMetaType("StateVariableType"));
				GEPPETTO.ControlPanel.setData(instances);
				GEPPETTO.ExperimentsController.watchVariables(instances, true);
				GEPPETTO.ExperimentsController.playExperimentReady = true;

				for (var i = 0; i < this.get('stateVariables').length; i++) {
					for (var j = 0; j < instances.length; j++) {
						//TODO Wont work for more complex nesting, we'll need the path to come from Python
						if (instances[j].getInstancePath().includes(this.get('stateVariables')[i].get('id'))) {
							this.get('stateVariables')[i].set('geppettoInstance', instances[j]);

							break;
						}
					}
				}

				if (this.get('geometries').length > 0) {
					var elements = {};
					for (var i = 0; i < this.get('geometries').length; i++) {
						elements[this.get('geometries')[i].get('id')] = "";
					}
					GEPPETTO.SceneController.splitGroups(window.Instances[0], elements);
				}

			})
		}
	}, {
			serializers: _.extend({
				stateVariables: { deserialize: jupyter_widgets.unpack_models },
				geometries: { deserialize: jupyter_widgets.unpack_models }
			}, jupyter_widgets.WidgetModel.serializers)
		});

	var ExperimentSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'ExperimentSync',
			_model_module: "model",

			id: '',
			name: '',
			lastModified: '',
			state: ''
		}),

		getPayload: function (value) {
			return { update: JSON.stringify([{ "projectID": window.Project.id, "experimentID": Project.getActiveExperiment().id, "status": value }]) };
		},

		initialize: function () {
			ExperimentSync.__super__.initialize.apply(this);

			this.on("change:state", function (model, value, options) {
				GEPPETTO.SimulationHandler.onMessage({ type: 'experiment_status', data: JSON.stringify(this.getPayload(value)) });
				if (value == "RUNNING") {
					GEPPETTO.trigger(Events.Experiment_running);
				}
			});
		}
	});

	var ProjectSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'ProjectSync',
			_model_module: "model",

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

		getLoadExperimentPayload: function () {
			return { experiment_loaded: JSON.stringify({ eClass: 'ExperimentState', experimentId: 1, recordedVariables: [] }) };
		},

		initialize: function () {
			ProjectSync.__super__.initialize.apply(this);

			// Load the project
			GEPPETTO.SimulationHandler.loadProject({ project_loaded: JSON.stringify({ project: this.getPayload(), persisted: false }) });

			// Load the first experiment
			GEPPETTO.SimulationHandler.onMessage({ type: 'experiment_loaded', data: JSON.stringify(this.getLoadExperimentPayload()) });
		}
	}, {
			serializers: _.extend({
				experiments: { deserialize: jupyter_widgets.unpack_models },
			}, jupyter_widgets.WidgetModel.serializers)
		});

	module.exports = {
		StateVariableSync: StateVariableSync,
		GeometrySync: GeometrySync,
		ModelSync: ModelSync,
		ExperimentSync: ExperimentSync,
		ProjectSync: ProjectSync,
		EventsSync: EventsSync
	};
});