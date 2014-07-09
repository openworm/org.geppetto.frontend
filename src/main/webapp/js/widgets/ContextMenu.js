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
			
			initialize: function (options) {
				this.items = options.items;
			},
			
//			events : {
//			'click' : 'manageMenuClickEvent'
//		},
//		
//		manageMenuClickEvent: function(event){
//			console.log(this); 
//			console.log(event);
//			console.log($(event.target));
//			
//			var action = $(event.target).data('action');
//			
////			var registedItem = this.registeredItems[itemId];
//			console.log('click');
////			registedItem['action'](this.data);
//			
//			//Create the function
//			var fn = window[action];
//			//Call the function
//			fn(this.data);
//		},
			
			 render: function () {
				 
				 this.$el.append(this.template(this.items.toJSON()));
				 
				 registeredItems[this.items.get("cid")] = this.items.get("action");
				 
				 if (this.items.has("groups") ){
					 var elementBb2 = this.$el.find("li");
					 this.items.get("groups").each(function(group){
						 var view2 = new ContextMenuViewGroups({ model: group });
						 elementBb2.append( view2.render().el.childNodes );
						 
					 }	 
					 );
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
				 
				 var elementTmp = this.$el.find("ul");
				 this.group.get("items").each(function(item){
					 var viewTaka = new ContextMenuViewItems({items: item });
					 elementTmp.append(viewTaka.render().el.childNodes);
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
				console.log(this); 
				console.log(event);
				console.log($(event.target));
				
				var itemId = $(event.target).data('id');
				
				var registeredItem = this.registeredItems[itemId];
				registeredItem(this.data);
			},
	        
	        render: function () {
	        	this.$el.html(this.template());	            

	            
	        	var elementBb = this.$el;
	        	
	        	this.model.get("groups").each(
	    			function( model ){
	    			      var view = new ContextMenuViewGroups({ model: model });
	    			      elementBb.append( view.render().el.childNodes );
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
	            this.registeredItems = registeredItems;
	            this.data = options.data;
	
	            this.render();
	        }
		});
	};
});
