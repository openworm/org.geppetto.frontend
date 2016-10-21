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

        require('./WidgetFactory')(GEPPETTO);
        require('./WidgetsListener')(GEPPETTO);
        var widgetUtility = require("./WidgetUtility");
        require("./ContextMenu")(GEPPETTO);
        //Plot Widget
        require("./plot/config")(GEPPETTO);
        //Popup Widget
        //require("./popup/config"); <-- Migrated
//        //Scatter3d Widget
//        require("./scatter3d/config"); <-- Migrated
//        //TreeVisualiser DAT Widget
        require("./treevisualiser/treevisualiserdat/config")(GEPPETTO);
//        //TreeVisualiser D3 Widget
        require("./treevisualiser/treevisualiserd3/config")(GEPPETTO);
//        //VariableVisualiser widget
//        require("./variablevisualiser/config"); <-- Migrated
        //Connectivity Widget
        //require("./connectivity/config");   <-- Migrated
//        //Buttonbar widget
//        require("./buttonBar/config"); <-- Migrated

        //WIDGETNAME widget Do not remove or uncomment, use as template for new widgets
        //require("widgets/template/config");

        widgetUtility.loadCss("geppetto/js/widgets/Widget.css");
    };
});
