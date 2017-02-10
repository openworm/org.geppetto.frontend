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

			GEPPETTO.on(Events.Select, function (instance, geometryIdentifier, point) {
				var selection = G.getSelection();
				if (selection.length > 0) {
					_this.send({ event: Events.Select, data: instance.id, geometryIdentifier: geometryIdentifier, point: point });
				}
			});

			this.on("msg:custom", this.handle_customMessage, this);
		},

		handle_customMessage: function (msg) {
			//The only custom message we have at the moment is an event
			GEPPETTO.trigger(msg.event,msg.options);
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
	}
	);

	var DerivedStateVariableSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'DerivedStateVariableSync',
			_model_module: "model",

			name: '',
			id: '',
			units: '',
			inputs: [],
			timeSeries: [],
			normalizationFunction: '',

			geppettoInstance: null
		}),

		getInputs: function () {
			//FIXME: We should create pointers for this
			return this.get('inputs')
		},

		getPayload: function () {
			return {
				eClass: 'Variable',
				types: [{ $ref: "//@libraries.0/@" + GeppettoJupyterUtils.getTypeById('DerivedStateVariable') }],

				initialValues: [{ value: { eClass: 'PhysicalQuantity', unit: { unit: this.get('units') } } }],
				id: this.get('id'),
				name: this.get('name'),
				inputs: this.getInputs(),
				timeSeries: this.get('timeSeries'),
				normalizationFunction: this.get('normalizationFunction')
			}
		},

		initialize: function () {
			DerivedStateVariableSync.__super__.initialize.apply(this);
		}
	});

	var ModelSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'ModelSync',
			_model_module: "model",

			name: '',
			id: '',
			stateVariables: [],
			derived_state_variables: [],
			geometries: [],
			point_process_sphere: null
		}),

		getGeometryPayload: function (geometry) {
			var value;
			if (geometry.name.substr(0, 4) == 'soma') {
				value = {
					eClass: 'Sphere',
					position: {
						eClass: "Point",
						x: (geometry.distalX + geometry.positionX) / 2,
						y: (geometry.distalY + geometry.positionY) / 2,
						z: (geometry.distalZ + geometry.positionZ) / 2
					},
					radius: (geometry.topRadius + geometry.bottomRadius) / 2
				}
			}
			else {
				value = {
					eClass: 'Cylinder',
					bottomRadius: geometry.bottomRadius,
					topRadius: geometry.topRadius,
					distal: {
						eClass: "Point",
						x: geometry.distalX,
						y: geometry.distalY,
						z: geometry.distalZ
					},
					position: {
						eClass: "Point",
						x: geometry.positionX,
						y: geometry.positionY,
						z: geometry.positionZ
					}
				}
			}

			return {
				eClass: 'Variable',
				initialValues: [{
					key: "geppettoModel#//@libraries.0/@" + GeppettoJupyterUtils.getTypeById('Visual'),
					value: value
				}],
				id: geometry.id,
				name: geometry.name,
				types: [{ $ref: "//@libraries.0/@" + GeppettoJupyterUtils.getTypeById('Visual') }],
			}
		},

		setGeppettoInstance: function (instances) {
			for (var i = 0; i < this.get('stateVariables').length; i++) {
				for (var j = 0; j < instances.length; j++) {
					//TODO Wont work for more complex nesting, we'll need the path to come from Python
					if (instances[j].getInstancePath().includes(this.get('stateVariables')[i].get('id'))) {
						this.get('stateVariables')[i].set('geppettoInstance', instances[j]);
						break;
					}
				}
			}

			for (var i = 0; i < this.get('derived_state_variables').length; i++) {
				for (var j = 0; j < instances.length; j++) {
					//TODO Wont work for more complex nesting, we'll need the path to come from Python
					if (instances[j].getInstancePath().includes(this.get('derived_state_variables')[i].get('id'))) {
						this.get('derived_state_variables')[i].set('geppettoInstance', instances[j]);
						break;
					}
				}
			}
		},

		splitAllGeometries: function () {
			if (this.get('geometries').length > 1) {
				var elements = {};
				for (var i = 0; i < this.get('geometries').length; i++) {
					elements[this.get('geometries')[i].id] = "";
				}
				GEPPETTO.SceneController.splitGroups(window.Instances[0], elements);
			}
		},

		createInstanceForStateVariables: function () {
			//TODO: We wouldnt have to do this if it was Python backend sending an experimentStatus once javascript were to ask the server
			//TODO: that in turn would create the instances for us, call ExperimentsController.updateExperiment, etc
			var stateVariableInstances = Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesOfMetaType("StateVariableType"));
			var derivedStateVariableInstances = Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesOfMetaType("DerivedStateVariableType"));
			var instances =  stateVariableInstances.concat(derivedStateVariableInstances)

			GEPPETTO.ExperimentsController.watchVariables(instances, true);

			this.setGeppettoInstance(instances);

			return instances;
		},

		mergeModel: function () {
			GEPPETTO.ControlPanel.clearData();
			var diffReport = GEPPETTO.ModelFactory.mergeModel(this.getPayload(), true);

			var instances = this.createInstanceForStateVariables();
			GEPPETTO.ControlPanel.setData(instances);
		},

		loadModel: function () {
			window.Instances = []
			GEPPETTO.ControlPanel.clearData();
			GEPPETTO.SimulationHandler.loadModel({ geppetto_model_loaded: JSON.stringify(this.getPayload()) });

			var instances = this.createInstanceForStateVariables();
			GEPPETTO.ControlPanel.setData(instances);
			GEPPETTO.ExperimentsController.playExperimentReady = true;

			this.splitAllGeometries();
		},

		getStateVariablesPayload: function(geppettoVariables){
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

			// Add DerivedStateVariable
			for (var i = 0; i < this.get('derived_state_variables').length; i++) {
				//Create array with states variables
				geppettoStateVariables.push(this.get('derived_state_variables')[i].getPayload())
			}

			return geppettoStateVariables;
		},

		getCompositeVisualType: function(){
			var geppettoMorphologiesVariables = [];
			for (var i = 0; i < this.get('geometries').length; i++) {
				geppettoMorphologiesVariables.push(this.getGeometryPayload(this.get('geometries')[i]));
			}
			return {
				eClass: 'CompositeVisualType',
				id: this.get('id') + 'VisualType',
				name: this.get('name') + ' Visual Type',
				variables: geppettoMorphologiesVariables
			}
		},

		getModelVariableType: function(geppettoVariables){
			return {
				eClass: 'CompositeType',
				id: this.get('id'),
				name: this.get('name'),
				abstract: false,
				variables: this.getStateVariablesPayload(geppettoVariables)
			}
		},

		getNeuronLibrary: function(){
			return {
				"eClass": "GeppettoLibrary",
				"id": "neuron",
				"name": "Geppetto Neuron Library",
				"types": []
			}
		},
		

		getPayload: function () {

			// Create Geppetto Model Payload
			var geppettoModelPayload = {
				eClass: 'GeppettoModel',
				libraries: [GeppettoJupyterUtils.getGeppettoCommonLibrary(), this.getNeuronLibrary()]
			}

			var geppettoVariables = [];

			// Get Main Model Variable Type
			var modelVariableType = this.getModelVariableType(geppettoVariables);
			geppettoModelPayload.libraries[1].types.push(modelVariableType);
			
			
			// Get Main Composite Visual Type
			if (this.get('geometries').length > 0) {
				geppettoModelPayload.libraries[1].types.push(this.getCompositeVisualType())
				modelVariableType['visualType'] = { $ref: "//@libraries.1/@types.1" }
			}

			// Add model as variable
			var modelVariable = {
				eClass: 'Variable',
				id: this.get('id'),
				name: this.get('name'),
				types: [{ $ref: "//@libraries.1/@types.0" }],
			}
			geppettoVariables.push(modelVariable)


			geppettoModelPayload['variables'] = geppettoVariables;
			return geppettoModelPayload;
		},

		handle_custom_messages: function (msg) {
			if (msg.type === 'load') {
				if (msg.type === 'hard_reload') {
					this.loadModel();
				}
				else{
					this.mergeModel();
				}
				
			}
			else if (msg.type === 'draw_sphere') {
				var content = msg.content;
				if (this.point_process_sphere) {
					this.point_process_sphere = GEPPETTO.SceneFactory.modify3DSphere(this.point_process_sphere, content.x, content.y, content.z, content.radius);
				}
				else {
					this.point_process_sphere = GEPPETTO.SceneFactory.add3DSphere(content.x, content.y, content.z, content.radius);
				}
			}
		},

		initialize: function () {
			ModelSync.__super__.initialize.apply(this);
			this.on("msg:custom", this.handle_custom_messages, this);

			this.on("change:geometries", function (model, value, options) {
				this.loadModel();
			});

			this.on("change:derived_state_variables", function (model, value, options) {
				this.mergeModel();
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
			_model_module: "model",

			id: '',
			name: '',
			lastModified: '',
			status: ''
		}),

		getPayload: function (value) {
			return { update: JSON.stringify([{ "projectID": window.Project.id, "experimentID": Project.getActiveExperiment().id, "status": value }]) };
		},

		initialize: function () {
			ExperimentSync.__super__.initialize.apply(this);

			this.on("change:status", function (model, value, options) {
				GEPPETTO.SimulationHandler.onMessage({ type: 'experiment_status', data: JSON.stringify(this.getPayload(value)) });
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
		DerivedStateVariableSync: DerivedStateVariableSync,
		ModelSync: ModelSync,
		ExperimentSync: ExperimentSync,
		ProjectSync: ProjectSync,
		EventsSync: EventsSync
	};
});