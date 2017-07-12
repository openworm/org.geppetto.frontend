/**
 * Loads widget scripts
 *
 * @author Jesus Martinez (jesus@metacell.us)
 */

//Widget Classes
define(function (require) {

    return function (GEPPETTO) {

        require('./WidgetFactory')(GEPPETTO);
        require('./WidgetsListener')(GEPPETTO);
        require("./ContextMenu")(GEPPETTO);
        //Plot Widget
        require("./plot/config")(GEPPETTO);
		//TreeVisualiser DAT Widget
        require("./treevisualiser/treevisualiserdat/config")(GEPPETTO);

        require("./Widget.less");
    };
});
