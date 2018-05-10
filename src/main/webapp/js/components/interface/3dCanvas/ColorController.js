/**
 * This controller is used by the 3d engine to modulate the color of the meshes
 */
define(['jquery'], function () {


    function ColorController(engine) {
        this.engine = engine;
        this.listeners = {};
        this.litUpInstances = [];
        this.colorFunctionSet = false;

        var that = this;

        GEPPETTO.on(GEPPETTO.Events.Experiment_update, function (parameters) {
            if (parameters.playAll != null || parameters.step != undefined) {
                //update scene brightness
                for (var key in that.listeners) {
                    if (that.listeners[key] != null || undefined) {
                        for (var i = 0; i < that.listeners[key].length; i++) {
                            that.listeners[key][i](Instances.getInstance(key), parameters.step);
                        }
                    }
                }
            }
        });

    };


    ColorController.prototype = {

        constructor: ColorController,

        isColorFunctionSet: function () {
            return this.colorFunctionSet;
        },

        /**
         * Callback to be called whenever a watched node changes
         *
         * @param {Instance} node - node to couple callback to
         * @param {Function} callback - Callback function to be called whenever _variable_ changes
         */
        addOnNodeUpdatedCallback: function (node, callback) {
            if (node != null || undefined) {
                if (!this.listeners[node.getInstancePath()]) {
                    this.listeners[node.getInstancePath()] = [];
                }
                this.listeners[node.getInstancePath()].push(callback);
            }
        },

        /**
         * Clears callbacks coupled to changes in a node
         *
         * @param {Instance} node - node to which callbacks are coupled
         */
        clearOnNodeUpdateCallback: function (node) {
            this.listeners[node.getInstancePath()] = null;
        },


        /**
         * Modulates the color of an instance given a color function.
         * The color function should receive the value of the watched node and output [r,g,b].
         *
         * @param {Instance} instance - The instance to be lit
         * @param {Instance} modulation - Variable which modulates the color
         * @param {Function} colorfn - Converts time-series value to [r,g,b]
         */
        addColorFunction: function (instances, colorfn) {
            // Check if instance is instance + visualObjects or instance (hhcell.hhpop[0].soma or hhcell.hhpop[0])
            for (var i = 0; i < instances.length; ++i) {
                this.litUpInstances.push(instances[i]);
            }
            var compositeToLit = {};
            var visualObjectsToLit = {};
            var variables = {};
            var currentCompositePath = undefined;

            for (var i = 0; i < instances.length; i++) {
                var composite = undefined;
                var multicompartment = false;

                composite = instances[i].getParent();

                while (composite.getMetaType() != GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE) {
                    if (composite.getParent() == null) {
                        throw "Unsupported model to use this function";
                    } else {
                        composite = composite.getParent();
                        multicompartment = true;
                    }
                }

                var currentCompositePath = composite.getInstancePath();
                if (!compositeToLit.hasOwnProperty(currentCompositePath)) {
                    compositeToLit[currentCompositePath] = composite;
                    visualObjectsToLit[currentCompositePath] = [];
                    variables[currentCompositePath] = [];

                }

                if (multicompartment) {
                    for (var j = 0; j < composite.getChildren().length; ++j) {
                        var id = composite.getChildren()[j].getId();
                        if (visualObjectsToLit[currentCompositePath].indexOf(id) < 0)
                            visualObjectsToLit[currentCompositePath].push(id);
                    }
                }
                variables[currentCompositePath].push(instances[i]);

            }

            for (var i in Object.keys(compositeToLit)) {
                var path = Object.keys(compositeToLit)[i];
                this.addColorFunctionBulk(compositeToLit[path], visualObjectsToLit[path], variables[path], colorfn);
            }

        },

        /**
         * Removes color functions
         *
         * @param {Instance} instances - The instances to be unlit
         */
        removeColorFunction: function (instances) {
            while (instances.length > 0) {
                this.clearColorFunctions(instances.pop(0));
            }

            // update flag
            if (this.litUpInstances.length == 0) {
                this.colorFunctionSet = false;
            }
        },

        /**
         *
         * @returns {Array}
         */
        getColorFunctionInstances: function () {
            return this.litUpInstances;
        },

        /**
         * Modulates the color of an aspect visualization, given a watched node
         * and a color function. The color function should receive
         * the value of the watched node and output [r,g,b].
         *
         * @param {Instance} instance - The instance to be lit
         * @param {Instance} modulation - Variable which modulates the color
         * @param {Function} colorfn - Converts time-series value to [r,g,b]
         */
        addColorFunctionBulk: function (instance, visualObjects, stateVariableInstances, colorfn) {
            var modulations = [];
            if (visualObjects != null) {
                if (visualObjects.length > 0) {
                    var elements = {};
                    for (var voIndex in visualObjects) {
                        elements[visualObjects[voIndex]] = "";
                        var path = instance.getInstancePath() + "." + visualObjects[voIndex];
                        if (modulations.indexOf(path) < 0)
                            modulations.push(path);

                    }
                    this.engine.splitGroups(instance, elements);
                }
                else {
                    if (modulations.indexOf(instance.getInstancePath()) < 0)
                        modulations.push(instance.getInstancePath());
                }
            }

            var matchedMap = [];
            modulations.map(function(e, i) {
               matchedMap[e] = stateVariableInstances[i];
            });

            for (var index in matchedMap) {
                this.litUpInstances.push(matchedMap[index]);
                this.addColorListener(index, matchedMap[index], colorfn);
            }

            // update flag
            this.colorFunctionSet = true;
        },

        /**
         *
         * @param instance
         * @param modulation
         * @param colorfn
         */
        addColorListener: function (instance, modulation, colorfn) {
            var that = this;
            GEPPETTO.trigger(GEPPETTO.Events.Lit_entities_changed);
            this.addOnNodeUpdatedCallback(modulation, function (stateVariableInstance, step) {
                if ((stateVariableInstance.getTimeSeries() != undefined) &&
                    (step < stateVariableInstance.getTimeSeries().length)) {
                    that.colorInstance(instance, colorfn, stateVariableInstance.getTimeSeries()[step]);
                }
            });
        },

        /**
         * Light up the entity
         *
         * @param {Instance}
         *            instance - the instance to be lit
         * @param {Float}
         *            intensity - the lighting intensity from 0 (no illumination) to 1 (full illumination)
         */
        colorInstance: function (instance, colorfn, intensity) {
            var threeObject;
            if (instance in this.engine.meshes && this.engine.meshes[instance].visible) {
                threeObject = this.engine.meshes[instance];
            }
            else {
                threeObject = this.engine.splitMeshes[instance];
            }

            var [r,g,b] = colorfn(intensity);
            if (threeObject!=undefined) {
                threeObject.material.color.setRGB(r,g,b);
            }
        },

        /**
         *
         * @param varnode
         */
        clearColorFunctions: function (varnode) {
            var i = this.litUpInstances.indexOf(varnode);
            if (i > -1) this.litUpInstances.splice(i, 1);
            GEPPETTO.trigger(GEPPETTO.Events.Lit_entities_changed);
            if (this.litUpInstances.length == 0) {
                this.colorFunctionSet = false;
            }
            this.clearOnNodeUpdateCallback(varnode);
        },

    };

    return ColorController;
});

