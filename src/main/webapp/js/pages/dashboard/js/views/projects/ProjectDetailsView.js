define([ 'jquery', 'underscore', 'backbone', 
        'models/project/ProjectModel', 'models/session/SessionModel',
		'text!templates/projects/projectDetailsTemplate.hbs',
		// dirty hack for handlebars loading wait
		'handlebars', 'libs/ginny/ginny' ], function($, _, Backbone,
		ProjectModel, SessionModel, projectDetailsTemplate) {

	var ProjectDetailsView = Backbone.View.extend({
		
		template : Handlebars.compile(projectDetailsTemplate),

		initialize : function(options) {

			this.model = new ProjectModel({
				id : this.id
			});
			_.bindAll(this, 'render', 'fetchSuccess', 'refreshModel');
			this.model.fetch({ success : this.fetchSuccess });
			
			$(document).on('click','#status',function(){
				var details = $(this).data('id');
				
				if(details!="" || null){
				   $("#errormodal").modal();
				   $("#errormodal-text").html(details.exception);
				}
			});
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
            this.model.attributes.simUrl = url + 'geppetto?load_project_from_id=' + id;
            this.render();
            if(window.firstTime==true)
            {
				$(".panel-collapse").first().addClass("in");
				$(".panel-collapse").first().attr("aria-expanded", "true");
				window.openExperiments.push($(".panel-collapse").attr( "id" ));
				window.firstTime=false;
            }
			
            // check if and which experiment was expanded and restore
            var openExps = window.openExperiments;
            for(var i=0; i<openExps.length; i++){
            	// add class in
            	$("#" + openExps[i]).addClass("in");
            	// set aria-expanded attr to true
            	$("#" + openExps[i]).attr("aria-expanded", "true");
            }
            
            // Change link from blank to self for embedded environments
            if(EMBEDDED) {
				$(".embeddedLinks").attr('target','_self');
			}
            
            // check user access rights
            this.checkAccessRights();
		},
		
		checkAccessRights : function() {
            // Retrieve user details
    		var userRef = SessionModel.getInstance().get('user');
    		var privileges = undefined;
    		if(userRef != undefined) {
    			privileges = userRef.userGroup.privileges;
    		}
    		
    		// Check if the user has WRITE and hide / show stuff accordingly
    		if(privileges.indexOf("WRITE_PROJECT", privileges) == -1){
    			// hide delete project button
    			$('.delete-project').hide();
			}
    		
    		// Check if the user has DOWNLOAD access and hide / show stuff accordingly
    		if(privileges.indexOf("DOWNLOAD", privileges) == -1){
    			// hide download results buttons for experiments
    			$('.download-results').hide();
			}
		},
	});

	return ProjectDetailsView;
});
