var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var geppettoConfig;
try {
    geppettoConfig = require('./GeppettoConfiguration.json');
    console.log('\nLoaded Geppetto config from file');
} catch (e) {
    // Failed to load config file
    console.error('\nFailed to load Geppetto Configuration')
}

//We read the command line arguments, these are passed from maven through npm to webpack
console.log('\nReading Geppetto Parameters from Command line:');
for (var i = 0; i < process.argv.length; i++) {
    var argValue = process.argv[i].replace("--", "").split("=");
    if (argValue[0] in geppettoConfig && argValue[1]!="") {
        var value = argValue[1];
        console.log('Set ' + argValue[0] + ' to ' +  value);
        geppettoConfig[argValue[0]] = (value == "true" || value =="false")?JSON.parse(value):value;
    }
}

console.log("\nGeppetto Config:");
console.log(JSON.stringify(geppettoConfig, null, 2), '\n');

var publicPath = ((geppettoConfig.contextPath == '/') ? geppettoConfig.contextPath : "/" + geppettoConfig.contextPath + "/") + "geppetto/build/";
console.log("\nThe public path (used by the main bundle when including split bundles) is: " + publicPath);


var entries = {
    main: "./js/pages/geppetto/main.js",
    admin: "./js/pages/admin/admin.js"
};
if (!geppettoConfig.noTest) {
    entries['tests'] = "./js/pages/tests/qunit/QUnitTests.js";
}

console.log("\nThe Webpack entries are:");
console.log(entries);

// Get available extensions in order to copy static pages
var availableExtensions = [];
for (var extension in geppettoConfig.extensions) {
    if (geppettoConfig.extensions[extension]) {
        availableExtensions.push({ from: 'extensions/' + extension.split("/")[0] + "/static/*", to: 'static', flatten: true });
    }
}
console.log("\nStatic pages coming from extensions are:");
console.log(availableExtensions);

// Get available theme
var availableTheme = "";
for (var theme in geppettoConfig.themes) {
    if (geppettoConfig.themes[theme]) {
        availableTheme = theme;
    }
}
console.log("\nEnable theme:");
console.log(availableTheme);

var isProduction = process.argv.indexOf('-p') >= 0;
console.log("\n Building for a " + ((isProduction) ? "production" : "development") + " environment")

module.exports = {

    entry: entries,
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].bundle.js',
        publicPath: publicPath
    },
    plugins: [
    	new webpack.optimize.CommonsChunkPlugin({
    		name: ['common'] // Specify the common bundle's name.
    	}),
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
        extensions: ['*', '.js', '.json'],
    },

    module: {
        noParse: [/js\/components\/interface\/dicomViewer\/ami.min.js/],
        rules: [
            {
                test: /\.(js)$/, exclude: [/node_modules/, /build/, /\.bundle/, /ami.min.js/], 
                loader: 'babel-loader',
                query: {
                    presets: ['react', ['babel-preset-env', { "modules": false }]]
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
                test: /\.(py|jpeg|svg|gif|css|jpg|md|hbs|dcm|gz|xmi|dzi|sh|obj|yml|nii)$/,
                loader: 'ignore-loader'
            },
            {
                test: /\.(png|eot|ttf|woff|woff2|svg)(\?[a-z0-9=.]+)?$/,
                loader: 'url-loader?limit=100000'
            },
            {
                
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                  fallback: "style-loader",
                  use: "css-loader"
                })
                  
            },
            {
                test: /\.less$/,
                loader: 'style-loader!css-loader!less-loader?{"modifyVars":{"url":"\'../../../extensions/' + availableTheme + '\'"}}'
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
