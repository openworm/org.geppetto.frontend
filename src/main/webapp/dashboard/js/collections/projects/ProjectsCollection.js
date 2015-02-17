define([
    'jquery',
    'underscore',
    'backbone',
    'models/project/ProjectModel'
], function ($, _, Backbone, ProjectModel) {

    var ProjectsCollection = Backbone.Collection.extend({
        model: ProjectModel,
        url: "api/project/all.json",

        initialize: function (options) {
            _.bindAll(this,'search');
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