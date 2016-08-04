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
 *        OpenWorm - http://openworm.org/people.html
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
 * Loads widget scripts
 *
 * @author Jesus Martinez (jesus@metacell.us)
 */

//Widget Classes
define(function (require) {
    return function (GEPPETTO) {

        require('widgets/WidgetFactory')(GEPPETTO);
        require('widgets/WidgetsListener')(GEPPETTO);
        require("widgets/WidgetUtility");
        require("widgets/ContextMenu")(GEPPETTO);
        //Plot Widget
        require("widgets/plot/config")(GEPPETTO);
        //Popup Widget
        require("widgets/popup/config");
        //Scatter3d Widget
        require("widgets/scatter3d/config");
        //TreeVisualiser DAT Widget
        require("widgets/treevisualiser/treevisualiserdat/config")(GEPPETTO);
        //TreeVisualiser D3 Widget
        require("widgets/treevisualiser/treevisualiserd3/config")(GEPPETTO);
        //VariableVisualiser widget
        require("widgets/variablevisualiser/config");
        //Connectivity Widget
        require("widgets/connectivity/config");
        //Buttonbar widget
        require("widgets/buttonBar/config");

        //WIDGETNAME widget Do not remove or uncomment, use as template for new widgets
        //require("widgets/template/config");

        loadCss("geppetto/js/widgets/Widget.css");
    };
});
