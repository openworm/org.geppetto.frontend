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
 * Loads scatter3d scripts
 *
 * @author Boris Marin
 * @author Adrian Quintana
 */
/*
 * Configure what dependencies are needed for each library
 */
require.config({
	paths : {
		"threelib" :"widgets/scatter3d/vendor/three.min",
	},
	shim: {
		"widgets/scatter3d/vendor/OrbitControls" : ["threelib"],
		"widgets/scatter3d/vendor/helvetiker_regular.typeface" : ["threelib"]
	}
});

var reqs = [];
reqs.push("threelib");
reqs.push("widgets/scatter3d/vendor/OrbitControls");
reqs.push("widgets/scatter3d/vendor/helvetiker_regular.typeface");

require(reqs, function($) {
	loadCss("assets/js/widgets/scatter3d/Scatter3d.css");
});

define(function(require) {
	return function(GEPPETTO) {
		require("widgets/scatter3d/controllers/Scatter3dController")(GEPPETTO);
	};
});
