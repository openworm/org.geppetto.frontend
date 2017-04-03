

/**
 * Class used to create widgets and handle widget events from parent class.
 */
define(function (require) {

    PlotsController = require('./plot/controllers/PlotsController');
    ConnectivityController = require('./connectivity/controllers/ConnectivityController');
    PopupsController = require('./popup/controllers/PopupController');
    TreeVisualiserControllerDAT = require('./treevisualiser/treevisualiserdat/controllers/TreeVisualiserControllerDAT');
    VariableVisualizerController = require('./variablevisualiser/controllers/VariableVisualiserController');
    ButtonBarController = require('./buttonBar/controllers/ButtonBarController');
    StackViewerController = require('./stackViewer/controllers/StackViewerController');
    //Use as template for new widgets
    //WIDGETNAMEController = require('widgets/buttonBar/controllers/WIDGETNAMEController');

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
            BUTTONBAR: 7,
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
            ButtonBarController: null,
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
            addWidget: function (widgetType, isStateless) {
                var widget = null;
                switch (widgetType) {
                    //create plotting widget
                    case GEPPETTO.Widgets.PLOT:
                        widget = this.getController(GEPPETTO.Widgets.PLOT).addPlotWidget(isStateless);
                        break;
                    //create popup widget
                    case GEPPETTO.Widgets.POPUP:
                        widget = this.getController(GEPPETTO.Widgets.POPUP).addPopupWidget(isStateless);
                        break;
                    //create tree visualiser DAT widget
                    case GEPPETTO.Widgets.TREEVISUALISERDAT:
                        widget = this.getController(GEPPETTO.Widgets.TREEVISUALISERDAT).addTreeVisualiserDATWidget(isStateless);
                        break;
                    //create variable visualiser widget
                    case GEPPETTO.Widgets.VARIABLEVISUALISER:
                        widget = this.getController(GEPPETTO.Widgets.VARIABLEVISUALISER).addVariableVisualiserWidget(isStateless);
                        break;
                    //create connectivity widget
                    case GEPPETTO.Widgets.CONNECTIVITY:
                        widget = this.getController(GEPPETTO.Widgets.CONNECTIVITY).addConnectivityWidget(isStateless);
                        break;
                    //create button bar
                    case GEPPETTO.Widgets.BUTTONBAR:
                        widget = this.getController(GEPPETTO.Widgets.BUTTONBAR).addButtonBarWidget(isStateless);
                    	break;
                    //create stack viewer
                    case GEPPETTO.Widgets.STACKVIEWER:
                        widget = this.getController(GEPPETTO.Widgets.STACKVIEWER).addStackViewerWidget(isStateless);
                        break;
                    //Use as template for new widgets
                    //create WIDGETNAME
                    //case GEPPETTO.Widgets.WIDGETNAME:
                    //    widget = this.getController(GEPPETTO.Widgets.WIDGETNAME).addWIDGETNAMEWidget();
                    //    break;
                    default:
                        break;
                }

                // add to component factory stack
                // NOTE: this will go away after widgets/components refactoring
                var components = GEPPETTO.ComponentFactory.getComponents();
                components[widget.getId()] = widget;

                return widget;
            },

            /**
             * Removes widget from Geppetto
             *
             * @param {GEPPETTO.Widgets}
             *            widgetType - Widget to remove from Geppetto
             */
            removeWidget: function (widgetType) {
                this.getController(widgetType).removeWidgets();
                //TODO Matteo: refactor this a complete custom string doesn't seem to be necessary
                switch (widgetType) {
                    case GEPPETTO.Widgets.PLOT:
                        return GEPPETTO.Resources.REMOVE_PLOT_WIDGETS;
                    case GEPPETTO.Widgets.POPUP:
                        return GEPPETTO.Resources.REMOVE_POPUP_WIDGETS;
                    case GEPPETTO.Widgets.TREEVISUALISERDAT:
                        return GEPPETTO.Resources.REMOVE_TREEVISUALISERDAT_WIDGETS;
                    case GEPPETTO.Widgets.VARIABLEVISUALISER:
                        return GEPPETTO.Resources.REMOVE_VARIABLEVISUALISER_WIDGETS;
                    case GEPPETTO.Widgets.CONNECTIVITY:
                        return GEPPETTO.Resources.REMOVE_CONNECTIVITY_WIDGETS;
                    case GEPPETTO.Widgets.BUTTONBAR:
                        return GEPPETTO.Resources.REMOVE_BUTTONBAR_WIDGETS;
                    case GEPPETTO.Widgets.STACKVIEWER:
                        return GEPPETTO.Resources.REMOVE_STACKVIEWER_WIDGETS;
                    //Use as template for new widgets
                    //case GEPPETTO.Widgets.WIDGETNAME:
                    //    return GEPPETTO.Resources.REMOVE_WIDGETNAME_WIDGETS;
                    default:
                        return GEPPETTO.Resources.NON_EXISTENT_WIDGETS;
                }
            },

            getController: function (type) {
                if (type == GEPPETTO.Widgets.PLOT) {
                    if (this.plotsController == null || undefined) {
                        this.plotsController = new PlotsController();
                    }
                    return this.plotsController;
                }
                else if (type == GEPPETTO.Widgets.POPUP) {
                    if (this.popupsController == null || undefined) {
                        this.popupsController = new PopupsController();
                    }
                    return this.popupsController;
                }
                else if (type == GEPPETTO.Widgets.TREEVISUALISERDAT) {
                    if (this.treeVisDatController == null || undefined) {
                        this.treeVisDatController = new TreeVisualiserControllerDAT();
                    }
                    return this.treeVisDatController;
                }
                else if (type == GEPPETTO.Widgets.VARIABLEVISUALISER) {
                    if (this.variableVisController == null || undefined) {
                        this.variableVisController = new VariableVisualizerController();
                    }
                    return this.variableVisController;
                }
                else if (type == GEPPETTO.Widgets.CONNECTIVITY) {
                    if (this.connectivityController == null || undefined) {
                        this.connectivityController = new ConnectivityController();
                    }
                    return this.connectivityController;
                }
                else if (type == GEPPETTO.Widgets.BUTTONBAR) {
                    if (this.buttonBarController == null || undefined) {
                        this.buttonBarController = new ButtonBarController();
                    }
                    return this.buttonBarController;
                }
                else if (type == GEPPETTO.Widgets.STACKVIEWER) {
                    if (this.stackViewerController == null || undefined) {
                        this.stackViewerController = new StackViewerController();
                    }
                    return this.stackViewerController;
                }
                //Use as template for new widgets
                //else if (type == GEPPETTO.Widgets.WIDGETNAME) {
                //    if (this.WIDGETNAMEController == null || undefined) {
                //        this.WIDGETNAMEController = new WIDGETNAMEController();
                //    }
                //    return this.WIDGETNAMEController;
                //}
            }
        };
    };
});
