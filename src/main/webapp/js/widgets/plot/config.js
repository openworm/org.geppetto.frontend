

/**
 * Loads plot scripts
 *
 * @author Jesus Martinez (jesus@metacell.us)
 */
/*
 * Configure what dependencies are needed for each library
 */



//Load PlotsController and other classes using GEPPETTO
define(function(require) {
	return function(GEPPETTO) {
		// Register Commands
		GEPPETTO.MenuManager.registerNewCommandProvider([GEPPETTO.Resources.DYNAMICS_TYPE,GEPPETTO.Resources.VARIABLE_NODE],
				GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getCommands);
	};
});

