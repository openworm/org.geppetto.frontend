define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/layout/footerTemplate.html'  ,
    //dirty hack for handlebars loading wait
    'handlebars'
], function($, _, Backbone,footerTemplate){

    var EmptyFooter = Backbone.View.extend({

        template : Handlebars.compile(footerTemplate),

        initialize : function() {
//            nothing to do here
        },

        render: function(){
            //compile handlebars template
            this.$el.html(this.template());
            return this;
        }

    });

    return EmptyFooter;

});