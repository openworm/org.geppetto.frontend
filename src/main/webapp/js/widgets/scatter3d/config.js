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
	return function(GEPPETTO) {
		/**
		 * Load CSS File
		 * @param url
		 */
		function loadCss(url) {
			var link = document.createElement("link");
			link.type = "text/css";
			link.rel = "stylesheet";
			link.href = url;
			document.getElementsByTagName("head")[0].appendChild(link);
		}
		
		reqs = [];
		reqs.push("widgets/scatter3d/vendor/three.min");
		reqs.push("widgets/scatter3d/vendor/OrbitControl");
		reqs.push('widgets/scatter3d/controllers/Scatter3dController');

		require(reqs, function($) {
			loadCss("js/widgets/scatter3d/Scatter3d.css");
		});

	};
});
