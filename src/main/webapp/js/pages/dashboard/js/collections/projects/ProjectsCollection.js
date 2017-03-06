define([
    'jquery',
    'underscore',
    'backbone',
    'models/project/ProjectModel',
    'models/session/SessionModel'
], function ($, _, Backbone, ProjectModel, SessionModel) {
	var login = 'guest';
	if (SessionModel.getInstance().get('user')) {
		login = SessionModel.getInstance().get('user').login;
	}
    var ProjectsCollection = Backbone.Collection.extend({
        model: ProjectModel,
        url: "user/" + login + "/geppettoprojects",
        
        initialize: function (options) {
            _.bindAll(this,'search', 'parse', "getLimitedString");
        },

        parse: function(data){
            var that = this;
            _.each(data, function(item){
                item.displayName = item.name;
            });
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

    return ProjectsCollection;
});