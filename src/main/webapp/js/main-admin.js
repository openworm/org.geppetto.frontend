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
 *        OpenWorm - http://openworm.org/people.html
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
 * Loads all scripts needed for Geppetto
 *
 * @author Jesus Martinez (jesus@metacell.us)
 * @author Matt Olson (matt@metacell.us)
 */


/*
 * Configure RequireJS. Values inside brackets mean those libraries are required prior
 * to loading the one one. 
 */
require.config({
	
	
    /*
     * Values in here are for dependencies that more than one module/script requires and/or needs.
     * E.G. If depenedency it's used more than once, it goes in here.
     */
    paths: {
        jquery: "vendor/jquery-1.9.1.min",
        underscore: 'vendor/underscore.min',
        react: 'vendor/react',
        'react-dom': 'vendor/react-dom',
        griddle: 'vendor/griddle',
        jsx: 'vendor/jsx',
        JSXTransformer: 'vendor/JSXTransformer',
        text: 'vendor/text',
        json: 'vendor/require-json'
    },
    /*
     * Notes what dependencies are needed prior to loading each library, values on the right
     * of colon are dependencies. If dependency was declared in path above, then add it's dependencies
     * to that object in here.
     */
    shim: {
        'vendor/jquery-ui.min': ["jquery"],
        'vendor/bootstrap.min': ["jquery"],
        JSXTransformer: {
            exports: "JSXTransformer"
        }
    }
});

/*
 * Adds all libs to an array
 */
var jqueryLib = [
    "jquery",
    "vendor/bootstrap.min",
];

require(jqueryLib, function () {
    require(['components/admin'], function () {
    });
});

