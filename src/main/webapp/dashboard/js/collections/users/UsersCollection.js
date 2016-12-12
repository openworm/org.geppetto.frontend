define([
    'jquery',
    'underscore',
    'backbone',
    '../../models/session/SessionModel'
], function ($, _, Backbone,SessionModel) {
	var login = 'guest';
	if (SessionModel.getInstance().get('user')) {
		login = SessionModel.getInstance().get('user').login;
	}
    var UsersCollection = Backbone.Collection.extend({
        url: "user/" + login.replace(/\s/g, '') + "/users",
        
        initialize: function (options) {
            _.bindAll(this,'search', 'parse', "getLimitedString");
        },

        parse: function(data){
            return data;
        },

        getLimitedString: function(originString, limit){
            if (originString == null){
                return "";
            }
            if (originString.length > limit){
                return originString.slice(0,limit - 3) + "...";
            } else {
                return originString;
            }
        },

        search: function (criteria) {
            if (criteria == "") return this;
            return _(this.filter(function (data) {
                if (data.get("name").toLowerCase().indexOf(criteria) !== -1){
                    return true;
                } else {
                    return false;
                }
            }));
        }
    });

    return UsersCollection;
});