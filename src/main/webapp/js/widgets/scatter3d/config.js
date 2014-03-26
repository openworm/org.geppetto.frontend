/**
 * Loads scatter3d scripts
 *
 * @author Boris Marin
 * @author Adrian Quintana
 */
/*
 * Configure what dependencies are needed for each library
 */
define(function(require) {
	require.config({
		paths : {
			"three" :"widgets/plot/vendor/three.min",
		},
		shim: {
			"widgets/plot/vendor/OrbitControl" : ["three"],
		}
	});
	
	reqs = [];
	reqs.push("widgets/scatter3d/vendor/three.min");
	reqs.push("widgets/scatter3d/vendor/OrbitControl");

	require(reqs, function($) {
		loadCss("js/widgets/scatter3d/Scatter3d.css");
	});
	
	define(function(require) {
		return function(GEPPETTO) {
			require("widgets/scatter3d/controllers/Scatter3dController")(GEPPETTO);
		};
	});

});
