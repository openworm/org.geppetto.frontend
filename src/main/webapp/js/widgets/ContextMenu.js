define(function(require) {
	return function(GEPPETTO) {
	
		var registeredItems = {};
		
		/*
		 * MODELS AND COLLECTIONS
		 */
		
		//ITEM		
		var ContextMenuItem = Backbone.Model.extend({
			defaults: {
				position: "Not specified",
				label: "Not specified",
				action: "Not specified",
				icon: "Not specified",
			},
			initialize: function(attributes){
				if (typeof attributes.groups != 'undefined'){
					this.set("groups", new ContextMenuGroups(attributes.groups));
				}
				
			}
		});
		
		var ContextMenuItems = Backbone.Collection.extend({
			model: ContextMenuItem,
			comparator: 'position'
		});
		
		//GROUP
		var ContextMenuGroup = Backbone.Model.extend({
			//model: this.ContextMenuItems
			defaults: {
				position: "Not specified",
				items: new ContextMenuItems()
			},
			initialize: function(attributes){
				this.set("items", new ContextMenuItems(attributes));
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
			
//			events : {
//				'click li' :  function(e) {console.log("kuake");}
//			},
//			taka: function(event){
//				console.log("takakakaka");
//			},
			
			initialize: function (options) {
				this.items = options.items;
			},
			render: function () {
				 
				this.$el.append(this.template(this.items.toJSON()));
				
//				this.$el.html(this.template());	   
				 
				registeredItems[this.items.get("cid")] = this.items.get("action");
				 
				if (this.items.has("groups")){
					var contextMenuViewItemsElement = this.$el.find("li");
					this.items.get("groups").each(function(group){
						var contextMenuViewGroupsTmp2 = new ContextMenuViewGroups({ model: group });
						contextMenuViewItemsElement.append(contextMenuViewGroupsTmp2.render().el.childNodes);
					});
				 }
				 
				 return this;
	        }
		});
		
		var ContextMenuViewGroups = Backbone.View.extend({
			initialize: function (options) {
				this.group = options.model;
			},
			render: function () {
				 this.$el.html("<ul></ul>");
				 
				 var contextMenuViewGroupsElement = this.$el.find("ul");
				 this.group.get("items").each(function(item){
					 var contextMenuViewItemsTmp = new ContextMenuViewItems({items: item });
					 contextMenuViewGroupsElement.append(contextMenuViewItemsTmp.render().el.childNodes);
			    });
				 				 
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
				//TODO: Check if this can be done through and event in the menu view items
				var itemId = $(event.target).data('id');
				var registeredItem = this.registeredItems[itemId];
				
				var entire = registeredItem.toString();
				var body = entire.slice(entire.indexOf("{") + 1, entire.lastIndexOf("}"));
				GEPPETTO.Console.executeCommand("var node = " + JSON.stringify(this.data));
//				GEPPETTO.Console.executeCommand("var node = " + JSON.stringify(this.data));
				GEPPETTO.Console.executeCommand(body);
			},
	        
	        render: function () {
	        	this.$el.html(this.template());	            
	            
	        	var contextMenuViewElement = this.$el;
	        	this.model.get("groups").each(
	    			function(model){
	    			      var contextMenuViewGroupsTmp = new ContextMenuViewGroups({ model: model });
	    			      contextMenuViewElement.append(contextMenuViewGroupsTmp.render().el.childNodes);
	    			    }
	        	);
	            
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
	            this.registeredItems = registeredItems;
	            this.data = options.data;
	
	            this.render();
	        }
		});
	};
});
