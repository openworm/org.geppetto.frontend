/**
 * Global controller for all 3d canvas components.
 * Methods called in this controller will apply to all the 3D canvas components.
 *
 *
 *  @author Matteo Cantarelli
 */
define(['jquery'], function () {

    function SceneController() {
    };

    SceneController.prototype =
    {

        constructor: SceneController,

        canvasComponents: [],

        /**
         *
         * @param canvasComponent
         */
        add3DCanvas: function (canvasComponent) {
            this.canvasComponents.push(canvasComponent);
        },


        /**
         *
         * @param variables
         * @returns {boolean}
         */
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

        /**
         *
         * @param variables
         * @returns {boolean}
         */
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

        /**
         *
         * Returns all the selected instances
         *
         * @command G.getSelection()
         * @returns  {Array} Returns list of all instances selected
         */
        getSelection: function () {
            var selection = this.traverseSelection(window.Instances);
            return selection;
        },

        /**
         * Helper method that traverses through run time tree looking for selected entities.
         */
        traverseSelection: function (instances) {
            var selection = [];
            if (instances != null || undefined) {
                for (var e = 0; e < instances.length; e++) {
                    var instance = instances[e];
                    if (instance.selected) {
                        selection.push(instance);
                    }
                    selection = selection.concat(this.traverseSelection(instance.getChildren()));
                }
            }
            return selection;
        },

        /**
         * Selects the passed instances
         *
         * @param instances An array of instances
         */
        select: function (instances) {
            for (var i = 0; i < instances.length; i++) {
                instances[i].select();
            }

        },

        /**
         * Deselects the passed instances
         *
         * @param instances An array of instances
         */
        deselect: function (instances) {
            for (var i = 0; i < instances.length; i++) {
                instances[i].deselect();
            }
        },

        /**
         * Deselects all selected instances
         *
         * @return {string}
         */
        deselectAll: function () {
            var selection = this.getSelection();
            if (selection.length > 0) {
                for (var key in selection) {
                    var entity = selection[key];
                    entity.deselect();
                }
            }
            return GEPPETTO.Resources.DESELECT_ALL;
        },

        /**
         * Selects an instance in all existing canvas
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
         * Deselects an instance in all existing canvas
         *
         * @param {String} instancePath - Path of instance to select
         * @param {String} geometryIdentifier - Identifier of the geometry that was clicked
         */
        deselectInstance: function (instancePath) {
            for (var i = 0; i < this.canvasComponents.length; i++) {
                this.canvasComponents[i].deselectInstance(instancePath);
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

        /**
         *
         * @param instance
         */
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
         * @param wireframe
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
         * Retrieves the color for a given instance.
         * If multiple canvas are present and they have different colors associated to the given instance an array is returned instead.
         *
         * @param {String}
         *            instancePath - Instance path of the instance to change color
         */
        getColor: function (instance) {
            var colors=[];
            for (var i = 0; i < this.canvasComponents.length; i++) {
                var c = this.canvasComponents[i].getColor(instance);
                if($.inArray(c,colors)==-1){
                    colors.push(c);
                }
            }
            if(colors.length==1){
                return colors[0];
            }
            else if(colors.length==0){
                return undefined;
            }
            else{
                return colors;
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
         *
         * @param instance
         */
        showVisualGroupsForInstance: function (instance, visualGroupElement) {
            for (var i = 0; i < this.canvasComponents.length; i++) {
                this.canvasComponents[i].showVisualGroupsForInstance(instance, visualGroupElement);
            }
        },

        /**
         * Activates a visual group
         * @param visualGroup
         * @param mode
         * @param instances
         */
        showVisualGroups: function (visualGroup, mode, instances) {
            for (var i = 0; i < this.canvasComponents.length; i++) {
                this.canvasComponents[i].showVisualGroups(visualGroup, mode, instances);
            }
        },


        /**
         * Split merged mesh into individual meshes
         * @param instances
         * @param groupElements
         */
        splitGroups: function (instance, groupElements) {
            for (var i = 0; i < this.canvasComponents.length; i++) {
                this.canvasComponents[i].splitGroups(instance, groupElements);
            }
        },

        /**
         * Associate a color function to a group of instances for all the existing canvas.
         * The visual instance that will be colored is the one associated with the composite type
         * which contains the state variables passed as parameter.
         *
         * @param instances - The state variable instances we are listening to
         * @param colorfn - The function to be used to modulate the color
         */
        addColorFunction: function (instances, colorfn) {
            for (var i = 0; i < this.canvasComponents.length; i++) {
                this.canvasComponents[i].addColorFunction(instances, colorfn);
            }
        },

        /**
         * Remove a previously associated color function for all existing canvas
         *
         * @param instances
         */
        removeColorFunction: function (instances) {
            for (var i = 0; i < this.canvasComponents.length; i++) {
                this.canvasComponents[i].removeColorFunction(instances);
            }
        },


        /**
         * Returns all the instances that are being listened to
         *
         * @return {Array}
         */
        getColorFunctionInstances: function () {
            var instances=[];
            for (var i = 0; i < this.canvasComponents.length; i++) {
                instances = instances.concat(this.canvasComponents[i].getColorFunctionInstances());
            }
            return instances;
        },

        /**
         * Associate a color function to an instance for all the
         * existing canvas.  The visual instance that will be colored
         * is given by the `instancePath`, and `modulation` provides
         * the state variable.
         *
         * @param {string} instancePath
           @param modulation
           @param colorfn
         */
        addColorListener: function(instancePath, modulation, colorfn) {
            for (var i = 0; i < this.canvasComponents.length; i++) {
                this.canvasComponents[i].addColorListener(instancePath, modulation, colorfn);
            }
        },

        /**
         * Show connection lines for instances.
           @param instances
           @param {boolean} mode - Show or hide connection lines
         */
        showConnectionLines: function(instancePath, mode) {
            for (var i = 0; i < this.canvasComponents.length; i++) {
                this.canvasComponents[i].showConnectionLines(instancePath, mode)
            }
        }

    };

    return SceneController;
});

