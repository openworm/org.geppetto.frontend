//define(['contextMenu'], function (ContextMenu) {
//    'use strict';
define(function(require) {
	return function(GEPPETTO) {
	
		var ContextMenuItem = Backbone.Model.extend({
			defaults: {
				position: "Not specified",
				text: "Not specified"
			}
		});
		
		var ContextMenuItems = Backbone.Collection.extend({
			model: ContextMenuItem
		});
		
		var ContextMenuGroup = Backbone.Model.extend({
			//model: this.ContextMenuItems
			defaults: {
				position: "Not specified",
				items: new ContextMenuItems()
			},
			initialize: function(attributes){
				this.set("items", new ContextMenuItems(attributes.items));
			}
			
		});
		
		var ContextMenuGroups = Backbone.Collection.extend({
			model: ContextMenuGroup
		});
		
		var ContextMenuModel= Backbone.Model.extend({
	    	model: ContextMenuGroups,
			initialize: function(attributes){
				this.set("groups", new ContextMenuGroups(attributes.groups));
			}
	    
	    });
		
		GEPPETTO.ContextMenuView = Backbone.View.extend({

	        className: 'contextMenuView',
	        template: _.template($('#tplContextMenu').html()),
	        parentSelector: 'body',
	
	        render: function () {
	            this.$el.html(this.template(this.model.toJSON()));
	
	            //  Prevent display outside viewport.
	            var offsetTop = this.top;
	            var needsVerticalFlip = offsetTop + this.$el.height() > $(this.parentSelector).height();
	            if (needsVerticalFlip) {
	                offsetTop = offsetTop - this.$el.height();
	            }
	
	            var offsetLeft = this.left;
	            var needsHorizontalFlip = offsetLeft + this.$el.width() > $(this.parentSelector).width();
	            if (needsHorizontalFlip) {
	                offsetLeft = offsetLeft - this.$el.width();
	            }
	
	            //  Show the element before setting offset to ensure correct positioning.
	            this.$el.show().offset({
	                top: this.top,
	                left: this.left
	            });
	            
	//            this.$el.attr("class", "contextMenuView");
	
	            return this;
	        },
	
	        initialize: function () {
	            //  TODO: If I implement Backbone View's more properly, then 'body' should be responsible for this, but for now this is fine.
	            this.$el.appendTo(this.parentSelector);
	
	//            var self = this;
	            //  Hide the context menu whenever any click occurs not just when selecting an item.
	//            $(this.parentSelector).on('click contextmenu', function () {
	//                self.$el.hide();
	//            });
	        },
	
	        show: function (options) {
	            if (options.top === undefined || options.left === undefined) throw "ContextMenu must be shown with top/left coordinates.";
	            if (options.groups === undefined) throw "ContextMenu needs ContextMenuGroups to be shown.";
	
	        	console.log("insideShowContextMenu");
	        	
	            this.top = options.top;
	            this.left = options.left;
	            
	            this.model = new ContextMenuModel({
	                //groups: new ContextMenuGroups(options.groups)
	            	groups: options.groups
	            });
	
	            this.render();
	        }
		});
	};
});
