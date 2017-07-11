

/**
 * Client class use to represent an instance object (instantiation of a variable).
 *
 * @module model/AVisualCapability
 * @author Giovanni Idili
 */

define(function (require) {

    var Instance = require('../model/Instance');
    var ArrayInstance = require('../model/ArrayInstance');
    var Type = require('../model/Type');
    var Variable = require('../model/Variable');

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
            GEPPETTO.trigger(GEPPETTO.Events.Visibility_changed, this);

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
            
            GEPPETTO.trigger(GEPPETTO.Events.Visibility_changed, this);
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
        setOpacity: function (opacity) {

            GEPPETTO.SceneController.setOpacity(this.getInstancePath(), opacity);
        },


        /**
         *
         * @returns {*}
         */
        getColor: function () {
            return GEPPETTO.SceneController.getColor(this);
        },

        /**
         * Change the color of an instance or class of instances
         *
         * @command AVisualCapability.setColor(color)
         *
         */
        setColor: function (color) {

            GEPPETTO.SceneController.setColor(this.getInstancePath(), color);

            GEPPETTO.trigger(GEPPETTO.Events.Color_set, {instance: this, color: color});

            return this;
        },

        /**
         * Select the instance or class of instances
         *
         * @command AVisualCapability.select()
         *
         */
        select: function (nested, geometryIdentifier, point) {
            if (nested === undefined) {
                nested = true;
            }

            var message;

            if (this instanceof Instance || this instanceof ArrayInstance) {
                if (!this.selected) {
                    // set selection flag local to the instance and add to geppetto selection list
                    this.selected = true;
                    GEPPETTO.SceneController.selectInstance(this.getInstancePath(), geometryIdentifier);
                    message = GEPPETTO.Resources.SELECTING_ASPECT + this.getInstancePath();

                    //signal selection has changed in simulation pass instance
                    GEPPETTO.trigger(GEPPETTO.Events.Select, this, geometryIdentifier, point);
                } else {
                    message = GEPPETTO.Resources.ASPECT_ALREADY_SELECTED;
                }

                if (nested === true && typeof this.getChildren === "function") {
                    var children = this.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        if (typeof children[i].select === "function") {
                            children[i].select(nested, geometryIdentifier, point);
                        }
                    }
                }
            } else if (this instanceof Type || this instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability(this.capabilityId)) {
                        instances[j].select(nested, geometryIdentifier, point);
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
                    message = GEPPETTO.Resources.DESELECTING_ASPECT + this.getInstancePath();
                    GEPPETTO.SceneController.deselectInstance(this.getInstancePath());
                    this.selected = false;
                    //trigger event that selection has been changed
                    GEPPETTO.trigger(GEPPETTO.Events.Select, this);
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
                GEPPETTO.SceneController.zoomTo([this]);
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
        setGeometryType: function (type, thickness) {
            GEPPETTO.SceneController.setGeometryType(this, type, thickness)
            return this;
        },

        /**
         * Show connection lines for instances.
           @param {boolean} mode - Show or hide connection lines
         */
        showConnectionLines: function(mode) {
            GEPPETTO.SceneController.showConnectionLines(this.getInstancePath(), mode);
            return this;
        }
    }
});
