var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var geppettoConfig;
try {
    geppettoConfig = require('./GeppettoConfiguration.json');
    // geppettoConfig.contextPath = JSON.stringify(geppettoConfig.contextPath)
    console.log('\nLoaded Geppetto config:');
} catch (e) {
    // Failed to load config file
    console.error('\nFailed to load Geppetto Configuration')
}

//We read the command line arguments, these are passed from maven through npm to webpack
for (var i = 0; i < process.argv.length; i++) {
    var arg = process.argv[i].replace("--", "");
    if (arg in geppettoConfig) {
        var value = arg.substring(arg.indexOf("=") + 1).trim();
        geppettoConfig[arg] = value;
    }
}

console.log("\nGeppetto Config:\n");
console.log(JSON.stringify(geppettoConfig, null, 2), '\n');

var publicPath = ((geppettoConfig.contextPath == '/') ? geppettoConfig.contextPath : "/" + geppettoConfig.contextPath + "/") + "geppetto/build/";
console.log("\nThe public path (used by the main bundle when including split bundles) is: " + publicPath + "\n");


var entries = {
    main: "./js/pages/geppetto/main.js",
    admin: "./js/pages/admin/admin.js",

};
if (!geppettoConfig.noTest) {
    entries['tests'] = "./js/pages/tests/qunit/QUnitTests.js";
}

console.log("The Webpack entries are:\n");
console.log(entries);

// Get available extensions in order to copy static pages
var availableExtensions = [];
for (var extension in geppettoConfig.extensions) {
    if (geppettoConfig.extensions[extension]) {
        availableExtensions.push({ from: 'extensions/' + extension.split("/")[0] + "/static/*", to: 'static', flatten: true });
    }
}
console.log("Static pages coming from extensions are:\n");
console.log(availableExtensions);

// Get available theme
var availableTheme = "";
for (var theme in geppettoConfig.themes) {
    if (geppettoConfig.themes[theme]) {
        availableTheme = theme;
    }
}
console.log("Enable theme:\n");
console.log(availableTheme);

var isProduction = process.argv.indexOf('-p') >= 0;
console.log("\n Building for a " + ((isProduction) ? "production" : "development") + " environment")

module.exports = {

    entry: entries,
    output: {
        path: './build/',
        filename: '[name].bundle.js',
        publicPath: publicPath
    },
    plugins: [
        new CopyWebpackPlugin(availableExtensions),
        new HtmlWebpackPlugin({
            filename: 'geppetto.vm',
            template: './js/pages/geppetto/geppetto.ejs',
            GEPPETTO_CONFIGURATION: geppettoConfig,
            //chunks: ['main'] Not specifying the chunk since its not possible yet (need to go to Webpack2) to specify UTF-8 as charset without which we have errors
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: 'admin.vm',
            template: './js/pages/admin/admin.ejs',
            //chunks: ['admin'] Not specifying the chunk since its not possible yet (need to go to Webpack2) to specify UTF-8 as charset without which we have errors
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: 'dashboard.vm',
            template: './js/pages/dashboard/dashboard.ejs',
            GEPPETTO_CONFIGURATION: geppettoConfig,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: 'tests.vm',
            template: './js/pages/tests/tests.ejs',
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: 'qunitTest.vm',
            template: './js/pages/tests/qunitTest.ejs',
            //chunks: ['tests'] Not specifying the chunk since its not possible yet (need to go to Webpack2) to specify UTF-8 as charset without which we have errors
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: '../WEB-INF/web.xml',
            template: './WEB-INF/web.ejs',
            GEPPETTO_CONFIGURATION: geppettoConfig,
            chunks: []
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
            },
        }),
        new ExtractTextPlugin("[name].css"),
    ],

    resolve: {
        alias: {
            geppetto: path.resolve(__dirname, 'js/pages/geppetto/GEPPETTO.js'),
            handlebars: 'handlebars/dist/handlebars.js'

        },
        extensions: ['', '.js', '.json'],
    },

    module: {
        noParse: [/node_modules\/plotly.js\/dist\/plotly.js/, /js\/components\/interface\/dicomViewer\/ami.min.js/],
        loaders: [
            {
                test: /\.(js)$/, exclude: [/node_modules/, /build/, /\.bundle/, /ami.min.js/], loader: ['babel-loader'],

                query: {
                    presets: ['react', 'es2015']
                }
            },
            {
                test: /\.json$/,
                loader: "json-loader"
            },
            {
                test: /Dockerfile/,
                loader: 'ignore-loader'
            },
            {
                test: /\.(py|jpeg|svg|gif|css|jpg|md|hbs|dcm|gz|xmi|dzi|sh|obj)$/,
                loader: 'ignore-loader'
            },
            {
                test: /\.(png)$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader")
            },
            {
                test: /\.less$/,
                loader: 'style!css!less?{"modifyVars":{"url":"\'../../../extensions/' + availableTheme + '\'"}}'
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: 'file?name=/fonts/[name].[ext]'
            },
            {
                test: /\.html$/,
                loader: 'raw-loader'
            }
        ]
    },
    node: {
        fs: 'empty',
        child_process: 'empty',
        module: 'empty'
    }
};
