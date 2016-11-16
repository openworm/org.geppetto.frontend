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
    var $ = require('jquery');
    var React = require('react');
    var ReactDOM = require('react-dom');
    var StackViewerComponent = require('jsx!widgets/stackViewer/StackViewerComponent');

    function arrayUnique(array) {
        var a = array.concat();
        for(var i=0; i<a.length; ++i) {
            for(var j=i+1; j<a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    }

    return Widget.View.extend({
        variable: null,
        options: null,
        defHeight: 400,
        defWidth: 600,
        data: { id: this.id, height: this.defHeight, width: this.defWidth, instances: [], selected: [] },

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

            this.addBorders();
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
            // console.log('set Data');
            var sel = GEPPETTO.G.getSelection();
            if (data != undefined && data != null) {
                if (data !== this.data || sel !== this.data.selected) {
                    this.removeBorders();
                    if (data.height == undefined) {
                        // console.log('setting default height');
                        data.height = this.data.height;
                    }

                    if (data.width == undefined) {
                        // console.log('setting default width');
                        data.width = this.data.width;
                    }

                    this.data = data;

                    this.data.selected = sel;

                    Widget.View.prototype.setSize.call(this, data.height, data.width);

                    this.addBorders();
                    this.updateScene();

                }
            } else {
                console.log('set data issue:');
                console.log(JSON.stringify(data));
            }

            return this;
        },

        addSlices: function(instances){
            if (instances.length == undefined) {
                if (instances.parent) {
                    console.log('Adding ' + instances.parent.getName() + ' to ' + this.data.instances.length);
                }else{
                    console.log('Adding ' + instances.toString() + ' to ' + this.data.instances.length);
                    window.test = instances;
                }
            }else{
                console.log('Adding ' + instances.length + ' instances to ' + this.data.instances.length);
            }
            this.data.instances = arrayUnique(this.data.instances.concat(instances));
            console.log('Passing ' + this.data.instances.length + ' instances');
            this.updateScene();
        },

        removeSlices: function(instances){
            var i;
            if (instances.length == undefined) {
                this.removeSlice(instances);
            }else{
                for (i in instances){
                    this.removeSlice(instances[i]);
                }
            }
        },

        removeSlice: function(instance){
            console.log('Removing ' + instance.parent.getName() + ' from ' + this.data.instances.length);
            var index = this.data.instance.indexOf(instances);
            if (index > -1) {
                this.data.instances.splice(index, 1);
                console.log('Passing ' + this.data.instances.length + ' instances');
                this.updateScene();
            }else{
                console.log(instance.parent.getName() + ' not found');
            }
        },

        updateScene: function(){
            ReactDOM.render(
                React.createElement(StackViewerComponent, {data: this.data}),
                document.getElementById('stack-container' + this.id)
            );
        },

        removeBorders: function(){
            this.data.width += 4;
            this.data.height += 22;
        },

        addBorders: function(){
            this.data.width -= 4;
            this.data.height -= 22;
        },

        destroy: function () {
            ReactDOM.unmountComponentAtNode(document.getElementById('stack-container' + this.id));
            Widget.View.prototype.destroy.call(this);
        },
    });
});