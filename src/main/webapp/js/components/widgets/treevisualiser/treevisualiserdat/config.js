/**
 * Loads tree visualiser scripts
 *
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
 define(function(require) {
 	return function(GEPPETTO) {
 		// Register Commands
         GEPPETTO.MenuManager.registerNewCommandProvider([GEPPETTO.Resources.VARIABLE_NODE,
                                                          GEPPETTO.Resources.COMPOSITE_TYPE_NODE,
                                                          GEPPETTO.Resources.ARRAY_TYPE_NODE,
                                                          GEPPETTO.Resources.INSTANCE_NODE,
                                                          GEPPETTO.Resources.ARRAY_INSTANCE_NODE,
                                                          GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE,
                                                          GEPPETTO.Resources.VISUAL_GROUP_NODE],
                                                          GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.TREEVISUALISERDAT).getCommands);
 	};
 });
