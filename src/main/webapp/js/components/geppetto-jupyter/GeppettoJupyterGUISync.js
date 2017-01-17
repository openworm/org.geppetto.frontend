define(function (require, exports, module) {

	var React = require('react');
	var ReactDOM = require('react-dom');

	var PanelComp = require('jsx!components/dev/panel/Panel');
	var CheckboxComp = require('jsx!components/dev/BasicComponents/Checkbox');
	var TextFieldComp = require('jsx!components/dev/BasicComponents/TextField');
	var RaisedButtonComp = require('jsx!components/dev/BasicComponents/RaisedButton');
	var LabelComp = require('jsx!components/dev/BasicComponents/Label');

	require('./vendor/jupyter_widgets');
	var GEPPETTO = require('geppetto');

	var $ = require('jquery');

	var ComponentSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			sync_value: undefined,
			parent: null,
			component: null
		}),

		initialize: function (options) {
			ComponentSync.__super__.initialize.apply(this, arguments);
			this.on("change:sync_value", function (model, value, options) {
				model.get('parent').forceRender();
			});
		},

		handleChange: function (model, value) {
			model.send({ event: 'change', data: parseFloat(value) });
		},

		handleBlur: function (model, value) {
			model.set('sync_value', value);
			model.save_changes();
			model.send({ event: 'blur', data: parseFloat(value) });
		},

		getComponent: function (componentItem, parameters) {
			parameters['id'] = this.get('widget_id')
			parameters['name'] = this.get('widget_name')
			parameters['sync_value'] = this.get('sync_value')
			parameters['handleChange'] = this.handleChange.bind(null, this)
			parameters['handleBlur'] = this.handleBlur.bind(null, this)

			var component = React.createFactory(componentItem)(parameters)
			this.set('component', component);
			return component;
		}
	});

	var PanelSync = ComponentSync.extend({
		defaults: _.extend({}, ComponentSync.prototype.defaults, {
			items: [],
			positionX: null,
			positionY: null
		}),

		initialize: function () {
			PanelSync.__super__.initialize.apply(this);
			this.on("msg:custom", this.handle_custom_messages, this);
		},

		getComponent: function () {
			var parameters = { items: this.getChildren(), parentStyle: this.get('parentStyle') }
			return PanelSync.__super__.getComponent.apply(this, [PanelComp, parameters]);
		},

		forceRender: function () {
			if (this.get("embedded") == false) {
				this.get("component").setChildren(this.getChildren());
			}
			else {
				this.get("parent").forceRender();
			}
		},

		getChildren: function () {
			var children = [];
			for (var i = 0; i < this.get('items').length; i++) {
				var item = this.get('items')[i];
				item.set('parent', this);
				children.push(item.getComponent())
			}
			return children;
		},

		display: function () {
			this.set('component', GEPPETTO.ComponentFactory.renderComponent(this.getComponent()));

			//TODO: This can be done in a much more elegant way
			if (this.get('positionX') > 0) {
				$("." + this.get('widget_id') + "_dialog").css({ left: this.get('positionX') });
			}
			if (this.get('positionY') > 0) {
				$("." + this.get('widget_id') + "_dialog").css({ top: this.get('positionY') });
			}
		},

		handle_custom_messages: function (msg) {
			if (msg.type === 'display') {
				this.display();
			}
		}
	}, {
			serializers: _.extend({
				items: { deserialize: jupyter_widgets.unpack_models },
			}, jupyter_widgets.WidgetModel.serializers)
		});

	var TextFieldSync = ComponentSync.extend({

		defaults: _.extend({}, ComponentSync.prototype.defaults, {
			read_only: false
		}),
		initialize: function (options) {
			TextFieldSync.__super__.initialize.apply(this, arguments);
		},
		getComponent: function () {
			var parameters = { readOnly: this.get('read_only') }
			return TextFieldSync.__super__.getComponent.apply(this, [TextFieldComp, parameters]);
		}
	});

	var CheckboxSync = ComponentSync.extend({

		defaults: _.extend({}, ComponentSync.prototype.defaults, {

		}),
		initialize: function (options) {
			CheckboxSync.__super__.initialize.apply(this, arguments);
		},
		handleChange: function (model, value) {
			model.set('sync_value', value);
			model.save_changes();
			CheckboxSync.__super__.handleChange.apply(this, [model, value]);
		},
		getComponent: function () {
			return CheckboxSync.__super__.getComponent.apply(this, [CheckboxComp, {}]);
		}
	});

	var ButtonSync = ComponentSync.extend({

		defaults: _.extend({}, ComponentSync.prototype.defaults, {

		}),
		initialize: function (options) {
			ButtonSync.__super__.initialize.apply(this, arguments);
		},
		getComponent: function () {
			var parameters = { handleClick: this.handleClick.bind(null, this) }
			return ButtonSync.__super__.getComponent.apply(this, [RaisedButtonComp, parameters]);
		},

		handleClick: function (model) {
			model.send({ event: 'click', data: { info: 'data sent' } });
		}
	});

	var LabelSync = ComponentSync.extend({

		defaults: _.extend({}, ComponentSync.prototype.defaults, {
		}),
		initialize: function (options) {
			LabelSync.__super__.initialize.apply(this, arguments);
		},
		getComponent: function () {
			return CheckboxSync.__super__.getComponent.apply(this, [LabelComp, {}]);
		}
	});

	module.exports = {
		PanelSync: PanelSync,
		TextFieldSync: TextFieldSync,
		CheckboxSync: CheckboxSync,
		ButtonSync: ButtonSync,
		LabelSync: LabelSync
	};
});