define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/projects/projectPreviewTemplate.hbs',
    //dirty hack for handlebars loading wait
    'handlebars',
    'libs/ginny/ginny'
], function ($, _, Backbone, projectPreviewTemplate) {

    var ProjectPreviewView = Backbone.View.extend({

        template: Handlebars.compile(projectPreviewTemplate),

        initialize:function (options) {
             _.bindAll(this, 'render');
        },

        render : function() {
            this.$el.append(this.template(this.model.toJSON()));
            return this;
        }

    });

    return ProjectPreviewView;
});
