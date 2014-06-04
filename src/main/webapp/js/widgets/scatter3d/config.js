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
		"widgets/scatter3d/vendor/THREEx.WindowResize" : ["threelib"]
	}
});

var reqs = [];
reqs.push("threelib");
reqs.push("widgets/scatter3d/vendor/OrbitControls");
reqs.push("widgets/scatter3d/vendor/THREEx.WindowResize");

require(reqs, function($) {
	loadCss("js/widgets/scatter3d/Scatter3d.css");
});

define(function(require) {
	return function(GEPPETTO) {
		require("widgets/scatter3d/controllers/Scatter3dController")(GEPPETTO);
	};
});
