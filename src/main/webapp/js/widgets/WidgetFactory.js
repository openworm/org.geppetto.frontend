/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

/**
 * Class used to create widgets and handle widget events from parent class.
 */
define(function (require) {

    PlotsController = require('widgets/plot/controllers/PlotsController');
    Scatter3dController = require('widgets/scatter3d/controllers/Scatter3dController');
    ConnectivityController = require('widgets/connectivity/controllers/ConnectivityController');
    PopupsController = require('widgets/popup/controllers/PopupController');
    TreeVisualiserControllerD3 = require('widgets/treevisualiser/treevisualiserd3/controllers/TreeVisualiserControllerD3');
    TreeVisualiserControllerDAT = require('widgets/treevisualiser/treevisualiserdat/controllers/TreeVisualiserControllerDAT');
    VariableVisualizerController = require('widgets/variablevisualiser/controllers/VariableVisualiserController');
    ButtonBarController = require('widgets/buttonBar/controllers/ButtonBarController')
    MyNameController = require('widgets/myname/controllers/MyNameController');
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
            SCATTER3D: 2,
            TREEVISUALISERDAT: 3,
            TREEVISUALISERD3: 4,
            VARIABLEVISUALISER: 5,
            CONNECTIVITY: 6,
            BUTTONBAR: 7,
            MYNAME: 8
            //WIDGETNAME: N
        };

        /**
         * @exports Widgets/GEPPETTO.WidgetFactory
         */
        GEPPETTO.WidgetFactory = {

            plotsController: null,
            popupsController: null,
            connectivityController: null,
            scatter3dController: null,
            variableVisController: null,
            ButtonBarController: null,
            treeVisDatController: null,
            treeVis3DController: null,
            mynameController: null,

            /**
             * Adds widget to Geppetto
             *
             * @param {GEPPETTO.Widgets}
             *            widgetType - Widget to add to Geppetto
             */
            addWidget: function (widgetType) {
                var widget = null;
                switch (widgetType) {
                    //create plotting widget
                    case GEPPETTO.Widgets.PLOT:
                        widget = this.getController(GEPPETTO.Widgets.PLOT).addPlotWidget();
                        break;
                    //create popup widget
                    case GEPPETTO.Widgets.POPUP:
                        widget = this.getController(GEPPETTO.Widgets.POPUP).addPopupWidget();
                        break;
                    //create scatter widget
                    case GEPPETTO.Widgets.SCATTER3D:
                        widget = this.getController(GEPPETTO.Widgets.SCATTER3D).addScatter3dWidget();
                        break;
                    //create tree visualiser DAT widget
                    case GEPPETTO.Widgets.TREEVISUALISERDAT:
                        widget = this.getController(GEPPETTO.Widgets.TREEVISUALISERDAT).addTreeVisualiserDATWidget();
                        break;
                    //create tree visualiser D3 widget
                    case GEPPETTO.Widgets.TREEVISUALISERD3:
                        widget = this.getController(GEPPETTO.Widgets.TREEVISUALISERD3).addTreeVisualiserD3Widget();
                        break;
                    //create variable visualiser widget
                    case GEPPETTO.Widgets.VARIABLEVISUALISER:
                        widget = this.getController(GEPPETTO.Widgets.VARIABLEVISUALISER).addVariableVisualiserWidget();
                        break;
                    //create connectivity widget
                    case GEPPETTO.Widgets.CONNECTIVITY:
                        widget = this.getController(GEPPETTO.Widgets.CONNECTIVITY).addConnectivityWidget();
                        break;
                    //create button bar
                    case GEPPETTO.Widgets.BUTTONBAR:
                        widget = this.getController(GEPPETTO.Widgets.BUTTONBAR).addButtonBarWidget();
                    break;
                    //create myname
                    case GEPPETTO.Widgets.MYNAME:
                        widget = this.getController(GEPPETTO.Widgets.MYNAME).addMyNameWidget();
                        break;
                    //Use as template for new widgets
                    //create WIDGETNAME
                    //case GEPPETTO.Widgets.WIDGETNAME:
                    //    widget = this.getController(GEPPETTO.Widgets.WIDGETNAME).addWIDGETNAMEWidget();
                    //    break;
                    default:
                        break;
                }

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
                    case GEPPETTO.Widgets.SCATTER3D:
                        return GEPPETTO.Resources.REMOVE_SCATTER3D_WIDGETS;
                    case GEPPETTO.Widgets.TREEVISUALISERDAT:
                        return GEPPETTO.Resources.REMOVE_TREEVISUALISERDAT_WIDGETS;
                    case GEPPETTO.Widgets.TREEVISUALISERD3:
                        return GEPPETTO.Resources.REMOVE_TREEVISUALISERD3_WIDGETS;
                    case GEPPETTO.Widgets.VARIABLEVISUALISER:
                        return GEPPETTO.Resources.REMOVE_VARIABLEVISUALISER_WIDGETS;
                    case GEPPETTO.Widgets.CONNECTIVITY:
                        return GEPPETTO.Resources.REMOVE_CONNECTIVITY_WIDGETS;
                    case GEPPETTO.Widgets.BUTTONBAR:
                        return GEPPETTO.Resources.REMOVE_BUTTONBAR_WIDGETS;
                    case GEPPETTO.Widgets.MYNAME:
                        return GEPPETTO.Resources.REMOVE_MYNAME_WIDGETS;
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
                else if (type == GEPPETTO.Widgets.SCATTER3D) {
                    if (this.scatter3dController == null || undefined) {
                        this.scatter3dController = new Scatter3dController();
                    }
                    return this.scatter3dController;
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
                else if (type == GEPPETTO.Widgets.TREEVISUALISERD3) {
                    if (this.treeVis3DController == null || undefined) {
                        this.treeVis3DController = new TreeVisualiserControllerD3();
                    }
                    return this.treeVis3DController;
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
                else if (type == GEPPETTO.Widgets.MYNAME) {
                    if (this.myNameController == null || undefined) {
                        this.myNameController = new MyNameController();
                    }
                    return this.myNameController;
                }

            }
        };
    };
});
