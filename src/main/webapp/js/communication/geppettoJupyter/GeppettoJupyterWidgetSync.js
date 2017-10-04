define(function (require, exports, module) {

	var jupyter_widgets = require('jupyter-js-widgets');

	var _ = require('underscore');

	var WidgetSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			widget_id: '',
			name: '',
			data: [],
			position_x: null,
			position_y: null,
			width: null,
			height: null,
			widget_object: null,
			triggerClose: true
		}),
		initialize: async function () {
			WidgetSync.__super__.initialize.apply(this);

			if (this.get('widget_id') > -1) {
				var widget = await G.addWidget(this.get('widget_id'))
				this.set('widget_object', widget)

				if (this.get('name') != '') {
					widget.setName(this.get('name'))
				}
				if (this.get('position_x') > 0 && this.get('position_y') > 0) {
					widget.setPosition(this.get('position_x'), this.get('position_y'))
				}
				if (this.get('width') > 0 && this.get('height') > 0) {
					widget.setSize(this.get('width'), this.get('height'));
				}
			}

			var that = this;
			$("#" + this.get('widget_object').id).on("remove", function () {
				if (that.get('triggerClose')){
					that.send({ event: 'close' });
				}
			});

			this.on("msg:custom", this.handle_custom_widget_messages, this);
			this.on("comm:close", this.close_widget, this);
		},

		close_widget: function (msg) {
			this.set('triggerClose', false);
			this.get('widget_object').destroy();
		},

		handle_custom_widget_messages: function (msg) {
			if (msg.command === 'shake') {
				this.get('widget_object').shake()
			}
		}
	});

	var PlotWidgetSync = WidgetSync.extend({
		initialize: function () {

			PlotWidgetSync.__super__.initialize.apply(this);

			if (this.get('data').length > 0) {
				for (var i = 0; i < this.get('data').length; i++) {
					this.get('widget_object').plotData(eval(this.get('data')[i]))
				}
			}

			this.on("msg:custom", this.handle_custom_messages, this);
		},
		handle_custom_messages: function (msg) {
			if (msg.command === 'plot') {
				if (msg.plot_mode === 'plot_data') {
					this.plotData()
				}
				else if (msg.plot_mode === 'plot_XY_data') {
					this.plotXYData()
				}
			}
		},
		plotData: function () {
			if (this.get('widget_object').datasets.length > 0){
				this.get('widget_object').resetPlot(true);
			}
			for (var dataIndex in this.get('data')) {
				var item = this.get('data')[dataIndex];
				this.get('widget_object').plotData(eval(item));
			}
		},
		plotXYData: function () {
			if (this.get('widget_object').datasets.length > 0){
				this.get('widget_object').resetPlot(true);
			}
			this.get('widget_object').plotXYData(eval(this.get('data')[0]), eval(this.get('data')[1]))
		}

	});

	var PopupWidgetSync = WidgetSync.extend({
		initialize: function () {
			PopupWidgetSync.__super__.initialize.apply(this);

			if (this.get('data').length > 0) {
				for (var i = 0; i < this.get('data').length; i++) {
					this.get('widget_object').setMessage(this.get('data')[i])
				}
			}

			this.on("change:data", function (model, value, options) {
				// FIXME: Is this right? Can we pass arrays?
				this.get('widget_object').setMessage(eval(value[0]))
			});

		}
	});

	module.exports = {
		WidgetSync: WidgetSync,
		PlotWidgetSync: PlotWidgetSync,
		PopupWidgetSync: PopupWidgetSync
	};
});