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
 *     	OpenWorm - http://openworm.org/people.html
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
 * @fileoverview GEPPETTO Visualisation engine built on top of THREE.js. Displays
 * a scene as defined on org.geppetto.core
 *
 * @author Jesus Martinez (jesus@metacell.us)
 */
GEPPETTO.SimulationContentEditor = GEPPETTO.SimulationContentEditor ||
{
	REVISION : '1'
};

GEPPETTO.SimulationContentEditor.editing = false;
GEPPETTO.SimulationContentEditor.schemaLocation = null;
GEPPETTO.SimulationContentEditor.xsi = null;
GEPPETTO.SimulationContentEditor.tns = null;

/**
 * Load simulation template from resources. 
 * 
 * @param location
 */
GEPPETTO.SimulationContentEditor.loadXML = function(location){
	$.ajax({
	      type: "GET",
	      url: location,
	      dataType: "xml",
	      success: function(result) {
	    	  
	    	  //Populate Content area for template with file values
	    	  GEPPETTO.SimulationContentEditor.tns = '"' + $(result).find('simulation').attr("xmlns:tns") + '"';
	    	  GEPPETTO.SimulationContentEditor.xsi = '"' + $(result).find('simulation').attr("xmlns:xsi") + '"';
	    	  GEPPETTO.SimulationContentEditor.schemaLocation = 
	    		  							'"' + $(result).find('simulation').attr("xsi:schemaLocation") + '"';
	    	  
	    	  $('#xmlns-tns').html(GEPPETTO.SimulationContentEditor.tns);
	    	  $('#xmlns-xsi').html(GEPPETTO.SimulationContentEditor.xsi);
	    	  $('#xsi-schemaLocation').html(GEPPETTO.SimulationContentEditor.schemaLocation);
	    	  
	    	  //Look for simualtion element
	    	  $(result).find('simulation').each(function(){
	    	      var outputFormat = $(this).find('configuration').text().trim();
	    	      var simName = $(this).find('name').text().trim();
	    
	    	      $('#outputFormat').html(outputFormat);
	    	      $('#name').html(simName);
	    	      
	    	      //Looks for aspects elements and child elements 
	    	      $(this).find('aspects').each(function(){
	    	    	  var modelInterpreter = $(this).find('modelInterpreter').text().trim();
		    	      var modelURL = $(this).find('modelURL').text().trim();
		    	      var sphSimulator = $(this).find('simulator').text().trim();
		    	      var id = $(this).find('id').text().trim();
		    	      
		    	      //Set values in content are for user to see
		    	      $('#modelInterpreter').html(modelInterpreter);
		    	      $('#modelURL').html(modelURL);
		    	      $('#simulator').html(sphSimulator);
		    	      $('#id').html(id);
	    	      });
	    	    });
	      }
	});
};


/**
 * Handles showing input fields when user edits values inside xml elements
 */
GEPPETTO.SimulationContentEditor.handleContentEdit = function(){	
	$(document).ready(function()
	{
		//Enter text becomes part of XML, hide input field
		$('.manualInput').keyup(function (e) {
			if (e.keyCode == 13) {
				var id = $(this).attr("id");
	        
				var input =document.getElementById(id);				
				var label = document.getElementById(id.replace("-input",""));
				
				var inputValue = $(input).val();

				$(input).hide();
				
				if(inputValue != ""){
					$(label).text(inputValue);
				}
				
				$(label).show();
				
				GEPPETTO.SimulationContentEditor.editing = true;
			}
		});
		
		$('#editArea').on('click', '.editable', function (){
			var id = $(this).attr("id");
			
			var label = document.getElementById(id);
			var input = document.getElementById(id+"-input");
			
			$(label).hide();
			$(input).show();
			$(input).focus();
		});
		
		$('.manualInput').mouseout(function () {
			var id = $(this).attr("id");

			var input =document.getElementById(id);
			var label = document.getElementById(id.replace("-input",""));

			var inputValue = $(input).val();
			
			$(input).hide();
			
			if(inputValue != ""){
				$(label).text(inputValue);
			}
			
			$(label).show();

			GEPPETTO.SimulationContentEditor.editing = true;
		});
	});

};

/**
 * Modify the content area with the information of the simulation selected
 * from the samples drop down list.
 */
GEPPETTO.SimulationContentEditor.loadSampleSimulationFile = function(result) {
			
	//selected simulation information
	var simulation = jQuery.parseJSON(result);
	
	//get the output format from the selected simulation
	var outputFormat = simulation.configuration.outputFormat;
	
	//apply outputformat of selected simulation to html label
	$('#outputFormat').html(outputFormat);
	$('#outputFormat-input').val(outputFormat);
	
	//apply aspects of selected simulation to html labels
	for(var i in simulation.aspects){
		var modelInterpreter = simulation.aspects[i].modelInterpreter;
		var modelURL = simulation.aspects[i].modelURL;
		var simulator = simulation.aspects[i].simulator;
		var id = simulation.aspects[i].id;

		$('#modelInterpreter').html(modelInterpreter);
		$('#modelURL').html(modelURL);
		$('#simulator').html(simulator);
		$('#id').html(id);
		
		$('#modelInterpreter-input').val(modelInterpreter);
		$('#modelURL-input').val(modelURL);
		$('#simulator-input').val(simulator);
		$('#id-input').val(id);
		
		
	}
	
	//apply name of selected simulation to html divs
	var name = simulation.name;
	$('#name').html(name);
	$('#name-input').val(name);
};

/**
 * Creates a JSON object string to send to servlet. JSON 
 * object contains simulation information read from edit area.
 */
GEPPETTO.SimulationContentEditor.getEditedSimulation = function(){
	var jsonObj = {};
	var config = {};
	var aspects = {};
	var name=0;
	
	//Get each element that was editable
	$('.editable').each(function() {
		var idValue = document.getElementById(this.id).innerHTML;

		//Add output format to configuration object
		if(this.id == "outputFormat"){			
			config[this.id] = idValue;
		}
		
		//Name is part of its own object
		else if(this.id == "name"){
			name = idValue;
		}
		
		//Add rest of editable components to aspects where they belong
		else{
			aspects[this.id] = idValue;			
		}
	});	
	
	//Aspects need to added as an array
	var bracketAspects = [];
	bracketAspects[0] = aspects;
	
	//add configuration, aspects and name to json object
	jsonObj["configuration"] = config;
 	jsonObj["aspects"] = bracketAspects;
	jsonObj["name"] = name;
	
	//create string with json object
	var json = JSON.stringify(jsonObj);
	
    return json;
};

GEPPETTO.SimulationContentEditor.isEditing = function(editing){
	GEPPETTO.SimulationContentEditor.editing = editing;
};