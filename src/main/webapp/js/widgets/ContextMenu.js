//define(['contextMenu'], function (ContextMenu) {
//    'use strict';
define(function(require) {
	return function(GEPPETTO) {
	
		
		/*
		 * MODELS AND COLLECTIONS
		 */
		
		//ITEM		
		var ContextMenuItem = Backbone.Model.extend({
			defaults: {
				position: "Not specified",
				text: "Not specified",
				groups: "Not specified",
			},
			initialize: function(attributes){
				if (typeof attributes.groups != 'undefined'){
					this.set("groups", new ContextMenuGroups(attributes.groups));
				}
			}
		});
		
		var ContextMenuItems = Backbone.Collection.extend({
			model: ContextMenuItem
		});
		
		//GROUP
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
		
		//MENU
		var ContextMenuModel= Backbone.Model.extend({
	    	model: ContextMenuGroups,
			initialize: function(attributes){
				this.set("groups", new ContextMenuGroups(attributes.groups));
			}
	    });
		
		/*
		 * VIEWS
		 */
		var ContextMenuViewItems = Backbone.View.extend({
			template: _.template($('#tplContextMenuItems').html()),
			
			initialize: function (options) {
				this.items = options.items;
//				this.render();
			},
			
			 render: function () {
				 
//				 this.items.each( function(model){
//					 this.$el.html(this.template(this.groups.toJSON()));
//			      
//					 var view = new ContextMenuViewItems({items: this.groups });
//			         this.$el.append(view.render.el);
//			    });   
				 
				 
				 this.$el.append(this.template(this.items.toJSON()));
	            return this;
	        }
		});
		
		var ContextMenuViewGroups = Backbone.View.extend({
			template: _.template($('#tplContextMenuGroups').html()), 
			
			initialize: function (options) {
				this.groups = options.groups;
//				this.render();
			},
			
			render: function () {
				
				 this.$el.html(this.template(this.groups.toJSON()));
				 var views = {};
				 this.groups.get("groups").each( function(group){
					 views[group.get("id")] = new ContextMenuViewItems({items: group });
			    });
				for (var viewKey in views){
					this.$el.find("#"+viewKey).append(views[viewKey].render().el.childNodes);
				}
				 
		        return this;
			 }
		});
		
		GEPPETTO.ContextMenuView = Backbone.View.extend({

	        className: 'contextMenuView',
	        template: _.template($('#tplContextMenu').html()),
	        parentSelector: 'body',
	
	        events : {
				'click li' : 'manageMenuClickEvent'
			},
			manageMenuClickEvent: function(event){
				var itemId = $(event.target).attr('id');
				
				var registedItem = this.registeredItems[itemId];
				console.log('click');
				registedItem['action'](this.data);
			},
			
	        render: function () {
//	            this.$el.html(this.template(this.model.toJSON()));
	        	this.$el.html(this.template());	            
	            
	        	var view = new ContextMenuViewGroups({groups: this.model });
	            this.$el.append(view.render().el.childNodes);
	            
	            
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
	            
	
	            return this;
	        },
	
	        initialize: function () {
	            //  TODO: If I implement Backbone View's more properly, then 'body' should be responsible for this, but for now this is fine.
	            this.$el.appendTo(this.parentSelector);
	            
	            var self = this;
	            //  Hide the context menu whenever any click occurs not just when selecting an item.
	            $(this.parentSelector).on('click', function () {
	                self.$el.hide();
	            });
	        },
	
	        show: function (options) {
	            if (options.top === undefined || options.left === undefined) throw "ContextMenu must be shown with top/left coordinates.";
	            if (options.groups === undefined) throw "ContextMenu needs ContextMenuGroups to be shown.";
	
	            this.top = options.top;
	            this.left = options.left;
	            this.model = new ContextMenuModel({
	            	groups: options.groups
	            });
	            this.registeredItems = options.registeredItems;
	            this.data = options.data;
	
	            this.render();
	        }
		});
	};
});
