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

	var PanelView = jupyter_widgets.WidgetView.extend({
		initialize: function (options) {
			this.options = options || {};
			this.options.parent = options.parent;
			this.componentItems = [];

			PanelView.__super__.initialize.apply(this, arguments);
		},

		add_item: function (model) {
			var that = this;

			var componentView = this.create_child_view(model)
				.then(function (view) {
					return view;
				});
			return componentView.then(function (view) {
				return view.getComponent();
			}).then(function (component) {
				that.componentItems.push(component);
				return componentView;
			});

		},

		forceRender: function () {
			this.componentItems = [];

			var that = this;
			Promise.all(this.itemsList.views).then(function (views) {

				Promise.all(views.map(function (currentView) {
					return currentView.getComponent().then(function (component) {
						that.componentItems.push(component);
						return component;
					});
				})).then(function () {
					if (that.model.get("embedded") == false) {
						that.model.get("component").setChildren(that.componentItems);
					}
					else {
						that.options.parent.forceRender();
					}
				});
			});
		},

		getComponent: function () {
			var that = this;
			return Promise.all(this.itemsList.views).then(function (views) {
				return React.createFactory(PanelComp)({ id: that.model.get('widget_id'), name: that.model.get('widget_name'), items: that.componentItems, parentStyle: that.model.get('parentStyle') });
			});
		},

		// Render the view.
		render: function () {
			//Serialize single instance
			//var items_promise = this.set_Items(this.model.get("items"));

			this.componentItems = [];

			this.itemsList = new jupyter_widgets.ViewList(this.add_item, null, this);
			this.itemsList.update(this.model.get("items"));


			var that = this;
			if (this.model.get("embedded") == false) {
				this.getComponent().then(function (component) {
					that.model.set("component", GEPPETTO.ComponentFactory.renderComponent(component));
					that.$el = $("." + that.model.get('widget_id') + "_dialog");
					if (that.model.get('positionX') > 0) {
						that.$el.css({ left: that.model.get('positionX') });
					}
					if (that.model.get('positionY') > 0) {
						that.$el.css({ top: that.model.get('positionY') });
					}
				});
			}
		}
	});

	var PanelModel = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: "PanelModel",
			_view_name: "PanelView",
			_model_module: "panel",
			_view_module: "panel",

			items: [],
			component: null,
			positionX: null,
			positionY: null
		}),

		initialize: function () {
			PanelModel.__super__.initialize.apply(this);
		},
	}, {
			serializers: _.extend({
				items: { deserialize: jupyter_widgets.unpack_models },
			}, jupyter_widgets.WidgetModel.serializers)
		});

	var ComponentView = jupyter_widgets.WidgetView.extend({
		initialize: function (options) {
			this.options = options || {};
			this.options.parent = options.parent;
			ComponentView.__super__.initialize.apply(this, arguments);
		},

		handleClick: function (view) {
			var data = { info: 'data sent' };
			view.send({ event: 'click', data: data });
		},

		handleChange: function (view, value) {
			//TODO: Extract to an specific class (for checkbox component we need to save the value on change)
			if (view.model.get('component_name') == 'CHECKBOX') {
				view.model.set('sync_value', value);
				view.touch();
			}
			view.send({ event: 'change', data: parseFloat(value) });
		},

		handleBlur: function (view, value) {
			view.model.set('sync_value', value);
			view.touch();
			view.send({ event: 'blur', data: parseFloat(value) });
		},

		getComponent: function () {
			var componentName = this.model.get('component_name');
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
			return Promise.resolve(React.createFactory(componentItem)({ id: this.model.get('widget_id'), label: this.model.get('widget_name'), parentStyle: this.model.get('parentStyle'), sync_value: this.model.get('sync_value'), handleClick: this.handleClick.bind(null, this), handleChange: this.handleChange.bind(null, this), handleBlur: this.handleBlur.bind(null, this) }));
			//return Promise.resolve(GEPPETTO.ComponentFactory.getComponent(this.model.get('component_name'),{id:this.model.get('widget_id'), label:this.model.get('widget_name'), parentStyle:this.model.get('parentStyle'), sync_value: this.model.get('sync_value'), handleClick: this.handleClick.bind(null, this), handleChange: this.handleChange.bind(null, this), handleBlur: this.handleBlur.bind(null, this)}));
		},

		// Render the view.
		render: function () {
			var that = this;
			this.model.on("change:sync_value", function (model, value, options) {
				that.options.parent.forceRender();
			}, that);
		}
	});

	var ComponentModel = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			_model_name: 'ComponentModel',
			_view_name: 'ComponentView',
			_model_module: "component",
			_view_module: "component",

			sync_value: undefined,
			component: null
		}),

		initialize: function () {
			ComponentModel.__super__.initialize.apply(this);
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
		PanelView: PanelView,
		PanelModel: PanelModel,
		ComponentView: ComponentView,
		ComponentModel: ComponentModel,
		StateVariableSync: StateVariableSync,
		ModelSync: ModelSync,
		ExperimentSync: ExperimentSync,
		ProjectSync: ProjectSync,
		WidgetSync: WidgetSync,
		PlotWidgetSync: PlotWidgetSync
	};
});