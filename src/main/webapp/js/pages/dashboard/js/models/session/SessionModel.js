define([ 'jquery', 'underscore', 'backbone' ], function($, _, Backbone) {
	var SessionModel = Backbone.Model.extend({
		defaults : {
			user : {
				name : "Guest",
				id : "Guest"
			}
		},
		url : "currentuser",

		initialize : function() {
			this.fetch({
				async : false
			});
		},

		parse : function(data) {
			if (!data.name) {
				this.set("user", $.extend({}, this.attributes.user,
						this.defaults));
			} else {
				this.set("user", $.extend({}, this.attributes.user, data));
			}
		},

		isAuthorized : function() {
			return Boolean(this.get("user").token);
		}

	});

	var _instance = new SessionModel();

	return {
		getInstance : function() {
			return _instance;
		}
	};
});