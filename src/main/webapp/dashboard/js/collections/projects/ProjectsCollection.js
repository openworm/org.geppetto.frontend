define([
    'jquery',
    'underscore',
    'backbone',
    'models/project/ProjectModel'
], function ($, _, Backbone, ProjectModel) {

    var ProjectsCollection = Backbone.Collection.extend({
        model: ProjectModel,
//        url: "user/guest/geppettoprojects",
        url: "geppettoprojects",
//        url: "api/project/all.json",
        
        
//        sync: function(method, model, options) {
//        	options.dataType = "jsonp";
//        	options.jsonp = "jsonpCallback";
//        	return Backbone.sync(method, model, options);
//        },
        
        initialize: function (options) {
            _.bindAll(this,'search', 'parse', "getLimitedString");
        },

        parse: function(data){
            var that = this;
            _.each(data, function(item){
                item.displayName = that.getLimitedString(item.name, 20);
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