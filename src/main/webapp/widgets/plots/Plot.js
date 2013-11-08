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
 * Plot Widget class
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */

var Plot = Widget.View.extend({

	initialize : function(options){
		this.render();
		this.dialog.append("<div class='plot' id='" + this.name + "'></div>");
		this.addLinePlot();
	},
	
	attributes: { class: 'graph' },

	seriesColumn: 'year',
	xaxisColumn: 'studio',
	yaxisColumn: 'gross',

	plotOptions: {
		yaxis: {},
		xaxis: {},
		legend: { show: true, container: '.legend' },
		grid: { hoverable: true, clickable: true, autoHighlight: true },
		series: {
			stack: true,
			bars: { show: true, fill: 0.7, barWidth: 0.8, align: 'center' }
		}
	},
	
	addValue : function(){
		for (v in this.variables)
		{
			varval = this.values[this.variables[v]];
			if (!varval)
			{
				varval = new Array();
				this.values[this.variables[v]] = varval;
			}
			if (varval.length > this.defaultBuffer)
				varval.splice(0, 1);

			if (jsonscene)
			{
				if (jsonscene.entities[0])
				{
					value = jsonscene.entities[entityId].metadata[this.variables[v]];
					varval.push(value);
				}
			}
			// Zip the generated y values with the x values

		}

		var resArray = [];
		for (k in this.values)
		{
			var res = [];
			for ( var i = 0; i < this.values[k].length; ++i)
			{
				res.push([ i, this.values[k][i] ]);
			}
			resArray.push(res);
		}
		this.flot.setData(resArray);
	},
	
	addLinePlot : function(state1){		
	}, 
	
	addLinePlot : function(state1, state2){
		
	}, 
	
	renderGraph: function() {
		GEPPETTO.Console.log("Rendering Graph");
	}
});