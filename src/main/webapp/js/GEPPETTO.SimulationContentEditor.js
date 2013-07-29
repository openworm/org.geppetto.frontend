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
	    	  var tns = '"' + $(result).find('simulation').attr("xmlns:tns") + '"';
	    	  var xsi = '"' + $(result).find('simulation').attr("xmlns:xsi") + '"';
	    	  var schemaLoc = '"' + $(result).find('simulation').attr("xsi:schemaLocation") + '"';
	    	  
	    	  $('#xmlns-tns').html(tns);
	    	  $('#xmlns-xsi').html(xsi);
	    	  $('#xsi-schemaLocation').html(schemaLoc);
	    	  
	    	  //Look for simualtion element
	    	  $(result).find('simulation').each(function(){
	    	      var outputFormat = $(this).find('configuration').text().trim();
	    	      var simName = $(this).find('name').text().trim();
	    
	    	      $('#outputFormat').html(outputFormat);
	    	      $('#simName').html(simName);
	    	      
	    	      //Looks for aspects elements and child elements 
	    	      $(this).find('aspects').each(function(){
	    	    	  var modelInterpreter = $(this).find('modelInterpreter').text().trim();
		    	      var modelURL = $(this).find('modelURL').text().trim();
		    	      var sphSimulator = $(this).find('simulator').text().trim();
		    	      var id = $(this).find('id').text().trim();
		    	      
		    	      //Set values in content are for user to see
		    	      $('#modelInterpreter').html(modelInterpreter);
		    	      $('#modelURL').html(modelURL);
		    	      $('#sphSimulator').html(sphSimulator);
		    	      $('#simID').html(id);
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
			}
		});
		
		$('.editable').click(function (){
			Console.log($('#editArea').text());
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

		});
	});

};
