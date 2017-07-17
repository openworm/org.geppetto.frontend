/**
 * Base class that provides wrapping functionality for a generic underlying object (with id and name).
 *
 * @module widgets/treevisualiser/TreeVisualiserNode.js
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */

define(['jquery', 'underscore', 'backbone'], function (require) {
    return Backbone.Model.extend({
        wrappedObj: null,
        children: [],
        _children: [],
        formattedValue: "",
        style: "",
        backgroundColors: [],

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize node
         */
        initialize: function (options) {
            this.set({"wrappedObj": options.wrappedObj});
            this.set({"children": (options.children != undefined) ? options.children : []});
            this.set({"_children": (options._children != undefined) ? options._children : []});
            this.set({"formattedValue": (options.formattedValue != undefined) ? options.formattedValue : ""});
            this.set({"style": (options.style != undefined) ? options.style : ""});
            this.set({"backgroundColors": (options.backgroundColors != undefined) ? options.backgroundColors : []});
        },

        /**
         * Gets the name of the node
         *
         * @command Node.getName()
         * @returns {String} Name of the node
         *
         */
        getName: function () {
            return this.get('wrappedObj').getName();
        },

        /**
         * Get the id associated with node
         *
         * @command Node.getId()
         * @returns {String} ID of node
         */
        getId: function () {
            return this.get('wrappedObj').getId();
        },

        /**
         * Get the metatype associated with node
         *
         * @command Node.getMetaType()
         * @returns {String} MetaType of node
         */
        getMetaType: function () {
            return this.get('wrappedObj').getMetaType();
        },

        /**
         * Get the metatype associated with node
         *
         * @command Node.getMetaType()
         * @returns {String} formatted value of node
         */
        getValue: function () {
            return this.get('formattedValue');
        },

        /**
         * Get the children of the node
         *
         * @command Node.getChildren()
         * @returns {Object} Children of node
         */
        getChildren: function () {
            return this.get('children');
        },

        /**
         * Get the hidden children of the node
         *
         * @command Node.getHiddenChildren()
         * @returns {Object} Hidden children of node
         */
        getHiddenChildren: function () {
            return this.get('_children');
        },

        /**
         * Get the backgroundColors of the node
         *
         * @command Node.getBackgroundColors()
         * @returns {Object} Children of node
         */
        getBackgroundColors: function () {
            return this.get('backgroundColors');
        },

        /**
         * Get the wrapped object
         *
         * @command Node.getWrappedObj()
         * @returns {Object} - Wrapped object
         */
        getWrappedObj: function () {
            return this.get('wrappedObj');
        },

        /**
         * Get the style of the node
         *
         * @command Node.getStyle()
         * @returns {String} - Wrapped object
         */
        getStyle: function() {
        	return this.get('style');
        },

        /**
         * Get the unique path
         *
         * @command Node.getPath()
         * @returns {String} - Wrapped object
         */
        getPath: function() {
        	if (typeof this.get('wrappedObj').getInstancePath === "function"){
        		return this.get('wrappedObj').getInstancePath();
        	}
        	else if (typeof this.get('wrappedObj').getPath === "function"){
        		return this.get('wrappedObj').getPath();
        	}
        	else{
        		return this.getId();
        	}

        }

    });
});
