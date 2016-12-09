define(function (require, exports, module) {

	var React = require('react');
	var ReactDOM = require('react-dom');

	var PanelComp = require('jsx!components/dev/panel/Panel');
	var CheckboxComp = require('jsx!components/dev/BasicComponents/Checkbox');
	var TextFieldComp = require('jsx!components/dev/BasicComponents/TextField');
	var RaisedButtonComp = require('jsx!components/dev/BasicComponents/RaisedButton');

	require('./vendor/jupyter_widgets');
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
				model.save_changes();
			}
			model.send({ event: 'change', data: parseFloat(value) });
		},

		handleBlur: function (model, value) {
			model.set('sync_value', value);
			model.save_changes();
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

	module.exports = {
		PanelModel: PanelModel,
		ComponentModel: ComponentModel
	};
});