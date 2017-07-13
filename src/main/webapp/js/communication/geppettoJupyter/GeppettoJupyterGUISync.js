define(function (require, exports, module) {

	var React = require('react');
	var ReactDOM = require('react-dom');

	var PanelComp = require('../../components/controls/panel/Panel');
	var CheckboxComp = require('../../components/controls/Checkbox');
	var TextFieldComp = require('../../components/controls/TextField');
	var RaisedButtonComp = require('../../components/controls/RaisedButton');
	var LabelComp = require('../../components/controls/Label');
	var DropDownComp = require('../../components/controls/DropDown');

	var jupyter_widgets = require('jupyter-js-widgets');
	var GEPPETTO = require('geppetto');

	var $ = require('jquery'); 
	var _ = require('underscore');

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
			model.send({ event: 'change', data: value });
		},

		handleBlur: function (model, value) {
			model.set('sync_value', value);
			model.save_changes();
			model.send({ event: 'blur', data: value });
		},

		getParameters: function(parameters){
			parameters['id'] = this.get('widget_id');
			parameters['name'] = this.get('widget_name');
			parameters['sync_value'] = this.get('sync_value');
			parameters['handleChange'] = this.handleChange.bind(null, this);
			parameters['handleBlur'] = this.handleBlur.bind(null, this);
			parameters['isStateless'] = true;
			return parameters;
		},

		getComponent: function (componentItem, parameters, container) {
			
			var component = GEPPETTO.ComponentFactory._addComponent(componentItem, this.get('componentType'), this.getParameters(parameters),
				 container, undefined, (this.get("embedded") == false));
			this.set('component', component);

			return component;
		}
	});

	var PanelSync = ComponentSync.extend({
		defaults: _.extend({}, ComponentSync.prototype.defaults, {
			items: [],
			position_x: null,
			position_y: null,
			width: null,
			height: null,
			properties: {},
			componentType: "PANEL",
			triggerClose: true
		}),

		initialize: function () {
			PanelSync.__super__.initialize.apply(this);
			this.on("msg:custom", this.handle_custom_messages, this);
			this.on("comm:close", this.close_panel, this);
			this.on("change:widget_name", function (model, value, options) {
				this.get("component").setName(this.get("widget_name"));
			});
		},
		
		close_panel: function (msg) {
			this.set('triggerClose', false);
			$("." + this.get('widget_id') + "_dialog").find(".ui-dialog-titlebar-close").click();
		},

		getComponent: function () {
			var parameters = { items: this.getChildren(), parentStyle: this.get('parentStyle')};
			return PanelSync.__super__.getComponent.apply(this, [PanelComp, parameters, null]);
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
			var comp = this.getComponent();
			//this.set('component', GEPPETTO.ComponentFactory._addComponent(comp, "PANEL", { items: this.getChildren(), parentStyle: this.get('parentStyle') },
			//	 document.getElementById('widgetContainer'), undefined, true));
			this.set('component', GEPPETTO.ComponentFactory._renderComponent(comp, "PANEL", this.getParameters({ items: this.getChildren(), parentStyle: this.get('parentStyle') }),
				 document.getElementById('widgetContainer'), undefined, true));

			// On close send a message to python to remove objects
			var that = this;
			$("#" + this.get('widget_id') + "_dialog").on("remove", function () {
				if (that.get('triggerClose')){
					that.send({ event: 'close'});
				}
			});


			// Do not allow resizable for parent panel
            var selector = $("." + this.get('widget_id') + "_dialog");
			selector.resizable('destroy');

			// Do not allow close depending on property
			for (var propertyName in this.get("properties")){
				if (propertyName == "closable" && this.get("properties")["closable"] == false){
                    this.get("component").showCloseButton(false);
				}
			}

			this.get("component").setPosition(this.get('position_x'), this.get('position_y'));
			this.get("component").setSize(this.get('height'), this.get('width'));
			this.get("component").showHistoryIcon(false);
			this.get("component").setName(this.get("widget_name"));
		},

		handle_custom_messages: function (msg) {
			if (msg.type === 'display') {
				this.display();
			}
			else if (msg.type === 'shake') {
				this.get("component").shake();
			}
		}
	}, {
			serializers: _.extend({
				items: { deserialize: jupyter_widgets.unpack_models },
			}, jupyter_widgets.WidgetModel.serializers)
		});

	var DropDownSync = ComponentSync.extend({
		defaults: _.extend({}, ComponentSync.prototype.defaults, {
			items: []
		}),

		initialize: function () {
			DropDownSync.__super__.initialize.apply(this);
			// this.on("msg:custom", this.handle_custom_messages, this);
			this.on("change:items", function (model, value, options) {
				model.get('parent').forceRender();
			});
		},
		handleChange: function (model, value) {
			model.set('sync_value', value);
			model.save_changes();
			DropDownSync.__super__.handleChange.apply(this, [model, value]);
		},

		getComponent: function () {
			var parameters = { items: this.get('items') };
			return DropDownSync.__super__.getComponent.apply(this, [DropDownComp, parameters]);
		}

	});

	var TextFieldSync = ComponentSync.extend({

		defaults: _.extend({}, ComponentSync.prototype.defaults, {
			read_only: false
		}),
		initialize: function (options) {
			TextFieldSync.__super__.initialize.apply(this, arguments);
		},
		getComponent: function () {
			var parameters = { readOnly: this.get('read_only') };
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
			var parameters = { handleClick: this.handleClick.bind(null, this) };
			return ButtonSync.__super__.getComponent.apply(this, [RaisedButtonComp, parameters, null]);
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
		LabelSync: LabelSync,
		DropDownSync: DropDownSync
	};
});