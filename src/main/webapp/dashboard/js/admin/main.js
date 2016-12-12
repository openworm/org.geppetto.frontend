
// Require.js allows us to configure shortcut alias
// Their usage will become more apparent further along in the tutorial.
require.config({
    urlArgs: "bust=${timestamp}",

    paths: {
        jquery: '../../js/libs/jquery/jquery-min',
        jqueryUI: '../../js/libs/jquery/jqueryui/jquery-ui-1.8.21.min',
        jqueryUICore: '../../js/libs/jquery/jqueryui/jquery.ui.core',
        jqueryUIWidget: '../../js/libs/jquery/jqueryui/jquery.ui.widget',
        jqueryUIPosition: '../../js/libs/jquery/jqueryui/jquery.ui.position',
        react: '../../js/libs/react/react',
        griddle: '../../js/libs/griddle/griddle',
        deparam : '../../js/libs/jquery/deparam',
        underscore: '../../js/libs/underscore/underscore-min',
        backbone: '../../js/libs/backbone/backbone-min',
        validation: '../../js/libs/backbone/validation-min',
        handlebars: '../../js/libs/handlebars/handlebars',
        templates: '../../templates',
        bootstrap : '../../js/libs/twitter/bootstrap.min',
        text: '../../js/libs/require/text',
        PageLayoutView: '../../js/views/admin/layout/PageLayoutView',
        AdminPanelView : '../../js/views/admin/AdminPanelView',
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
        },
        griddle : {
            deps: ['react']
        },
    }

});

require([
    // Load our app module and pass it to our definition function
    'app',
    'underscore',
    'backbone',
    'validation',
    'bootstrap',
    'griddle'

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
