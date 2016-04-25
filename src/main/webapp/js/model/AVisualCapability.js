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
 * Client class use to represent an instance object (instantiation of a variable).
 *
 * @module model/AVisualCapability
 * @author Giovanni Idili
 */

define(function (require) {

    var Instance = require('model/Instance');
    var ArrayInstance = require('model/ArrayInstance');
    var Type = require('model/Type');
    var Variable = require('model/Variable');

    return {
        capabilityId: 'VisualCapability',
        visible: true,
        selected: false,

        /**
         * Hides the instance or class of instances
         *
         * @command AVisualCapability.hide()
         *
         */
        hide: function (nested) {
            if (nested === undefined) {
                nested = true;
            }

            if (this instanceof Instance || this instanceof ArrayInstance) {
                GEPPETTO.SceneController.hideInstance(this.getInstancePath());
                this.visible = false;

                if (nested === true && typeof this.getChildren === "function") {
                    var children = this.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        if (typeof children[i].hide === "function") {
                            children[i].hide(nested);
                        }
                    }
                }

                var message = GEPPETTO.Resources.HIDE_ASPECT + this.getInstancePath();
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability(this.capabilityId)) {
                        instances[j].hide(nested);
                    }
                }

                var message = GEPPETTO.Resources.HIDE_ASPECT + this.getPath();
            }

            return message;
        },

        /**
         * Shows the instance or class of instances
         *
         * @command AVisualCapability.show()
         *
         */
        show: function (nested) {
            if (nested === undefined) {
                nested = true;
            }

            if (this instanceof Instance || this instanceof ArrayInstance) {
                GEPPETTO.SceneController.showInstance(this.getInstancePath());

                this.visible = true;

                if (nested === true && typeof this.getChildren === "function") {
                    var children = this.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        if (typeof children[i].show === "function") {
                            children[i].show(nested);
                        }
                    }
                }

                var message = GEPPETTO.Resources.SHOW_ASPECT + this.getInstancePath();
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call show on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability(this.capabilityId)) {
                        instances[j].show(nested);
                    }
                }

                var message = GEPPETTO.Resources.HIDE_ASPECT + this.getPath();
            }
            return message;
        },

        /**
         * Returns whether the object is visible or not
         *
         * @command AVisualCapability.isVisible()
         *
         */
        isVisible: function () {
            return this.visible;
        },

        /**
         * Returns whether the object is selected or not
         *
         * @command AVisualCapability.isSelected()
         *
         */
        isSelected: function () {
            return this.selected;
        },

        /**
         * Change the opacity of an instance or class of instances
         *
         * @command AVisualCapability.setOpacity(opacity)
         *
         */
        setOpacity: function (opacity, nested) {
            if (nested === undefined) {
                nested = true;
            }

            if (this instanceof Instance || this instanceof ArrayInstance) {
                GEPPETTO.SceneController.setOpacity(this.getInstancePath(), opacity);

                if (nested === true && typeof this.getChildren === "function") {
                    var children = this.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        if (typeof children[i].setOpacity === "function") {
                            children[i].setOpacity(opacity, nested);
                        }
                    }
                }
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability(this.capabilityId)) {
                        instances[j].setOpacity(opacity, nested);
                    }
                }
            }
        },


        /**
         *
         * @returns {*}
         */
        getColor: function () {

            var color = "";
            if (typeof this.getChildren === "function") {
                //this is a an array, it will contain children
                var children = this.getChildren();

                var color = "";
                for (var i = 0; i < children.length; i++) {
                    if (typeof children[i].getColor === "function") {
                        var newColor = children[i].getColor();
                        if (color == "") {
                            color = newColor;
                        }
                        else if (color != newColor) {
                            return "";
                        }
                    }
                }
            }

            var meshes = GEPPETTO.SceneController.getRealMeshesForInstancePath(this.getInstancePath());
            if (meshes.length > 0) {
                for (var i = 0; i < meshes.length; i++) {
                    var mesh = meshes[i];
                    if (mesh) {
                        mesh.traverse(function (object) {
                            if (object.hasOwnProperty("material")) {
                                if (color == "") {
                                    color = object.material.defaultColor;
                                }
                                else if (color != object.material.defaultColor) {
                                    return "";
                                }
                            }
                        });
                    }
                }
            }

            return color;
        },

        /**
         * Change the color of an instance or class of instances
         *
         * @command AVisualCapability.setColor(color)
         *
         */
        setColor: function (color, nested) {
            if (nested === undefined) {
                nested = true;
            }

            if (this instanceof Instance || this instanceof ArrayInstance) {
                GEPPETTO.SceneController.setColor(this.getInstancePath(), color);

                if (nested === true && typeof this.getChildren === "function") {
                    var children = this.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        if (typeof children[i].setColor === "function") {
                            children[i].setColor(color, nested);
                        }
                    }
                }
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability(this.capabilityId)) {
                        instances[j].setColor(color, nested);
                    }
                }
            }
            return this;
        },

        /**
         * Select the instance or class of instances
         *
         * @command AVisualCapability.select()
         *
         */
        select: function (nested) {
            if (nested === undefined) {
                nested = true;
            }

            var message;

            if (this instanceof Instance || this instanceof ArrayInstance) {
                if (!this.selected) {
                    //first, before doing anything, we check what is currently selected

                    if (G.getSelectionOptions().unselected_transparent) {
                        //something is already selected, we make everything not selected transparent
                        GEPPETTO.SceneController.setGhostEffect(true);
                    }

                    // set selection flag local to the instance and add to geppetto selection list
                    this.selected = true;
                    GEPPETTO.SceneController.selectInstance(this.getInstancePath());
                    message = GEPPETTO.Resources.SELECTING_ASPECT + this.getInstancePath();

                    // Behaviour: help exploration of networks by ghosting and not highlighting non connected or selected
                    if (this.getConnections().length > 0) {
                        // allOtherMeshes will contain a list of all the non connected entities in the scene
                        var allOtherMeshes = $.extend({}, GEPPETTO.getVARS().meshes);
                        // look on the simulation selection options and perform necessary operations
                        if (G.getSelectionOptions().show_inputs && G.getSelectionOptions().show_outputs) {
                            var meshes = this.highlightInstances(true);
                            for (var i in meshes) {
                                delete allOtherMeshes[meshes[i]];
                            }
                        }
                        else if (G.getSelectionOptions().show_inputs) {
                            var inputs = this.highlightInstances(true, GEPPETTO.Resources.INPUT);
                            for (var i in inputs) {
                                delete allOtherMeshes[inputs[i]];
                            }
                        }
                        else if (G.getSelectionOptions().show_outputs) {
                            var outputs = this.highlightInstances(true, GEPPETTO.Resources.OUTPUT);
                            for (var o in outputs) {
                                delete allOtherMeshes[outputs[o]];
                            }
                        }
                        if (G.getSelectionOptions().draw_connection_lines) {
                            this.showConnectionLines(true);
                        }
                        if (G.getSelectionOptions().unselected_transparent) {
                            GEPPETTO.SceneController.ghostEffect(allOtherMeshes, true);
                        }
                    }
                    //signal selection has changed in simulation
                    GEPPETTO.trigger(Events.Select);
                } else {
                    message = GEPPETTO.Resources.ASPECT_ALREADY_SELECTED;
                }

                if (nested === true && typeof this.getChildren === "function") {
                    var children = this.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        if (typeof children[i].select === "function") {
                            children[i].select(nested);
                        }
                    }
                }
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability(this.capabilityId)) {
                        instances[j].select(nested);
                    }
                }

                message = GEPPETTO.Resources.BATCH_SELECTION;
            }

            return message;
        },

        /**
         * Deselects the instance or class of instances
         *
         * @command AVisualCapability.deselect()
         *
         */
        deselect: function (nested) {
            if (nested === undefined) {
                nested = true;
            }

            var message;

            if (this instanceof Instance || this instanceof ArrayInstance) {
                if (this.selected) {
                    message = GEPPETTO.Resources.DESELECTING_ASPECT + this.instancePath;
                    GEPPETTO.SceneController.deselectInstance(this.getInstancePath());
                    this.selected = false;

                    if (G.getSelectionOptions().show_inputs && G.getSelectionOptions().show_outputs) {
                        this.highlightInstances(false);
                    }
                    else if (G.getSelectionOptions().show_inputs) {
                        this.highlightInstances(false, GEPPETTO.Resources.INPUT);
                    }
                    else if (G.getSelectionOptions().show_outputs) {
                        this.highlightInstances(false, GEPPETTO.Resources.OUTPUT);
                    }

                    if (G.getSelectionOptions().draw_connection_lines) {
                        this.showConnectionLines(false);
                    }

                    // TODO: trigger highlight on the ones still selected

                    // NOTE: do this down here, ghost effect won't be removed if stuff is still highlighted
                    if (G.getSelectionOptions().unselected_transparent) {
                        if (G.getSelection() != undefined && G.getSelection().length > 0) {
                            // else (there is something selected) make this ghosted
                            var mesh = {};
                            mesh[this.getInstancePath()] = GEPPETTO.getVARS().meshes[this.getInstancePath()];
                            if (mesh[this.getInstancePath()] != undefined) {
                                GEPPETTO.SceneController.ghostEffect(mesh, true);
                            }
                        } else {
                            // if nothing else is selected do remove ghost effect
                            GEPPETTO.SceneController.setGhostEffect(false);
                        }
                    }

                    //trigger event that selection has been changed
                    GEPPETTO.trigger(Events.Selection);
                } else {
                    message = GEPPETTO.Resources.ASPECT_NOT_SELECTED;
                }

                // nested
                if (nested === true && typeof this.getChildren === "function") {
                    var children = this.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        if (typeof children[i].deselect === "function") {
                            children[i].deselect(nested);
                        }
                    }
                }
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability(this.capabilityId)) {
                        instances[j].deselect(nested);
                    }
                }

                message = GEPPETTO.Resources.BATCH_DESELECTION;
            }

            return message;
        },

        /**
         * Zooms to instance or class of instances
         *
         * @command AVisualCapability.zoomTo()
         *
         */
        zoomTo: function () {
            if (this instanceof Instance || this instanceof ArrayInstance) {
                GEPPETTO.SceneController.zoomToInstance(this);
                return GEPPETTO.Resources.ZOOM_TO_ENTITY + this.getInstancePath();
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                GEPPETTO.SceneController.zoomTo(instances);
            }
            return this;
        },

        /**
         * Set the type of geometry to be used for this aspect
         */
        setGeometryType: function (type, thickness, nested) {
            if (nested === undefined) {
                nested = true;
            }

            var message = '';

            if (this instanceof Instance || this instanceof ArrayInstance) {
                if (GEPPETTO.SceneController.setGeometryType(this, type, thickness)) {
                    message = "Geometry type successfully changed for " + this.getInstancePath();
                }
                else {
                    message = "Error changing the geometry type for " + this.getInstancePath();
                }

                // nested
                if (nested === true && typeof this.getChildren === "function") {
                    var children = this.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        if (typeof children[i].setGeometryType === "function") {
                            children[i].setGeometryType(type, thickness, nested);
                        }
                    }
                }
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability(this.capabilityId)) {
                        instances[j].setGeometryType(type, thickness, nested);
                    }
                }

                message = GEPPETTO.Resources.BATCH_SET_GEOMETRY;
            }

            return message;
        },


        /**
         * Show output connections for this object.

         * @command AVisualCapability.highlightInstances()
         * @param {boolean} mode - Show or hide output connections
         */
        highlightInstances: function (mode, type) {
            if (mode == null || mode == undefined) {
                mode = true;
            }

            if (this instanceof Instance || this instanceof ArrayInstance) {
                //show/hide connections
                if (mode) {
                    GEPPETTO.SceneController.highlightConnectedInstances(this, type);
                }
                else {
                    GEPPETTO.SceneController.restoreConnectedInstancesColour(this);
                }
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability(this.capabilityId)) {
                        instances[j].highlightInstances(mode, type);
                    }
                }
            }
        },


        /**
         * Show connection lines for this instance.

         * @command AVisualCapability.showConnectionLines()
         * @param {boolean} mode - Show or hide connection lines
         */
        showConnectionLines: function (mode) {
            if (mode == null || mode == undefined) {
                mode = true;
            }

            if (this instanceof Instance || this instanceof ArrayInstance) {
                //show or hide connection lines
                if (mode) {
                    GEPPETTO.SceneController.showConnectionLines(this);
                }
                else {
                    GEPPETTO.SceneController.removeConnectionLines(this);
                }
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability(this.capabilityId)) {
                        instances[j].showConnectionLines(mode);
                    }
                }
            }
        }

    }
});
