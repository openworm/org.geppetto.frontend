/**
 * Controller class for scatter3d widget. Use to make calls to widget from inside Geppetto.
 *
 * @constructor
 *
 * @author Boris Marin
 * @author Adrian Quintana
 */
define(function(require) {
  return function(GEPPETTO) {

    var Scatter3d = require('widgets/scatter3d/Scatter3d');
    var scatter3ds = new Array();

    var scatter3dON = false;

    GEPPETTO.Scatter3dController = {

      /**
       * Registers widget events to detect and execute following actions.
       * Used when widget is destroyed.
       *
       * @param scatter3dID
       */
      registerHandler: function(scatter3dID) {
        GEPPETTO.WidgetsListener.subscribe(GEPPETTO.Scatter3dController, scatter3dID);
      },

      /**
       * Returns all 3d scatter plot widgets objects
       */
      getWidgets: function() {
        return scatter3ds;
      },

      /**
       * Creates 3d scatterplot widget
       *
       * @ return {Widget} - Scatter3d widget
       */
      addScatter3dWidget: function() {

        var index = (scatter3ds.length + 1);

        var name = "Scatter3d" + index;
        var id = name;

        var p = window[name] = new Scatter3d({id:id, name:name,visible:true});

        //create help command for scatter3d
        p.help = function(){return GEPPETTO.Utility.getObjectCommands(id);};

        scatter3ds.push(p);

        this.registerHandler(id);

        //add commands to console autocomplete and help option
        GEPPETTO.Utility.updateCommands("js/widgets/scatter3d/Scatter3d.js", p, id);

        return p;
      },

      /**
       * Removes existing scatter3d widgets
       */
      removeScatter3dWidgets: function() {
        //remove all existing scatter3d widgets
        for(var i = 0; i < scatter3ds.length; i++) {
          var scatter3d = scatter3ds[i];

          scatter3d.destroy();
          i--;
        }

        scatter3ds = new Array();
      },

      /**
       * Toggles scatter3d widget on and off
       */
      toggle: function() {
        //if there aren't widgets to toggle, create one
        if(scatter3ds.length == 0) {
          GEPPETTO.Console.executeCommand('G.addWidget(GEPPETTO.Widgets.SCATTER3D)');
        }
        //scatter3d widgets exist, toggle them
        else if(scatter3ds.length > 0) {
          scatter3dON = !scatter3dON;

          for(var p in scatter3ds) {
            var scatter3d = scatter3ds[p];
            if(scatter3dON) {
              scatter3d.hide();
            }
            else {
              scatter3d.show();
            }
          }
        }
      },

      //receives updates from widget listener class to update scatter3d widget(s)
      update: function(event) {
        //delete scatter3d widget(s)
        if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
          this.removeScatter3dWidgets();
        }
        //reset plot's datasets
		else if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.RESET_DATA) {
			for(var i = 0; i < scatter3ds.length; i++) {
				var scatter3d = scatter3ds[i];
				
				scatter3d.cleanDataSets();
			}
		}

        //update scatter3d widgets
        else if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.UPDATE) {
          //loop through all existing widgets
          for(var i = 0; i < scatter3ds.length; i++) {
            var scatter3d = scatter3ds[i];

            //update scatter3d with new data set
            scatter3d.updateDataSet();
            
          }
        }
      }

    };
  };
});
