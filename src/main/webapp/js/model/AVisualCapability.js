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

define(['jquery'], function (require) {
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
            // TODO: adapt to types / variables
            if (nested === undefined) {
                nested = true;
            }

            GEPPETTO.SceneController.hideAspect(this.getInstancePath());
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

            return message;
        },

        /**
         * Shows the instance or class of instances
         *
         * @command AVisualCapability.show()
         *
         */
        show: function (nested) {
            // TODO: adapt to types / variables
            if (nested === undefined) {
                nested = true;
            }

            GEPPETTO.SceneController.showAspect(this.getInstancePath());

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
            // TODO: adapt to types / variables
            if (nested === undefined) {
                nested = true;
            }

            GEPPETTO.SceneController.setOpacity(this.getInstancePath(), opacity);

            if (nested === true && typeof this.getChildren === "function") {
                var children = this.getChildren();
                for (var i = 0; i < children.length; i++) {
                    if (typeof children[i].setOpacity === "function") {
                        children[i].setOpacity(opacity, nested);
                    }
                }
            }
        },

        /**
         * Change the color of an instance or class of instances
         *
         * @command AVisualCapability.setColor(color)
         *
         */
        setColor: function (color, nested) {
            // TODO: adapt to types / variables
            if (nested === undefined) {
                nested = true;
            }

            GEPPETTO.SceneController.setColor(this.getInstancePath(), color);

            if (nested === true && typeof this.getChildren === "function") {
                var children = this.getChildren();
                for (var i = 0; i < children.length; i++) {
                    if (typeof children[i].setColor === "function") {
                        children[i].setColor(color, nested);
                    }
                }
            }
        },

        /**
         * Select the instance or class of instances
         *
         * @command AVisualCapability.select()
         *
         */
        select: function (nested) {
            // TODO: adapt to types / variables
            if (nested === undefined) {
                nested = true;
            }

            var message;
            if (!this.selected) {
                //first, before doing anything, we check what is currently selected

                if (G.getSelectionOptions().unselected_transparent) {
                    //something is already selected, we make everything not selected transparent
                    GEPPETTO.SceneController.setGhostEffect(true);
                }


                this.selected = true;
                // TODO: investigate why is the parent being set to selected too?
                this.getParent().selected = true;
                GEPPETTO.SceneController.selectAspect(this.getInstancePath());
                message = GEPPETTO.Resources.SELECTING_ASPECT + this.getInstancePath();

                //Behavior: if the parent entity has connections change the opacity of what is not connected
                //Rationale: help exploration of networks by hiding non connected
                if (this.getConnections().length > 0) {
                    //allOtherMeshes will contain a list of all the non connected entities in the scene for the purpose
                    //of changing their opacity
                    var allOtherMeshes = $.extend({}, GEPPETTO.getVARS().meshes);
                    //look on the simulation selection options and perform necessary
                    //operations
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

            return message;
        },

        /**
         * Deselects the instance or class of instances
         *
         * @command AVisualCapability.deselect()
         *
         */
        deselect: function (nested) {
            // TODO: adapt to types / variables
            if (nested === undefined) {
                nested = true;
            }

            var message;

            if (this.selected) {
                message = GEPPETTO.Resources.DESELECTING_ASPECT
                    + this.instancePath;
                GEPPETTO.SceneController.deselectAspect(this.getInstancePath());
                this.selected = false;

                if (G.getSelectionOptions().unselected_transparent) {
                    GEPPETTO.SceneController.setGhostEffect(false);
                }
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

            return message;
        },

        /**
         * Zooms to instance or class of instances
         *
         * @command AVisualCapability.zoomTo()
         *
         */
        zoomTo: function () {
            // TODO: adapt to types / variables

            GEPPETTO.SceneController.zoomToMesh(this.getInstancePath());
            return GEPPETTO.Resources.ZOOM_TO_ENTITY + this.getInstancePath();
        },

        /**
         * Set the type of geometry to be used for this aspect
         */
        setGeometryType: function (type, thickness, nested) {
            // TODO: adapt to types / variables
            if (nested === undefined) {
                nested = true;
            }

            var message = '';

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
                        children[i].setGeometryType(nested);
                    }
                }
            }

            return message;
        },


        /**
         * Show output connections for this entity.

         * @command EntityNode.highlightOutputInstances()
         * @param {boolean} mode - Show or hide output connections
         */
        highlightInstances: function (mode, type) {
            if (mode == null || mode == undefined) {
                mode = true;
            }

            //show/hide connections
            if (mode) {
                GEPPETTO.SceneController.highlightConnectedInstances(this, type);
            }
            else {
                GEPPETTO.SceneController.restoreConnectedInstancesColour(this);
            }
        },


        /**
         * Show connection lines for this instance.

         * @command instance.showConnectionLines()
         * @param {boolean} mode - Show or hide connection lines
         */
        showConnectionLines: function (mode) {
            if (mode == null || mode == undefined) {
                mode = true;
            }

            //show or hide connection lines
            if (mode) {
                GEPPETTO.SceneController.showConnectionLines(this);
            }
            else {
                GEPPETTO.SceneController.removeAllConnectionLines(this);
            }
        },

        getVisualType: function () {
            var visualType = null;
            if ((this.getVariable().getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE)
                || (this.getVariable().getType().getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE)) {
                visualType = this.getVariable().getType();
            } else if (this.getVariable().getType().getVisualType() != undefined) {
                visualType = this.getVariable().getType().getVisualType();
            } else if ((this.getMetaType() != GEPPETTO.Resources.ARRAY_INSTANCE_NODE) && (this.getVariable().getType().getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE)
                && (this.getVariable().getType().getType().getVisualType() != undefined)) {
                visualType = this.getVariable().getType().getType().getVisualType();
            }
            return visualType;
        },
    }
});
