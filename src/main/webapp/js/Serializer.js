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

/*
 * Class use for creating namespace objects for the simulation states being watched.
 * Serializer is not used right now by Geppetto
 */
define(function(require) {
	return function(GEPPETTO) {
		/**
		 * Method responsible for serializing values to simulation states
		 */
		GEPPETTO.Serializer = {

			/**
			 * Converts string representation of variable into object,
			 * inserts them into the window object
			 * Examples:
			 *   "hhcell.electrical.hhpop[0].v"
			 *   "hhcell.electrical.hhpop.v"
			 *
			 **/
			stringToObject: function(input) {
				var arrPattern = /(\w+)\[(\d*)\]$/;

				function index(obj, element) {
					var matches = element.match(arrPattern);
					if(!matches) {
						return obj[element];
					}
					else {
						if(!obj[matches[1]]) {
							obj[matches[1]] = [];
						}
						var arrIndex = parseInt(matches[2]);
						return obj[matches[1]][arrIndex];
					}
				}
				input.split('.').reduce(index, window);
			}
		};

	};
});