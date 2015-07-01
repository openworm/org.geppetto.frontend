define([ 'jquery', 'underscore', 'backbone', 'models/project/ProjectModel',
		'text!templates/projects/projectDetailsTemplate.hbs',
		// dirty hack for handlebars loading wait
		'handlebars', 'libs/ginny/ginny' ], function($, _, Backbone,
		ProjectModel, projectDetailsTemplate) {

	var ProjectDetailsView = Backbone.View.extend({

		template : Handlebars.compile(projectDetailsTemplate),

		initialize : function(options) {

			this.model = new ProjectModel({
				id : this.id
			});
			_.bindAll(this, 'render', 'fetchSuccess', 'refreshModel');
			
			this.model.fetch({ success : this.fetchSuccess });
		},

		render : function() {
			this.$el.empty();
			this.$el.append(this.template(this.model.toJSON()));
			return this;
		},
		
		refreshModel : function() {
			this.model.fetch({ success : this.fetchSuccess });
		},
		
		fetchSuccess : function() {
            var simulationUrl = this.model.attributes.geppettoModel.url;
            var id =  this.model.attributes.id;
            var url = window.location.href;
            if (url.indexOf('/dashboard') > 0) {
            	url = url.substring(0, url.indexOf('/dashboard'));
            }
            this.model.attributes.simUrl = url + '?load_project_from_id=' + id;
            this.render();
            
            // check if and which experiment was expanded and restore
            var openExps = window.openExperiments;
            for(var i=0; i<openExps.length; i++){
            	// add class in
            	$("#" + openExps[i]).addClass("in");
            	// set aria-expanded attr to true
            	$("#" + openExps[i]).attr("aria-expanded", "true");
            }
		}
	});

	return ProjectDetailsView;
});
