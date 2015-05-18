define([ 'jquery', 'underscore', 'backbone', 'models/project/ProjectModel',
		'text!templates/projects/projectDetailsTemplate.hbs',
		// dirty hack for handlebars loading wait
		'handlebars', 'libs/ginny/ginny' ], function($, _, Backbone,
		ProjectModel, projectDetailsTemplate) {

	var ProjectDetailsView = Backbone.View.extend({

		template : Handlebars.compile(projectDetailsTemplate),

		initialize : function(options) {
			var me = this;
			this.model = new ProjectModel({
				id : this.id
			});
			_.bindAll(this, 'render');
			
			this.model.fetch({
				success : function() {
		            var simulationUrl = me.model.attributes.geppettoModel.url;
		            var id =  me.model.attributes.id;
		            var url = window.location.href;
		            if (url.indexOf('/dashboard') > 0) {
		            	url = url.substring(0, url.indexOf('/dashboard'));
		            }
		            me.model.attributes.simUrl = url + '?load_project_from_id=' + id;
					me.render();
				}
			});
		},

		render : function() {
			this.$el.empty();
			this.$el.append(this.template(this.model.toJSON()));
			return this;
		}

	});

	return ProjectDetailsView;
});
