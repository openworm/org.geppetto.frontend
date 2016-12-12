define([ 'jquery', 'underscore', 'backbone','text!templates/admin/adminPanelTemplate.hbs',
         '../collections/users/UsersCollection','../views/admin/UsersDetailsView',
 		'../views/admin/SimulationsDetailsView','../views/admin/ErrorsDetailsView', 'handlebars'], 
		function($, _, Backbone,adminPanelTemplate, UsersCollection, UsersDetailsView,
		SimulationsDetailsView,ErrorsDetailsView) {

	var AdminPanelView = Backbone.View.extend({

		template : Handlebars.compile(adminPanelTemplate),

		events : {
			'click #users-view' : 'showUsersView',
			'click #simulations-view' : 'showSimulationsView',
			'click #errors-view' : 'showErrorsView',
		},

		initialize : function(options) {
			this.collection = new UsersCollection();
			this.on('render', this.afterRender);
			// fixes loss of context for 'this' within methods
			_.bindAll(this, 'render', 'remove','onError','showUserView'); 
			this.subviews = [];
			
            // Change link from blank to self for embedded environments
            if(window.EMBEDDED && window.EMBEDDEDURL !== "/") {
            	handleRequest = function(e) {
            	  if(window.EMBEDDEDURL.indexOf(e.origin) != -1) {
            		  // This is where we have to create the API
            		  eval(e.data.command);
            	  };
            	};
            	// we have to listen for 'message'
            	window.addEventListener('message', handleRequest, false);
                if($.isArray(window.EMBEDDEDURL)){
            		window.parent.postMessage({"command": "ready"}, window.EMBEDDEDURL[0]);	
                }
                else{
                	window.parent.postMessage({"command": "ready"}, window.EMBEDDEDURL);
                }
            }
		},

		render : function() {
			this.$el.html(this.template({
				title : this.titleFilter
			}));
			$('#filter').keyup(this.filter);
			
			this.collection.fetch({
				async : false,
				success : this.showUserView,
				error : this.onError
			});
			
			return this;
		},
		
		onError : function(collection, response, options) {
			console.log("Error");
		},

		showUserView : function(collection) {
			// $("#spinner").hide();
			this.$el.find(".users-view").remove();
			var usersView = new UsersDetailsView({
				model : collection,
				el : this.$el.find("#currentView")
			});
			usersView.render();
			this.subviews.push(usersView);
			this.delegateEvents();
		},
		
		loadUsers : function(collection){
			this.collection = collection;
		},

		remove : function(attributes) {
			if (!_.isEmpty(this.pagerView)) {
				this.pagerView.remove();
			}
			if (!_.isEmpty(this.subviews)) {
				for (var i = 0; i < this.subviews.length; i++) {
					this.subviews[i].remove();
				}
			}
			this.$el.remove();
			Backbone.View.prototype.remove.call(this, attributes);
		}

	});

	return AdminPanelView;
});
