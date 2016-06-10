({
    preserveLicenseComments: false,
    paths: {
    	jquery :'vendor/jquery-1.9.1.min',
		three : 'vendor/three.min',
		d3 : 'vendor/d3.min',
		codemirror :"vendor/codemirror.min",
		underscore : 'vendor/underscore.min',
		backbone : 'vendor/backbone.min',
		'backbone-store' : 'vendor/backbone-localStorage.min',
		'backbone-associations' : 'vendor/backbone-associations-min',
		geppetto : 'GEPPETTO',
		react: 'vendor/react',
        'react-dom': 'vendor/react-dom',
        griddle: 'vendor/griddle',
		jsx: 'vendor/jsx',
        JSXTransformer: 'vendor/JSXTransformer',
    	handlebars: "vendor/handlebars",
    	typeahead: "vendor/typeahead.jquery",
        bloodhound: "vendor/bloodhound",
        text: 'vendor/text',
        pako:'vendor/pako.min',
        mathjs:'vendor/math.min'
    },
    shim: {
        'vendor/jquery-ui': ["jquery"],
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
        typeahead: {
            deps: ['jquery'],
            init: function ($) {
                return require.s.contexts._.registry['typeahead.js'].factory($);
            }
        },
        bloodhound: {
            deps: ['jquery'],
            exports: 'Bloodhound'
        }
    },
    name : "main",
    waitSeconds : 200,
})