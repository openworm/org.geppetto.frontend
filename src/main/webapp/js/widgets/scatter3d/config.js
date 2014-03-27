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
	}
});

var reqs = [];
reqs.push("threelib");
reqs.push("widgets/scatter3d/vendor/OrbitControls");

require(reqs, function($) {
	loadCss("js/widgets/scatter3d/Scatter3d.css");
});

define(function(require) {
	return function(GEPPETTO) {
		require("widgets/scatter3d/controllers/Scatter3dController")(GEPPETTO);
	};
});


//define(function(require) {
//	return function(GEPPETTO) {
//		/**
//		 * Load CSS File
//		 * @param url
//		 */
//		function loadCss(url) {
//			var link = document.createElement("link");
//			link.type = "text/css";
//			link.rel = "stylesheet";
//			link.href = url;
//			document.getElementsByTagName("head")[0].appendChild(link);
//		}
//		
//		require("widgets/scatter3d/vendor/three.min");
//		require("widgets/scatter3d/vendor/OrbitControls");
//		require('widgets/scatter3d/controllers/Scatter3dController')(GEPPETTO);
//
//		loadCss("js/widgets/scatter3d/Scatter3d.css");
//
//	};
//});
