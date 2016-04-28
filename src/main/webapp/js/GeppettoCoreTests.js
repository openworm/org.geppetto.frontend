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
        'jquery': "vendor/jquery-1.9.1.min",
        'three': 'vendor/three.min',
        'd3': 'vendor/d3.min',
        'codemirror': "vendor/codemirror.min",
        'underscore': 'vendor/underscore.min',
        'backbone': 'vendor/backbone.min',
        'backbone-store': 'vendor/backbone-localStorage.min',
        'geppetto': "GEPPETTO",
        'QUnit': 'vendor/qunit',
        react: 'vendor/react',
        'react-dom': 'vendor/react-dom',
        griddle: 'vendor/griddle',
        jsx: 'vendor/jsx',
        JSXTransformer: 'vendor/JSXTransformer',
        text: 'vendor/text',
        pako: 'vendor/pako.min',
        mathjs: 'vendor/math.min'
    },
    /*
     * Notes what dependencies are needed prior to loading each library, values on the right
     * of colon are dependencies. If dependency was declared in path above, then add it's dependencies
     * to that object in here.
     */
    shim: {
        'vendor/jquery-ui.min': ["jquery"],
        'vendor/TrackballControls': ["three"],
        'vendor/THREEx.KeyboardState': ['three'],
        'vendor/shaders/ConvolutionShader': ['three'],
        'vendor/shaders/CopyShader': ['three'],
        'vendor/shaders/FilmShader': ['three'],
        'vendor/shaders/FocusShader': ['three'],
        'vendor/postprocessing/EffectComposer': ['three'],
        'vendor/postprocessing/MaskPass': ['three'],
        'vendor/postprocessing/RenderPass': ['three'],
        'vendor/postprocessing/BloomPass': ['three'],
        'vendor/postprocessing/ShaderPass': ['three'],
        'vendor/postprocessing/FilmPass': ['three'],
        'vendor/ColladaLoader': ['three'],
        'vendor/OBJLoader': ['three'],
        'vendor/ColorConverter': ["three"],
        'vendor/bootstrap.min': ["jquery"],
        'vendor/codemirror-formats.min': ["codemirror"],
        'vendor/backbone-localStorage.min': ["backbone"],
        'vendor/dat.gui.min': ["jquery"],
        'vendor/stats.min': ["jquery"],
        'vendor/Detector': ["jquery"],
        'vendor/jquery.cookie': ["jquery"],
        'vendor/rAF': ["jquery"],
        'widgets/plot/vendor/jquery.flot.min': ['jquery'],
        'widgets/plot/vendor/jquery.flot.resize.min': ['widgets/plot/vendor/jquery.flot.min'],
        'widgets/plot/vendor/jquery.flot.axislabels.min': ['widgets/plot/vendor/jquery.flot.min'],
        'QUnit': {
            exports: 'QUnit',
            deps: ['geppetto'],
            init: function () {
                QUnit.config.autoload = false;
                QUnit.config.autostart = false;
            }
        }

    }
});

/*
 * Adds all libs to an array
 */
var jqueryLib = [];
jqueryLib.push("jquery");
jqueryLib.push("geppetto");
jqueryLib.push("three");
jqueryLib.push("d3");
jqueryLib.push("vendor/THREEx.KeyboardState");
jqueryLib.push("vendor/ColladaLoader");
jqueryLib.push("vendor/OBJLoader");
jqueryLib.push("vendor/jquery-ui.min");
jqueryLib.push("vendor/TrackballControls");
jqueryLib.push("vendor/ColorConverter");
jqueryLib.push("vendor/bootstrap.min");
jqueryLib.push("codemirror");
jqueryLib.push("vendor/codemirror-formats.min");
jqueryLib.push("vendor/dat.gui.min");
jqueryLib.push("vendor/stats.min");
jqueryLib.push("vendor/Detector");
jqueryLib.push("vendor/jquery.cookie");
jqueryLib.push("vendor/rAF");
jqueryLib.push("pako");
jqueryLib.push("mathjs");

require(jqueryLib, function ($) {

    var ProjectNode = require('model/ProjectNode');
    $(function () {
        var project = new ProjectNode({name: "Project", id: -1});
        window.Project = project;
        window.GEPPETTO = require('geppetto');
        //Alias G, Simulation, and help() to global vars for easy access
        window.G = GEPPETTO.G;
        window.Widgets = GEPPETTO.Widgets;
        window.help = GEPPETTO.Utility.help;

        require(
            ['QUnit', 'tests/QUnitGeppettoCoreTests'],
            function (QUnit, geppettoCoreTests) {
                // run the tests.
                geppettoCoreTests.run();

                // start QUnit.
                QUnit.load();
                QUnit.start();
            }
        );
    });

});
