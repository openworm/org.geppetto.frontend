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

    function VisualGroupElement(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
    };

    VisualGroupElement.prototype = Object.create(ObjectWrapper.prototype);
    VisualGroupElement.prototype.constructor = VisualGroupElement;

    /**
     * Get value of quantity
     *
     * @command VisualGroupElement.getValue()
     * @returns {String} Value of quantity
     */
    VisualGroupElement.prototype.getValue = function () {
        var param = this.wrappedObj.parameter;

        if (param == "" || param == undefined) {
            return null;
        }

        return param.value;
    };

    /**
     * Get unit of quantity
     *
     * @command VisualGroupElement.getUnit()
     * @returns {String} Unit of quantity
     */
    VisualGroupElement.prototype.getUnit = function () {
        var param = this.wrappedObj.parameter;

        if (param == "" || param == undefined) {
            return null;
        }

        return param.unit.unit;
    };
    
    /**
     * Get color of element
     *
     * @command VisualGroupElement.getValue()
     * @returns {String} Color of VisualGroupElement
     */
    VisualGroupElement.prototype.getColor = function () {
        return this.wrappedObj.defaultColor;
    };


    /**
     * Print out formatted node
     */
    VisualGroupElement.prototype.print = function () {
        return "Name : " + this.getName() + "\n" + "    Id: " + this.getId() + "\n";
    };

    VisualGroupElement.prototype.show = function (mode, instances) {

        if (instances == undefined) {
            instances = GEPPETTO.ModelFactory.getAllInstancesOf(this.getParent().getParent());
        }
        
        for (var i = 0; i < instances.length; i++) {
            var instance = instances[i];
            var instancePath = instance.getInstancePath();            				
            
            // retrieve the merged mesh
            var mergedMesh = GEPPETTO.getVARS().meshes[instancePath];

            // get map of all meshes that merged mesh was merging
            var map = mergedMesh.mergedMeshesPaths;

            var elements = {}
            for (var v in map) {
                if (v != undefined) {
                    var m = GEPPETTO.getVARS().visualModelMap[map[v]];
                    eval(map[v].substring(0, map[v].lastIndexOf(".")));
                    var object = instance.getVisualType()[map[v].replace(instancePath + ".", "")];
                    // get group elements list for object
                    var groupElementsReference = object.getInitialValue().value.groupElements;
                    for (var i = 0; i < groupElementsReference.length; i++) {
                        var objectGroup = GEPPETTO.ModelFactory.resolve(groupElementsReference[i].$ref).getId();
                        if (objectGroup == this.getId()) {
                            elements[object.getId()] = {'color':this.getColor()}
                        }
                    }
                }
            } 
            
            GEPPETTO.SceneController.showVisualGroupsRaw(elements, instance, GEPPETTO.getVARS().splitMeshes);
        }
    };

    return VisualGroupElement;
});