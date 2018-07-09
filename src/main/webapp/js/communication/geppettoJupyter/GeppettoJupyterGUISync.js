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
			value: undefined,
			parent: null,
			componentType: undefined
		}),

		initialize: function (options) {
			ComponentSync.__super__.initialize.apply(this, arguments);

			this.on("msg:custom", this.handle_custom_messages, this);
			this.on("change:value", this.handle_value_change, this);

		},

		syncValueWithPython: function (value, requirement) {
			var jsonValue = JSON.stringify(value);
			this.set('value', jsonValue);
			this.save_changes();
			this.send({ event: 'sync_value', value: jsonValue, requirement: requirement });
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

	var PanelSync = ComponentSync.extend({
		defaults: _.extend({}, ComponentSync.prototype.defaults, {
			items: [],
			position_x: null,
			position_y: null,
			width: null,
			height: null,
			componentType: "PANEL",
			properties: {},
			triggerClose: true
		}),

		initialize: function () {
			PanelSync.__super__.initialize.apply(this);
			this.on("msg:custom", this.handle_custom_messages, this);
			this.on("comm:close", this.close_panel, this);
			this.on("change:widget_name", function (model, value, options) {
				this.component.setName(this.get("widget_name"));
			});
			this.on("change:items", function (model, value, options) {
				console.log("taka");
				this.forceRender();
			});
		},

		close_panel: function (msg) {
			this.set('triggerClose', false);
			$("." + this.get('widget_id') + "_dialog").find(".ui-dialog-titlebar-close").click();
		},

		getComponent: function () {
			var parameters = { items: this.getChildren(), parentStyle: this.get('parentStyle') };
			return PanelSync.__super__.getComponent.apply(this, [PanelComp, parameters, null]);
		},

		forceRender: function () {
			if (this.get("embedded") == false) {
				this.component.setChildren(this.getChildren());
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
			this.component = GEPPETTO.ComponentFactory._renderComponent(comp, "PANEL", this.getParameters({ items: this.getChildren(), parentStyle: this.get('parentStyle') }),
				document.getElementById('widgetContainer'), undefined, true);

			// On close send a message to python to remove objects
			var that = this;
			$("#" + this.get('widget_id') + "_dialog").on("remove", function () {
				if (that.get('triggerClose')) {
					that.send({ event: 'close' });
				}
			});


			// Do not allow resizable for parent panel
			var selector = $("." + this.get('widget_id') + "_dialog");
			selector.resizable('destroy');

			// Do not allow close depending on property
			for (var propertyName in this.get("properties")) {
				if (propertyName == "closable" && this.get("properties")["closable"] == false) {
					this.component.showCloseButton(false);
				}
			}

			this.component.setPosition(this.get('position_x'), this.get('position_y'));
			this.component.setSize(this.get('height'), this.get('width'));
			this.component.showHistoryIcon(false);
			this.component.setName(this.get("widget_name"));
		},

		handle_custom_messages: function (msg) {
			if (msg.type === 'display') {
				this.display();
			}
			else if (msg.type === 'shake') {
				this.component.shake();
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
			read_only: false,
			componentType: "TEXTFIELD"
		}),
		initialize: function (options) {
			TextFieldSync.__super__.initialize.apply(this, arguments);
			this.on("msg:custom", this.handle_custom_messages, this);
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
			componentType: "RAISEDBUTTON"
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
		ComponentSync: ComponentSync,
		PanelSync: PanelSync,
		TextFieldSync: TextFieldSync,
		CheckboxSync: CheckboxSync,
		ButtonSync: ButtonSync,
		LabelSync: LabelSync,
		DropDownSync: DropDownSync
	};
});
