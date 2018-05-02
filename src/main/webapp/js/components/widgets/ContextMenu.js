define(function (require) {
    return function (GEPPETTO) {

        var registeredItems = {};

        var _ = require('underscore');
        var templates = require('./contextMenuTemplate.js');
        
        /*
         * MODELS AND COLLECTIONS
         */

        //ITEM
        var ContextMenuItem = Backbone.Model.extend({
            defaults: {
                position: "Not specified",
                label: "Not specified",
                action: "Not specified",
                icon: null,
                option: "Not specified",
            },
            initialize: function (attributes) {
                if (typeof attributes.groups != 'undefined') {
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
            initialize: function (attributes) {
                this.set("items", new ContextMenuItems(attributes));
            }

        });

        var ContextMenuGroups = Backbone.Collection.extend({
            model: ContextMenuGroup
        });

        //MENU
        var ContextMenuModel = Backbone.Model.extend({
            model: ContextMenuGroups,
            initialize: function (attributes) {
                this.set("groups", new ContextMenuGroups(attributes.groups));
            }
        });

        /*
         * VIEWS
         */
        var ContextMenuViewItems = Backbone.View.extend({
            template: _.template(templates.tplContextMenuItems),

            events: {
                'click': 'testing'
            },

            testing: function (event) {

            },

            initialize: function (options) {
                this.items = options.items;
            },
            render: function () {

                this.$el.append(this.template(this.items.toJSON()));

                registeredItems[this.$el.find("li").attr("id")] = {
                    action: this.items.get("action"),
                    label: this.items.get("label"),
                    option: this.items.get("option"),
                    icon : this.items.get("icon")
                };

                if (this.items.has("groups")) {
                    var contextMenuViewItemsElement = this.$el.find("li");
                    this.items.get("groups").each(function (group) {
                        var contextMenuViewGroupsTmp2 = new ContextMenuViewGroups({model: group});
                        contextMenuViewItemsElement.append(contextMenuViewGroupsTmp2.render().el.childNodes);
                    });
                }
                else {
                    this.$el.find("li").addClass("contextMenuLink");
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
                this.group.get("items").each(function (item) {
                    var contextMenuViewItemsTmp = new ContextMenuViewItems({items: item});
                    contextMenuViewGroupsElement.append(contextMenuViewItemsTmp.render().el.childNodes);
                });

                return this;
            }
        });

        /**
         * @module Widgets/ContextMenu
         */
        GEPPETTO.ContextMenuView = Backbone.View.extend({
            className: 'contextMenuView',
            template: _.template(templates.tplContextMenu),
            closeOnClick : true,
            parentSelector: 'body',

            /**
             * Events that can be registered with the widget
             */
            events: {
                'click .contextMenuLink': 'manageMenuClickEvent'
            },

            /**
             * Register right click event with this widget
             *
             * @param {GEPPETTO.ContextMenuView.events} event - Registe event with this widget
             */
            manageMenuClickEvent: function (event) {
                //TODO: Check if this can be done through and event in the menu view items
                var itemId = $(event.target).attr('id');
                var registeredItem = this.getClickedItem(itemId);

                //TODO: We are not using the option parameter (registeredItem["option"])
                for (var i=0;i<registeredItem["action"].length;i++) {
                	if(registeredItem["action"][i] != null || undefined){
                        GEPPETTO.CommandController.execute(registeredItem["action"][i], true);
                	}
                }
            },

            getClickedItem : function(itemId){
            	return this.registeredItems[itemId];
            },
            /**
             * Renders the Context Menu widget
             */
            render: function () {
                this.$el.html(this.template());

                var contextMenuViewElement = this.$el;
                this.model.get("groups").each(
                    function (model) {
                        var contextMenuViewGroupsTmp = new ContextMenuViewGroups({model: model});
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
                
                if(this.height != null || undefined){
                	this.$el.height(this.height);
                }
                
                if(this.width != null || undefined){
                	this.$el.width(this.width);
                }

                return this;
            },

            /**
             * Initializes the ContextMenu given a set of options
             */
            initialize: function () {
                this, registeredItems = {};

                this.$el.appendTo(this.parentSelector);

                var self = this;
                //  Hide the context menu whenever any click occurs not just when selecting an item.
                $(this.parentSelector).on('click', function () {
                	if(self.closeOnClick){
                		self.$el.hide();
                	}
                });
            },

            hide : function(){
            	this.$el.hide();
            },
            
            applyCSS : function(className){
            	if(className!=null || undefined){
            		this.$el.addClass(className);
            	}
            },
            
            /**
             * Shows the context menu
             *
             * @param {Object} options - Options used to customize the context menu widget
             */
            show: function (options) {
                if (options.top === undefined || options.left === undefined) throw "ContextMenu must be shown with top/left coordinates.";
                if (options.groups === undefined) throw "ContextMenu needs ContextMenuGroups to be shown.";

                if(options.closeOnClick !=null || undefined){
                	this.closeOnClick = options.closeOnClick;
                }
                
                this.top = options.top;
                this.left = options.left;
                
                if(options.height != null || undefined){
                	this.height = options.height;
                }
                if(options.width != null || undefined){
                	this.width = options.width;
                }
                
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
