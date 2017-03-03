
/**
 * Widget Utility Class
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */

/**
 * Load CSS File
 *
 * @module WidgetUtility
 * @param url
 */
define(function(require){
	function loadCss(url) {
	    var link = document.createElement("link");
	    link.type = "text/css";
	    link.rel = "stylesheet";
	    link.href = url;
	    document.getElementsByTagName("head")[0].appendChild(link);
	}
	
	return{
		loadCss: loadCss
	};
	
});
