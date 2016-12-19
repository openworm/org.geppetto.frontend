
// Require.js allows us to configure shortcut alias
// Their usage will become more apparent further along in the tutorial.
require.config({
    urlArgs: "bust=${timestamp}",

    paths: {
        jquery: 'libs/jquery/jquery-min',
        jqueryUI: 'libs/jquery/jqueryui/jquery-ui-1.8.21.min',
        jqueryUICore: 'libs/jquery/jqueryui/jquery.ui.core',
        jqueryUIWidget: 'libs/jquery/jqueryui/jquery.ui.widget',
        jqueryUIPosition: 'libs/jquery/jqueryui/jquery.ui.position',
        deparam : 'libs/jquery/deparam',
        underscore: 'libs/underscore/underscore-min',
        backbone: 'libs/backbone/backbone-min',
        validation: 'libs/backbone/validation-min',
        handlebars: 'libs/handlebars/handlebars',
        templates: '../templates',
        bootstrap : 'libs/twitter/bootstrap.min',
        text: 'libs/require/text',
        EmptyHeader : 'views/layout/EmptyHeader',
        PageLayoutView: 'views/layout/PageLayoutView',
        DashboardView : 'views/dashboard/DashboardView',
        UserProfileView : 'views/user/UserProfileView'
    },
    shim: {
        jquery : {
            exports : 'jQuery'
        },

        underscore : {
            exports : '_'
        },

        backbone : {
            deps: ['jquery','underscore'],
            exports : 'Backbone'
        },
        
        bootstrap : {
            deps: ['jquery']
        },

        validation : {
             deps: ['backbone']

        },

        handlebars: {
            exports: 'Handlebars'
        },
        jqueryUI : {
            deps: ['jquery']
        },
        jqueryUICore : {
            deps: ['jquery','jqueryUI']
        },
        jqueryUIPosition : {
            deps: ['jquery','jqueryUI']
        },
        jqueryUIWidget : {
            deps: ['jquery','jqueryUI']
        },
        jqueryUISelectMenu : {
            deps: ['jquery','jqueryUI', 'jqueryUICore', 'jqueryUIPosition','jqueryUIWidget']
        },
        deparam : {
            deps: ['jquery']
        }
    }

});

require([
    // Load our app module and pass it to our definition function
    'app',
    'underscore',
    'backbone',
    'validation',
    'bootstrap'

], function(App){
    // The "app" dependency is passed in as "App"
    // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function
    App.initialize();
    _.extend(Backbone.Model.prototype, Backbone.Validation.mixin);
});


//endswith function to string class
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
