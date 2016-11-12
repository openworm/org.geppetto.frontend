define(function (require, exports, module) {

	var React = require('react');
	var ReactDOM = require('react-dom');

	require('./vendor/jupyter_widgets');

	var PanelComp = require('jsx!components/dev/panel/Panel');
	var CheckboxComp = require('jsx!components/dev/BasicComponents/Checkbox');
	var TextFieldComp = require('jsx!components/dev/BasicComponents/TextField');
	var RaisedButtonComp = require('jsx!components/dev/BasicComponents/RaisedButton');

	var GEPPETTO = require('geppetto');

	var $ = require('jquery');

	var PanelModel = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: "PanelModel",
			_model_module: "panel",

			items: [],
			parent: null,
			component: null,
			positionX: null,
			positionY: null
		}),

		initialize: function () {
			PanelModel.__super__.initialize.apply(this);

			this.on("msg:custom", this.handle_custom_messages, this);
		},

		getComponent: function () {
			var component = React.createFactory(PanelComp)({ id: this.get('widget_id'), name: this.get('widget_name'), items: this.getChildren(), parentStyle: this.get('parentStyle') });
			this.set('component', component);
			return component;
		},

		forceRender: function () {
			if (this.get("embedded") == false) {
				this.get("component").setChildren(this.getChildren());
			}
			else {
				this.get("parent").forceRender();
			}
		},

		getChildren: function() {
			var children = [];
			for (var i = 0; i < this.get('items').length; i++){
				var item = this.get('items')[i];
				item.set('parent', this);
				children.push(item.getComponent())
			}
			return children;
		},

		display: function(){
			this.set('component', GEPPETTO.ComponentFactory.renderComponent(this.getComponent()));

			//TODO: This can be done in a much more elegant way
			if (this.get('positionX') > 0) {
				$("." + this.get('widget_id') + "_dialog").css({ left: this.get('positionX') });
			}
			if (this.get('positionY') > 0) {
				$("." + this.get('widget_id') + "_dialog").css({ top: this.get('positionY') });
			}
		},

		handle_custom_messages: function(msg) {
			if (msg.type === 'display') {
				this.display();
			}
		}
	}, {
			serializers: _.extend({
				items: { deserialize: jupyter_widgets.unpack_models },
			}, jupyter_widgets.WidgetModel.serializers)
		});

	var ComponentModel = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'ComponentModel',
			_model_module: "component",

			sync_value: undefined,
			parent: null,
			component: null
		}),

		initialize: function (options) {
			ComponentModel.__super__.initialize.apply(this, arguments);
			this.on("change:sync_value", function (model, value, options) {
				model.get('parent').forceRender();
			});
		},

		handleClick: function (model) {
			var data = { info: 'data sent' };
			model.send({ event: 'click', data: data });
		},

		handleChange: function (model, value) {
			//TODO: Extract to an specific class (for checkbox component we need to save the value on change)
			if (model.get('component_name') == 'CHECKBOX') {
				model.set('sync_value', value);
				model.touch();
			}
			model.send({ event: 'change', data: parseFloat(value) });
		},

		handleBlur: function (model, value) {
			model.set('sync_value', value);
			model.touch();
			model.send({ event: 'blur', data: parseFloat(value) });
		},

		getComponent: function () {
			var componentName = this.get('component_name');
			var componentItem;
			if (componentName == 'RAISEDBUTTON') {
				componentItem = RaisedButtonComp;
			}
			else if (componentName == 'TEXTFIELD') {
				componentItem = TextFieldComp;
			}
			else if (componentName == 'CHECKBOX') {
				componentItem = CheckboxComp;
			}
			
			var component = React.createFactory(componentItem)({ 
				id: this.get('widget_id'), 
				label: this.get('widget_name'), 
				parentStyle: this.get('parentStyle'), 
				sync_value: this.get('sync_value'), 
				handleClick: this.handleClick.bind(null, this), 
				handleChange: this.handleChange.bind(null, this), 
				handleBlur: this.handleBlur.bind(null, this) })
			this.set('component', component);
			return component;
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
				anonymousTypes:  [{ eClass: 'StateVariableType', id: 'StateVariable', name: 'StateVariable' }],
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


	var ModelSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'ModelSync',
			_model_module: "model",

			name: '',
			id: '',
			stateVariables: []
		}),

		getPayload: function () {

			var geppettoStateVariables = [];
			var geppettoVariables = [];
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

			return {
				eClass: 'GeppettoModel',
				libraries: [{ synched: true }],
				variables: geppettoVariables
			}
		},

		initialize: function () {
			ModelSync.__super__.initialize.apply(this);

			GEPPETTO.SimulationHandler.loadModel({ geppetto_model_loaded: this.getPayload() });

			this.on("change:stateVariables", function (model, value, options) {
				GEPPETTO.SimulationHandler.loadModel({ geppetto_model_loaded: this.getPayload() });

				//TODO: We wouldnt have to do this if it was Python backend sending an experimentStatus once javascript were to ask the server
				//TODO: that in turn would create the instances for us, call ExperimentsController.updateExperiment, etc
				var instances=Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesOfMetaType("StateVariableType"));
				GEPPETTO.ExperimentsController.watchVariables(instances, true);
				GEPPETTO.ExperimentsController.playExperimentReady=true;

				for (var i = 0; i < this.get('stateVariables').length; i++) {
					for (var j = 0; j < instances.length; j++) {
						//TODO Wont work for more complex nesting, we'll need the path to come from Python
						if(instances[j].getInstancePath().includes(this.get('stateVariables')[i].get('id'))){
							this.get('stateVariables')[i].set('geppettoInstance', instances[j]);

							break;
						}
					}
				}
			});
		}
	}, {
			serializers: _.extend({
				stateVariables: { deserialize: jupyter_widgets.unpack_models },
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

		getPayload : function(value){
			return { update: JSON.stringify([{"projectID":window.Project.id, "experimentID":Project.getActiveExperiment().id, "status":value}]) };
		},

		initialize: function () {
			ExperimentSync.__super__.initialize.apply(this);

			this.on("change:state", function (model, value, options) {
				GEPPETTO.SimulationHandler.onMessage({type: 'experiment_status', data: JSON.stringify(this.getPayload(value))});
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
			var payload = {id: this.get('id'), name: this.get('name'), experiments: []}

			for (var i = 0; i < this.get('experiments').length; i++) {
				payload['experiments'].push(this.get('experiments')[i].attributes);
			}
			return payload
		},	

		getLoadExperimentPayload: function (){
			return { experiment_loaded: {eClass: 'ExperimentState', experimentId: 1, recordedVariables: [] } };
		},

		initialize: function () {
			ProjectSync.__super__.initialize.apply(this);

			// Load the project
			GEPPETTO.SimulationHandler.loadProject({ project_loaded: { project: this.getPayload(), persisted: false } });

			// Load the first experiment
			GEPPETTO.SimulationHandler.onMessage({type: 'experiment_loaded', data: JSON.stringify(this.getLoadExperimentPayload())});
		}
	}, {
			serializers: _.extend({
				experiments: { deserialize: jupyter_widgets.unpack_models },
			}, jupyter_widgets.WidgetModel.serializers)
		});


	var WidgetSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			widget_id: '',
			name: '',
			data: [],
			positionX: null,
			positionY: null,
			widget_object: null
		}),

		initialize: function () {
			WidgetSync.__super__.initialize.apply(this);

			if (this.get('widget_id') > -1) {
				var widget = G.addWidget(this.get('widget_id'))
				this.set('widget_object', widget)

				if (this.get('name') != '') {
					widget.setName(this.get('name'))
				}
				if (this.get('positionX') > 0 && this.get('positionY') > 0) {
				}

			}
		}
	});

	var PlotWidgetSync = WidgetSync.extend({
		_model_name: 'PlotWidgetSync',
		_model_module: "model",

		initialize: function () {
			PlotWidgetSync.__super__.initialize.apply(this);

			if (this.get('data').length > 0) {
				for (var i = 0; i < this.get('data').length; i++){
					this.get('widget_object').plotData(eval(this.get('data')[i]))
				}
			}
		}
	});


	module.exports = {
		PanelModel: PanelModel,
		ComponentModel: ComponentModel,
		StateVariableSync: StateVariableSync,
		ModelSync: ModelSync,
		ExperimentSync: ExperimentSync,
		ProjectSync: ProjectSync,
		WidgetSync: WidgetSync,
		PlotWidgetSync: PlotWidgetSync
	};
});