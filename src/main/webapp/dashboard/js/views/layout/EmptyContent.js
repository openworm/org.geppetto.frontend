define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/layout/emptyContentTemplate.html',
    //dirty hack for handlebars loading wait
    'handlebars'
], function($, _, Backbone,emptyContentTemplate){

    var EmptyContent = Backbone.View.extend({

        template : Handlebars.compile(emptyContentTemplate),

        initialize : function() {
//            nothing to do here
        },

        render: function(){
            //compile handlebars template
            this.$el.html(this.template());
            return this;
        }

    });

    return EmptyContent;

});