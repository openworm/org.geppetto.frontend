define(function (require) {

	return function (GEPPETTO) {

		var WidgetController = require('./WidgetController');

		GEPPETTO.NewWidgetFactory = {

			_widgetsControllers : {},
		
			getController: function(componentID) {
				if(!(componentID in this._widgetsControllers)){
					this._widgetsControllers[componentID] = new WidgetController(componentID);
				}
				return this._widgetsControllers[componentID];
			},

			/**
             * Update all subscribed controller classes with new changes
             *
             * @param {Object} arguments - Set arguments with information to update the widgets
             */
            update: function (event, parameters) {
                for (var i = 0; i < _widgetsControllers.length; i++) {
                    this._widgetsControllers[i].update(event, parameters);
                }
            }
					
	    };
	};
});
