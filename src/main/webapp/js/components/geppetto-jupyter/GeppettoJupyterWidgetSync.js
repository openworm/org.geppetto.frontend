define(function (require, exports, module) {

	var jupyter_widgets = require('jupyter-js-widgets');

	var WidgetSync = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
			widget_id: '',
			name: '',
			data: [],
			position_x: null,
			position_y: null,
			width: null,
			height: null,
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
				if (this.get('position_x') > 0 && this.get('position_y') > 0) {
					widget.setPosition(this.get('position_x'), this.get('position_y'))
				}
				if (this.get('width') > 0 && this.get('height') > 0){
					widget.setSize(this.get('width'), this.get('height'));
				}
			}

			this.on("change:data", function (model, value, options) {
				if (this.get('widget_id') == 0){
					for (valueIndex in value){
						this.get('widget_object').plotData(eval(value[valueIndex]))
					}
				}
				else {
					// FIXME: Is this right? Can we pass arrays?
					this.get('widget_object').setMessage(eval(value[0]))
				}
				
			});
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
 					this.get('widget_object').setMessage(this.get('data')[i])
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