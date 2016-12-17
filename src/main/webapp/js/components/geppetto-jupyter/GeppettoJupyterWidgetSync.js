define(function (require, exports, module) {

	require('./vendor/jupyter_widgets');

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

	var PopupWidgetSync = WidgetSync.extend({
 		_model_name: 'PopupWidgetSync',
 		_model_module: "model",
 
 		initialize: function () {
 			PopupWidgetSync.__super__.initialize.apply(this);
 
 			if (this.get('data').length > 0) {
 				for (var i = 0; i < this.get('data').length; i++){
 					this.get('widget_object').plotData(eval(this.get('data')[i]))
 				}
 			}
 		}
 	});

	module.exports = {
		WidgetSync: WidgetSync,
		PlotWidgetSync: PlotWidgetSync,
		PopupWidgetSync: PopupWidgetSync
	};
});