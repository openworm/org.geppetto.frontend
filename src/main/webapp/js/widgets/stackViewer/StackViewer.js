/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2014 OpenWorm.
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
 *
 * @module Widgets/stackViewer
 * @author Robbie1977
 */
define(function (require) {

    var Widget = require('widgets/Widget');
    //var $ = require('jquery');
    //var React = require('jsx!widgets/stackViewer/vendor/react.min');
    //var ReactDOM = require('jsx!widgets/stackViewer/vendor/react-dom.min');
    var StackViewerComponent = require('jsx!widgets/stackViewer/StackViewerComponent');

    return Widget.View.extend({
        variable: null,
        options: null,
        defHeight: 400,
        defWidth: 600,
        data: { height: this.defHeight, width: this.defWidth, instances: [] },

        /**
         * Initialises button bar
         *
         * @param {Object}
         *            options - Object with options for the widget
         */
        /**
         * Initialize the popup widget
         */
        initialize: function (options) {
            Widget.View.prototype.initialize.call(this, options);
            this.render();

            // add container for nested react component
            $('#' + this.id).append("<div id='stack-container" + this.id + "'></div>");

            this.setSize(this.defHeight, this.defWidth);
        },

        setSize: function (h, w) {
            Widget.View.prototype.setSize.call(this, h, w);
            this.data.height = h;
            this.data.width = w;

            this.updateBorders();
            this.updateScene();
        },

        /**
         * Sets the content of this widget
         * This is a sample method of the widget's API, in this case the user would use the widget by passing an instance to a setData method
         * Customise/remove/add more depending on what widget you are creating
         *
         * @command setData(anyInstance)
         * @param {Object} anyInstance - An instance of any type
         */
        setData: function (data) {
            if(data != undefined && data!=null){
                if(data.height == undefined){
                    data.height = this.defHeight;
                }

                if(data.width == undefined){
                    data.width = this.defWidth;
                }

                this.setSize(data.height, data.width);

                this.data = data;
            }

            this.updateBorders();
            this.updateScene();

            return this;
        },

        setSlices: function(instances){
            this.data.instances = this.data.instances.concat(instances);
            this.updateScene();
        },

        updateScene: function(){
            ReactDOM.render(
                React.createElement(StackViewerComponent, {data: this.data}),
                document.getElementById('stack-container' + this.id)
            );
        },

        updateBorders: function(){
            this.data.width -= 30;
            this.data.height -= 40;
        },

        // destroy: function () {
        //     ReactDOM.unmountComponentAtNode(document.getElementById('stack-container' + this.id));
        //     Widget.View.prototype.destroy.call(this);
        // },
    });
});


