/**
 * Global controller for all 3d canvas components. 
 * Methods called in this controller will apply to all the 3D canvas components.
 *
 *
 *  @author Matteo Cantarelli 
 */
define(function (require) {
    return function (GEPPETTO) {

        require('../../../common/GEPPETTO.Resources')(GEPPETTO);

        GEPPETTO.SceneController =
            {
                linesThreshold: 2000,
                aboveLinesThreshold: false,
                canvasComponents: [],
                wireframe: false,


                add3DCanvas: function (canvasComponent) {
                    this.canvasComponents.push(canvasComponent);
                },

                apply: function (args) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i][args[0]].apply(this, arguments);
                    }
                },

                isVisible: function (variables) {
                    var visible = false;
                    for (var i = 0; i < variables.length; i++) {
                        if (variables[i].isVisible()) {
                            visible = true;
                            break;
                        }
                    }
                    return visible;
                },

                isSelected: function (variables) {
                    var selected = false;
                    for (var i = 0; i < variables.length; i++) {
                        if (variables[i].hasOwnProperty('isSelected') && variables[i].isSelected()) {
                            selected = true;
                            break;
                        }
                    }
                    return selected;
                },

                select: function (instances) {
                    for (var i = 0; i < instances.length; i++) {
                        instances[i].select();
                    }

                },

                deselect: function (instances) {
                    for (var i = 0; i < instances.length; i++) {
                        instances[i].deselect();
                    }
                },

                /**
                 * Selects an instance given its. 
                 *
                 * @param {String} instancePath - Path of instance to select
                 * @param {String} geometryIdentifier - Identifier of the geometry that was clicked
                 */
                selectInstance: function (instancePath, geometryIdentifier) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].selectInstance(instancePath, geometryIdentifier);
                    }
                },

                /**
                 *
                 * @param instances
                 */
                show: function (instances) {
                    for (var i = 0; i < instances.length; i++) {
                        instances[i].show();
                    }
                },

                /**
                 *
                 * @param instances
                 */
                hide: function (instances) {
                    for (var i = 0; i < instances.length; i++) {
                        instances[i].hide();
                    }
                },

                assignRandomColor: function (instance) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].assignRandomColor(instance);
                    }
                },

                /**
                 * Zoom to the passed instances in all the canvas
                 * @param instances
                 */
                zoomTo: function (instances) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].zoomTo(instances);
                    }
                },

                /**
                 * Sets whether to use wireframe or not to visualize any instance. 
                 * Applies to all existing canvas.
                 */
                setWireframe: function (wireframe) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].setWireframe(wireframe);
                    }
                },

                /**
                 * Show an instance in all the existing canvas
                 *
                 * @param {String}
                 *            instancePath - Instance path of the instance to make visible
                 */
                showInstance: function (instancePath) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].showInstance(instancePath);
                    }
                },

                /**
                 * Hide an instance in all the existing canvas
                 *
                 * @param {String}
                 *            instancePath - Path of the instance to hide
                 */
                hideInstance: function (instancePath) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].hideInstance(instancePath);
                    }
                },

                /**
                 * Change the color of a given instance in all the existing canvas
                 *
                 * @param {String}
                 *            instancePath - Instance path of the instance to change color
                 * @param {String}
                 *            color - The color to set
                 */
                setColor: function (instancePath, color) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].setColor(instancePath, color);
                    }
                },

                /**
                 * Change the default opacity for a given instance in all existing canvas. 
                 *
                 * @param {String}
                 *            instancePath - Instance path of the instance to set the opacity of
                 * @param {String}
                 *            opacity - The value of the opacity between 0 and 1
                 */
                setOpacity: function (instancePath, opacity) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].setOpacity(instancePath, opacity);
                    }
                },

                /**
                 * Set the threshold (number of 3D primitives on the scene) above which we switch the visualization to lines
                 * for all the existing canvas
                 * @param threshold
                 */
                setLinesThreshold: function (threshold) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].setLinesThreshold(ithreshold);
                    }
                },

                /**
                 * Change the type of geometry used to visualize a given instance in all the existing canvas
                 *
                 * @param {String}
                 *            instance - The instance to change the geometry type for
                 * @param {String}
                 *            type - The geometry type, see GEPPETTO.Resources.GeometryTypes
                 * @param {String}
                 *            thickness - Optional: the thickness to be used if the geometry is "lines"
                 */
                setGeometryType: function (instance, type, thickness) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].setGeometryType(instance, type, thickness);
                    }
                },


                /**
                 * Activates a visual group
                 */
                showVisualGroups: function (visualGroup, mode, instances) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].showVisualGroups(visualGroup, mode, instances);
                    }
                },

                /**
                 * Light up the entity in all canvas
                 *
                 * @param {Instance}
                 *            instance - the instance to be lit
                * @param {Instance}
                 *            colorfn - a function to map the intensity to a color
                 * @param {Float}
                 *            intensity - the lighting intensity from 0 (no illumination) to 1 (full illumination)
                 */
                lightUpEntity: function (instance, colorfn, intensity) {
                    for (var i = 0; i < this.canvasComponents.length; i++) {
                        this.canvasComponents[i].lightUpEntity(instance, colorfn, intensity);
                    }
                }


            }
    }
})
    ;
