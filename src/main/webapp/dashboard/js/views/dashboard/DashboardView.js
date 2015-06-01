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
			'dblclick .project-preview-tn' : 'openProject'
		},

		initialize : function(options) {
			this.collection = new ProjectsCollection();
			_.bindAll(this, 'render', 'remove', 'renderProjects',
					'appendProjects', 'onError', 'filter', 'showProject',
					'openProject'); // fixes
			// loss
			// of
			// context
			// for
			// 'this'
			// within
			// methods
			this.subviews = [];

		},

		render : function() {
			this.$el.html(this.template({
				title : this.titleFilter
			}));
			$('#filter').keyup(this.filter);
			this.collection.fetch({
				async: false,
				success : this.renderProjects,
				error : this.onError
			});
			return this;
		},

		renderProjects : function(collection) {
			// $("#spinner").hide();
			this.$el.find("#projects").empty();
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
			$(".selected").removeClass("selected");
			$(event.target).addClass("selected");
			var id = $(event.target).attr("project-id");
			if (id === undefined) {
				id = $(event.target).parents(".project-preview").attr(
						"project-id");
			}
			var projectDetailsView = new ProjectDetailsView({
				id : id,
				el : this.$el.find("#project-details")
			});
			projectDetailsView.render();
		},

		openProject : function(event) {
			$(".selected").removeClass("selected");
			$(event.target).addClass("selected");
			var id = $(event.target).attr("project-id");
			if (id === undefined) {
				id = $(event.target).parents(".project-preview").attr(
						"project-id");
			}
			var url = window.location.href;
			if (url.indexOf('/dashboard') > 0) {
				url = url.substring(0, url.indexOf('/dashboard'));
			}
			window.open(url + '?load_project_from_id=' + id);
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
