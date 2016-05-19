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
 * Tree Visualiser Widget
 *
 * @module Widgets/TreeVisualizerDAT
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */

define(function (require) {

    var Form = require('widgets/form/Form');
    var $ = require('jquery');
    var form; 
    
    
    return Form.Form.extend({

        /**
         * Initializes the TreeVisualiserDAT given a set of options
         *
         * @param {Object} options - Object with options for the TreeVisualiserDAT widget
         */
        initialize: function (options) {
            Form.Form.prototype.initialize.call(this, options);

            // Initialise default options
            this.options = { width: "auto", autoPlace: false};
            
            
           

//            this.initDATGUI();
        },
        
        generateForm: function(structure){
        	if (structure == undefined){
        		structure = {
        				experimentName:{type:'Text', title: 'Experiment Name'},
        				timeStep:{type:'Number', title: 'Time Step'},
        				lenght:{type:'Number', title: 'Length'},
        				simulator:{type:'Select', title: 'Simulator', options: ['Neuron', 'jLems']},
        				numberProcessors:{type:'Number', title: 'Number of Processors'}
        		};
        	}
//        	var User = Backbone.Model.extend({
//                schema: structure
//            });
//
//            var user = new User();

            form = new Backbone.Form({
            	schema: structure,
            	//model: user,
                submitButton: 'Mandale'
            }).render();
            
            form.on('submit', function(event) {
                console.log('Probando submit');
                console.log(form.getValue());
                // where extra is an array of extra arguments that
                // a custom editor might need
                event.preventDefault();
            });


            this.dialog.append(form.el);
           return this;

        },

        /**
         * Sets the data used inside the TreeVisualiserDAT for rendering.
         *
         * @param {Array} state - Array of variables used to display inside TreeVisualiserDAT
         * @param {Object} options - Set of options passed to widget to customise it
         */
        setData: function (state, options) {
            if (state == undefined){
            	state = {'experimentName': 'Experiment 1',
            			timeStep: 0.0005,
        				lenght: 0.1,
        				numberProcessors: 4};
            }
        	
        	form.setValue(state);
        	
        	return this;
        },
        
        /**
         * Updates the data that the TreeVisualiserDAT is rendering
         */
        updateData: function (step) {
        	for (var i = 0; i < this.dataset.data.length; i++){
        		this.prepareTree(this.gui, this.dataset.data[i], step);
        	}
        },

        /**
         * Clear Widget
         */
        reset: function () {
        	this.dataset = {data: [], isDisplayed: false, valueDict: {}};
            $(this.dialog).children().remove();
            this.initDATGUI();
        },

        /**
         * Refresh data in tree visualiser
         */
        refresh: function () {
            var currentDatasets = this.dataset.data;
            this.reset();
            for (var i = 0; i < currentDatasets.length; i++){
            	this.initialiseGUIElements(currentDatasets[i]);
        	}
        }


    });
});