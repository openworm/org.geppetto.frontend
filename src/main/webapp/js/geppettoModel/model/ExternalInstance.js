

/**
 * Client class use to represent an instance object (instantiation of a variable)
 * 
 * @module model/Instance
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */

define(function (require) {
	var Instance = require('./Instance');

	function ExternalInstance(options) {
		Instance.prototype.constructor.call(this, options);
		this.path = options.path;
		this.projectId = options.projectId;
		this.experimentId = options.experimentId;
	}

	ExternalInstance.prototype = Object.create(Instance.prototype);
	ExternalInstance.prototype.constructor = ExternalInstance;

	/**
	 * Get the type for this instance
	 * 
	 * @command Instance.getTypes()
	 * 
	 * @returns {List<Type>} - array of types
	 * 
	 */
	ExternalInstance.prototype.getTypes= function () {
		throw "Invalid operation with ExternalInstance";
	};

	ExternalInstance.prototype.getValues= function () {
		throw "Invalid operation with ExternalInstance";
	};
	/**
	 * Get the type of this variable, return a list if it has more than one
	 * 
	 * @command Variable.getType()
	 * 
	 * @returns List<Type>} - array of types
	 * 
	 */
	ExternalInstance.prototype.getType = function () {
		throw "Invalid operation with ExternalInstance";
	};

	ExternalInstance.prototype.getValue= function () {
		throw "Invalid operation with ExternalInstance";
	};

	/**
	 * 
	 * @returns {*|Object}
	 */
	ExternalInstance.prototype.getPosition= function () {
		throw "Invalid operation with ExternalInstance";
	};

	/**
	 * Checks if this instance has a visual type
	 * 
	 * @command Instance.hasVisualType()
	 * 
	 * @returns {Boolean}
	 * 
	 */
	ExternalInstance.prototype.hasVisualType = function () {
		return false;
	};

	/**
	 * Gets visual types for the instance if any
	 * 
	 * @command Instance.getVisualType()
	 * 
	 * @returns {*} - Type or list of Types if more than one is found
	 */
	ExternalInstance.prototype.getVisualType = function () {
		return undefined;
	};

	/**
	 * Get the variable for this instance
	 * 
	 * @command Instance.getVariable()
	 * 
	 * @returns {Variable} - Variable object for this instance
	 * 
	 */
	ExternalInstance.prototype.getVariable = function () {
		return this.variable;
	};

	/**
	 * Get children instances
	 * 
	 * @command Instance.getChildren()
	 * 
	 * @returns {List<Instance>} - List of instances
	 * 
	 */
	ExternalInstance.prototype.getChildren = function () {
		return this.children;
	};

	/**
	 * Get instance path
	 * 
	 * @command Instance.getInstancePath()
	 * 
	 * @returns {String} - Instance path
	 * 
	 */
	ExternalInstance.prototype.getInstancePath = function () {
		return this.path;
	};

	/**
	 * Get raw instance path (without array shortening)
	 * 
	 * @command Instance.getRawInstancePath()
	 * 
	 * @returns {String} - Instance path
	 * 
	 */
	ExternalInstance.prototype.getRawInstancePath = function () {
		throw "Invalid operation with ExternalInstance";
	};

	/**
	 * Get parent
	 * 
	 * @command Instance.getParent()
	 * 
	 * @returns {Instance} - Parent instance
	 * 
	 */
	ExternalInstance.prototype.getParent = function () {
		throw "Invalid operation with ExternalInstance";
	};

	/**
	 * Get children instances
	 * 
	 * @command Instance.addChild()
	 */
	ExternalInstance.prototype.addChild = function (child) {
		throw "Invalid operation with ExternalInstance";
	};

	/**
	 * Return connections, user GEPPETTO.Resources.INPUT / OUTPUT /
	 * INPUT_OUTPUT to filter
	 * 
	 * @command Instance.getConnections(direction)
	 * 
	 * @returns {List<Instance>}
	 * 
	 */
	ExternalInstance.prototype.getConnections= function (direction) {
		return this.connections;
	};

	/**
	 * Deletes instance
	 */
	ExternalInstance.prototype.delete = function () {
		throw "Invalid operation with ExternalInstance";
	};

	return ExternalInstance;
});
