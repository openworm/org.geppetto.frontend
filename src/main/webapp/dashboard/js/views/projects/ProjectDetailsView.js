define([
    'jquery',
    'underscore',
    'backbone',
    'models/project/ProjectModel',
    'text!templates/projects/projectDetailsTemplate.hbs',
    //dirty hack for handlebars loading wait
    'handlebars',
    'libs/ginny/ginny'
], function ($, _, Backbone, ProjectModel, projectDetailsTemplate) {

    var ProjectDetailsView = Backbone.View.extend({

        template: Handlebars.compile(projectDetailsTemplate),

        initialize:function (options) {
            this.model = new ProjectModel({
                id: this.id
            });
             _.bindAll(this, 'render');
            this.model.fetch({success : this.render});
        },

        render : function() {
            this.$el.empty();
            this.$el.append(this.template(this.model.toJSON()));
            return this;
        }

    });

    return ProjectDetailsView;
});
