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
 * Client class for Simulator Configurator; stores time step, simualtor id
 * and parameters.
 * 
 * @module nodes/SimulatorConfiguration
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Node = require('nodes/Node');

	return Node.Model.extend({
		simulatorId : "",
		conversionId : "",
		timeStep : null,
		length : null,
		parameters : null,

		/**
		 * Stores simulator configuration values 
		 * 
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			//initialize parameters array
			this.parameters = options.parameters;
			this.id = options.id;
			this.simulatorId=options.simulatorId;
			this.conversionId=options.conversionId;
			this.timeStep=options.timeStep;
			this.length=options.length;
			this._metaType = options._metaType;
		},

		/**
		 * Get parameters for this Simulator Configuration
		 * 
		 * @command SimulatorConfig.getParameters()
		 * @returns {Array} Array of ParameterNodes
		 */
		getParameters : function() {
			return this.parameters;
		},
		
		/**
		 * Get parameter for this Simulator Configuration
		 * 
		 * @command SimulatorConfig.getSimulatorParameter()
		 * @returns {Array} Array of ParameterNodes
		 */
		getSimulatorParameter : function(parameter) {
			return this.parameters[parameter];
		},
		
		/**
		 * Gets an experiment from this project. 
		 * 
		 * @command SimulatorConfig.setParameters(parameters)
		 */
		setParameters : function(parameters){
			return this.parameters = parameters;
		},
		
		/**
		 * Gets the simulator id for this Simulator Configuration
		 * 
		 * @command SimulatorConfig.getsimulatorId()
		 * @returns {String} simulatorId string
		 */
		getSimulator : function() {
			return this.simulatorId;
		},
		
		/**
		 * Gets the conversion service for this Simulator Configuration
		 * 
		 * @command SimulatorConfig.getsimulatorId()
		 * @returns {String} simulatorId string
		 */
		getConversionService : function() {
			return this.conversionId;
		},
		
		/**
		 * Sets the simulatorId for this Simulator Configuration 
		 * 
		 * @command SimulatorConfig.setsimulatorId(simulatorId)
		 */
		setSimulator : function(simulatorId){
			var properties = {};
			properties["simulatorId"] = simulatorId;
			getParent().saveExperimentFields(properties);
			return this.simulatorId = simulatorId;
		},
		
		/**
		 * Get time step for this Simulator Configuration
		 * 
		 * @command SimulatorConfig.getTimeStep()
		 * @returns {String} String value of timestep 
		 */
		getTimeStep : function() {
			return this.timeStep;
		},
		
		/**
		 * Sets the time step for the simulator configuration
		 * 
		 * @command SimulatorConfig.setTimeStep(timeStep)
		 */
		setTimeStep : function(timeStep){
			
			return this.timeStep = timeStep;
		},
		
		/**
		 * Get simulation length for this Simulator Configuration
		 * 
		 * @command SimulatorConfig.getLength()
		 * @returns {String} String value of simulation length 
		 */
		getLength : function() {
			return this.length;
		},
		
		/**
		 * Sets the length for the simulator configuration
		 * 
		 * @command SimulatorConfig.setLength(length)
		 */
		setLength : function(length){
			return this.length = length;
		},
		
		/**
		 * Print out formatted node
		 */
		print : function() {
			return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n"
					+ "    InstancePath : " + this.instancePath + "\n"
					+ "    simulatorId : " + this.simulatorId + "\n";
		}
	});
});
