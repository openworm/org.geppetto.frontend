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
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function (require) {

    var Widget = require('widgets/Widget');
    var $ = require('jquery');
    var form; 
    var submitButton;

    return Widget.View.extend({

            initialize: function (options) {
                Widget.View.prototype.initialize.call(this, options);

                this.visible = options.visible;
                this.render();
                this.setSize(options.width, options.height);
             // Initialise default options
                this.options = { width: "auto", autoPlace: false};
                
            },
            
            getForm: function(){
            	return form;
            },
            
            generateForm: function(structure, submitButton){
            	if (submitButton == undefined){
            		submitButton =false;
            	}

                form = new Backbone.Form({
                	schema: structure,
                    submitButton: submitButton
                }).render();
                
                if (submitButton){
                	submitButton = form.$('button').addClass('btn');
                }
                
                this.dialog.append(form.el);
               return this;
            },

            setData: function (state, options, dataset) {
                // If no options specify by user, use default options
                if (options != null) {
                    $.extend(this.options, options);
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