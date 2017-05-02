/**
 * Tree Visualiser Widget
 *
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function (require) {

    var Widget = require('../Widget');
    var TreeVisualiserController = require('./TreeVisualiserController');

    return {
        TreeVisualiser: Widget.View.extend({

        	treeVisualiserController: null,
        	
            initialize: function (options) {
                Widget.View.prototype.initialize.call(this, options);

                this.dataset = {data: [], isDisplayed: false, valueDict: {}};
                this.visible = options.visible;
                this.render();
                this.setSize(options.width, options.height);
                
            },

            setData: function (state, options, dataset) {
                // If no options specify by user, use default options
                if (options != null) {
                    $.extend(this.options, options);
                }

                if (state != null) {
                	this.treeVisualiserController = new TreeVisualiserController(this.options);
                    return this.treeVisualiserController.convertNodeToTreeVisualiserNode(state);
                }
                return null;
            },

            getDatasets: function () {
                return this.datasets;
            }

        })
    };

});