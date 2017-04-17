

/**
 * Client class use to represent a composite variable node, used for simulation
 * tree state variables.
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function (require) {

    return Backbone.Model.extend({
        children: [],
        id: "",
        name: "",
        _metaType: "",
        value: "",
        path: "",

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize
         *                           node
         */
        initialize: function (options) {
            this.set({"children": (options.children != 'undefined') ? options.children : []});
            this.set({"id": options.id});
            this.set({"name": options.name});
            this.set({"_metaType": options._metaType});
            this.set({"value": options.value});
            this.set({"path": options.path});
        },

        /**
         * Get this entity's aspects
         *
         * @command CompositeType.getChildren()
         *
         * @returns {List<Variable>} - List of variables
         *
         */
        getChildren: function () {
            return this.get('children');
        },

        /**
         * Get meta type
         *
         * @command Instance.getMetaType()
         *
         * @returns {String} - meta type
         *
         */
        getMetaType: function () {
            return this.get('_metaType');
        },

        /**
         * Gets the name of the node
         *
         * @command Node.getName()
         * @returns {String} Name of the node
         *
         */
        getName: function () {
            return this.get('name');
        },
        
        /**
         * Get the id associated with node
         *
         * @command Node.getId()
         * @returns {String} ID of node
         */
        getId: function () {
            return this.get('id');
        },

        
        /**
         * Get the list of values for this variable
         *
         * @command Variable.getInitialValues()
         *
         * @returns {List<Value>} - array of values
         *
         */
        getInitialValues: function () {
            var values = [];
            values.push({value: {value: this.get('value')}});
            return values;
        },
        
        getPath: function(){
        	return this.get('path');
        }
    });
});
