

/**
 * Class used to create widgets and handle widget events from parent class.
 */
define(function (require) {

    return function (GEPPETTO) {

        /**
         *
         * Widgets
         *
         * Different types of widgets that exist
         *
         * @enum
         */
        GEPPETTO.Widgets = {
            PLOT: 0,
            POPUP: 1,
            TREEVISUALISERDAT: 3,
            VARIABLEVISUALISER: 5,
            CONNECTIVITY: 6,
            STACKVIEWER: 8 
            //WIDGETNAME: N
        };

        /**
         * @exports Widgets/GEPPETTO.WidgetFactory
         */
        GEPPETTO.WidgetFactory = {

            plotsController: null,
            popupsController: null,
            connectivityController: null,
            variableVisController: null,
            treeVisDatController: null,
            treeVis3DController: null,
            stackViewer3DController: null,
            //WIDGETNAMEController: null

            /**
             * Adds widgets to Geppetto
             *
             * @param widgetType - what type of widget gets added
             * @param isStateless - boolean that controls if the widget is stateless and persisted in views or not (false by default)
             * @returns {*}
             */
            addWidget:  function (widgetType, isStateless, callback) {
                return new Promise(resolve => {

                    this.getController(widgetType).then(controller => {

                        controller.addWidget(isStateless).then(widget => {
                            if(callback){
                                callback(widget);
                            }
                            resolve(widget);
                        });

                    });

                });
            },

            getController: function (type) {
            	return new Promise(resolve => {
            	require.ensure([],function(require){
            	    
                    if (type == GEPPETTO.Widgets.PLOT) {
                        if (this.plotsController == null || undefined) {
                        	PlotsController = require('./plot/controllers/PlotsController');
                            this.plotsController = new PlotsController();
                        }
                        resolve(this.plotsController);
                    }
                    else if (type == GEPPETTO.Widgets.POPUP) {
                        if (this.popupsController == null || undefined) {
                        	PopupsController = require('./popup/controllers/PopupController');
                            this.popupsController = new PopupsController();
                        }
                        resolve(this.popupsController);
                    }
                    else if (type == GEPPETTO.Widgets.TREEVISUALISERDAT) {
                        if (this.treeVisDatController == null || undefined) {
                        	TreeVisualiserControllerDAT = require('./treevisualiser/treevisualiserdat/controllers/TreeVisualiserControllerDAT');
                            this.treeVisDatController = new TreeVisualiserControllerDAT();
                        }
                        resolve(this.treeVisDatController);
                    }
                    else if (type == GEPPETTO.Widgets.VARIABLEVISUALISER) {
                        if (this.variableVisController == null || undefined) {
                        	VariableVisualizerController = require('./variablevisualiser/controllers/VariableVisualiserController');
                            this.variableVisController = new VariableVisualizerController();
                        }
                        resolve(this.variableVisController);
                    }
                    else if (type == GEPPETTO.Widgets.CONNECTIVITY) {
                        if (this.connectivityController == null || undefined) {
                        	ConnectivityController = require('./connectivity/controllers/ConnectivityController');
                            this.connectivityController = new ConnectivityController();
                        }
                        resolve(this.connectivityController);
                    }
                    else if (type == GEPPETTO.Widgets.STACKVIEWER) {
                        if (this.stackViewerController == null || undefined) {
                        	StackViewerController = require('./stackViewer/controllers/StackViewerController');
                            this.stackViewerController = new StackViewerController();
                        }
                        resolve(this.stackViewerController);
                    }
                    //Use as template for new widgets
                    //else if (type == GEPPETTO.Widgets.WIDGETNAME) {
                    //    if (this.WIDGETNAMEController == null || undefined) {
            	    //		  WIDGETNAMEController = require('widgets/buttonBar/controllers/WIDGETNAMEController');
                    //        this.WIDGETNAMEController = new WIDGETNAMEController();
                    //    }
                    //    return this.WIDGETNAMEController;
                    //}
            	});
            	});

            }
        };
    };
});
