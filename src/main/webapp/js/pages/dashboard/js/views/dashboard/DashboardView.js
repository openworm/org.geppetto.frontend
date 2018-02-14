define([ 'jquery', 'underscore', 'backbone',
		'text!templates/dashboard/dashboardTemplate.hbs',
		'collections/projects/ProjectsCollection',
		'views/projects/ProjectPreviewView',
		'views/projects/ProjectDetailsView', 'models/project/ProjectModel',
		// dirty hack for handlebars loading wait
		'handlebars', 'libs/ginny/ginny' ], function($, _, Backbone,
		dashboardTemplate, ProjectsCollection, ProjectPreviewView,
		ProjectDetailsView, ProjectModel) {

	var SomeBeansPageView = Backbone.View.extend({

		template : Handlebars.compile(dashboardTemplate),

		events : {
			'click .project-preview-tn' : 'showProject',
			'dblclick .project-preview-tn' : 'openProject',
			'doubletap .project-preview-tn' : 'openProject'
		},

		initialize : function(options) {
			this.collection = new ProjectsCollection();
			this.on('render', this.afterRender);
			// fixes loss of context for 'this' within methods
			_.bindAll(this, 'render', 'remove', 'renderProjects',
					'appendProjects', 'onError', 'filter', 'showProject',
					'openProject');
			this.subviews = [];

            // Change link from blank to self for embedded environments
            if(EMBEDDED && EMBEDDERURL !== "/") {
            	handleRequest = function(e) {
            	  if(EMBEDDERURL.indexOf(e.origin) != -1) {
            		  // This is where we have to create the API
            		  eval(e.data.command);
            	  };
            	};
            	// we have to listen for 'message'
            	window.addEventListener('message', handleRequest, false);
                if($.isArray(EMBEDDERURL)){
            		window.parent.postMessage({"command": "ready"}, EMBEDDERURL[0]);
                }
                else{
                	window.parent.postMessage({"command": "ready"}, EMBEDDERURL);
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
				success : this.renderProjects,
				error : this.onError
			});

			// notifies we have rendered to trigger after-render
			this.trigger('render');

			return this;
		},

		afterRender: function () {
			// add click handlers for keeping track of expanded experiments
			$( "#project-details" ).on("click", "a[data-parent='#accordion']", function() {
				var expID = $(this).attr( "aria-controls" );
				var expanded = $("#" + expID).attr( "aria-expanded" );

				// add to global list if not expanded (means the click is meant to expand)
				// also add if attribute is undefined or bool false (first time it's not there yet)
				// NOTE: if the attr is not there it can be undefined or bool false depending on browser
				if(expanded === "false" || typeof expanded === typeof undefined || expanded === false){
					window.openExperiments.push(expID);
				}
				else {
					// remove from list
					var index = window.openExperiments.indexOf(expID);
					if (index !== -1) {
						window.openExperiments.splice(index, 1);
					}
				}

				// return true to cascade to next default bootstrap handler
				return true;
			});
		},

		renderProjects : function(collection) {
			// $("#spinner").hide();
			this.$el.find(".project-preview").remove();
			collection.each(this.appendProjects);
			this.delegateEvents();
			return this;
		},

		appendProjects : function(item) {
			var itemView = new ProjectPreviewView({
				model : item,
				el : this.$el.find("#projects")
			});
			itemView.render();
			this.subviews.push(itemView);
		},

		onError : function(collection, response, options) {
			console.log("Error");
		},

		filter : function(event) {
			var criteria = $(event.target).val().toLowerCase();
			this.renderProjects(this.collection.search(criteria));
		},

		showProject : function(event) {
			window.firstTime=true;
			$(".selected").removeClass("selected");
			$(".orange").removeClass("orange");
			$(".geppettoSymbolSel").attr('class','geppettoSymbol');
			var target = $(event.target);
			if (target.attr('class') == "geppettoSymbol") {
				//they clicked on the logo
				target.attr('class','geppettoSymbolSel');
				target = target.parent();
			}
			else
			{
				//they clicked on the outer square
				target.children().attr('class','geppettoSymbolSel');
			}
			target.addClass("selected");
			$(target.parent().parent().children()[1]).addClass("orange");
			var id = $(event.target).attr("project-id");
			if (id === undefined) {
				id = $(event.target).parents(".project-preview").attr("project-id");
			}

			// clear global variable with list of open experiments
			window.openExperiments = [];

			// clear interval from showing previous project
			if(this.projectRefreshInterval != undefined){
				clearInterval(this.projectRefreshInterval);
			}

			var projectDetailsView = new ProjectDetailsView({
				id : id,
				el : this.$el.find("#project-details")
			});
			projectDetailsView.render();

			// update project every 5 secs and store a reference to timer
			this.projectRefreshInterval = setInterval(projectDetailsView.refreshModel, 5000);
		},

		openProject : function(event) {
			$(".selected").removeClass("selected");
			$(event.target).addClass("selected");
			var id = $(event.target).attr("project-id");
			if (id === undefined) {
				id = $(event.target).parents(".project-preview").attr("project-id");
			}
			var url = window.location.href;
			if (url.indexOf('/dashboard') > 0) {
				url = url.substring(0, url.indexOf('/dashboard'));
			}

			var targetWindow = '_blank';
            if(EMBEDDED) {
            	targetWindow = '_self';
            }
            window.open(url + 'geppetto?load_project_from_id=' + id, targetWindow);
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

	return SomeBeansPageView;
});
