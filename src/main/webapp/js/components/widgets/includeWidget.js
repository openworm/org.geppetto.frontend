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
        require("./Widget.less");
    };
});
