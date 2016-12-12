define([ 'jquery', 'underscore', 'backbone', '../../models/session/SessionModel',
		'text!templates/admin/usersDetailsTemplate.hbs',
		// dirty hack for handlebars loading wait
		'handlebars' ], function($, _, Backbone,SessionModel, usersDetailsTemplate) {

	var UsersDetailsView = Backbone.View.extend({
		
		template : Handlebars.compile(usersDetailsTemplate),

		initialize : function(options) {

			var login = 'guest';
			if (SessionModel.getInstance().get('user')) {
				login = SessionModel.getInstance().get('user').login;
			}
			
			_.bindAll(this, 'render', 'refreshModel');
			
			$(document).on('click','#status',function(){
				var details = $(this).data('id');
				
				if(details!="" || null){
				   $("#errormodal").modal();
				   $("#errormodal-text").html(details.exception);
				}
			});
		},

		render : function() {
			var data =  {'data' :{
			                   "id": 0,
			                   "name": "Mayer Leonard",
			                   "city": "Kapowsin",
			                   "state": "Hawaii",
			                   "country": "United Kingdom",
			                   "company": "Ovolo",
			                   "favoriteNumber": 7
			                 }};
			this.$el.empty();
			this.$el.append(this.template(data));
			return this;
		},
		
		refreshModel : function() {
			 this.render();
		}
	});

	return UsersDetailsView;
});
