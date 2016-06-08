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
 * Client class use to represent a VisualGroupElement Node, used for visualization tree
 * properties.
 *
 * @module model/VisualGroupElement
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author Giovanni Idili
 */
define(function (require) {

    var ObjectWrapper = require('model/ObjectWrapper');

    return ObjectWrapper.Model.extend({

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize
         *                           node
         */
        initialize: function (options) {
            // object wrapper
            this.set({"wrappedObj": options.wrappedObj});
            this.set({"parent": options.parent});
        },

        /**
         * Get value of quantity
         *
         * @command VisualGroupElement.getValue()
         * @returns {String} Value of quantity
         */
        getValue: function () {
            var param = this.get("wrappedObj").parameter;

            if (param == "" || param == undefined) {
                return null;
            }

            return param.value;
        },

        /**
         * Get unit of quantity
         *
         * @command VisualGroupElement.getUnit()
         * @returns {String} Unit of quantity
         */
        getUnit: function () {
            var param = this.get("wrappedObj").parameter;

            if (param == "" || param == undefined) {
                return null;
            }

            return param.unit.unit;
        },

        /**
         * Get scaling factor
         *
         * @command VisualGroupElement.getScalingFactor()
         * @returns {String} Scaling Factor for value and unit
         */
        getScalingFactor: function () {
            var param = this.get("wrappedObj").parameter;

            if (param == "" || param == undefined) {
                return null;
            }

            return param.scalingFactor;
        },

        /**
         * Get color of element
         *
         * @command VisualGroupElement.getValue()
         * @returns {String} Color of VisualGroupElement
         */
        getColor: function () {
            return this.get("wrappedObj").defaultColor;
        },

        show: function (mode) {
            /*var visualizationTree = this.getParent().getParent();

             var findVisTree = false;
             while(!findVisTree){
             if(visualizationTree._metaType!= GEPPETTO.Resources.ASPECT_SUBTREE_NODE){
             visualizationTree = visualizationTree.getParent();
             }
             else{
             findVisTree = true;
             }
             }

             var group = {};
             group[this.getId()] = {};
             group[this.getId()].color = this.getColor();

             GEPPETTO.SceneController.showVisualGroups(visualizationTree, group,mode);*/
        },

        /**
         * Print out formatted node
         */
        print: function () {
            return "Name : " + this.getName() + "\n" + "    Id: " + this.getId() + "\n";
        }
    });
});