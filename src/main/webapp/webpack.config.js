var packageJSON = require('./package.json');
var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

console.log("\nThe arguments passed to webpack are:\n");
console.log(process.argv);

var getCLIParameter=function(param){
	for(var i=0;i<process.argv.length;i++){
		var arg=process.argv[i];
		if(arg.startsWith(param)){
			var value=arg.substring(arg.indexOf("=")+1).trim();
			console.log(param +":" + value);
			return value;
		}
	}
	return "";
}

console.log("\nThe arguments passed to HtmlWebpackPlugin are:\n");

//We read the command line arguments, these are passed from maven through npm to webpack
var generateTestsBundle = process.argv.indexOf('--noTest') == -1;
var contextPath = getCLIParameter("--contextPath");
var useSsl = getCLIParameter("--useSsl");
var embedded = getCLIParameter("--embedded");
var embedderURL = getCLIParameter("--embedderURL");


var publicPath = ((contextPath == '/') ? contextPath : "/"+ contextPath +"/") + "geppetto/build/" ;
console.log("\nThe public path (used by the main bundle when including split bundles) is: "+publicPath+"\n");


var entries = {
    main: "./js/main.js",
    admin: "./js/admin.js",

};
if (generateTestsBundle) {
    entries['tests'] = "./js/tests/qunit/QUnitTests.js";
}

console.log("The Webpack entries are:\n");
console.log(entries);

module.exports = {

    entry: entries,
    output: {
        path: './build/',
        filename: '[name].bundle.js',
        publicPath: publicPath
    },

    plugins: [
        new HtmlWebpackPlugin({
            filename: 'geppetto.vm',
            template: 'templates/geppetto.ejs',
            contextPath: contextPath,
            embedded: embedded,
            useSsl: useSsl,
            embedderURL: embedderURL,
            //chunks: ['main'] Not specifying the chunk since its not possible yet (need to go to Webpack2) to specify UTF-8 as charset without which we have errors
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: 'admin.vm',
            template: 'templates/admin.ejs',
            contextPath: contextPath,
            embedded: embedded,
            useSsl: useSsl,
            embedderURL: embedderURL,
            //chunks: ['admin'] Not specifying the chunk since its not possible yet (need to go to Webpack2) to specify UTF-8 as charset without which we have errors
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: 'dashboard.vm',
            template: 'templates/dashboard.ejs',
            contextPath: contextPath,
            embedded: embedded,
            useSsl: useSsl,
            embedderURL: embedderURL,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: 'tests.vm',
            template: 'templates/tests.ejs',
            contextPath: contextPath,
            embedded: embedded,
            useSsl: useSsl,
            embedderURL: embedderURL,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: 'geppettoTests.vm',
            template: 'templates/geppettoTests.ejs',
            contextPath: contextPath,
            embedded: embedded,
            useSsl: useSsl,
            embedderURL: embedderURL,
            //chunks: ['tests'] Not specifying the chunk since its not possible yet (need to go to Webpack2) to specify UTF-8 as charset without which we have errors
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: '../WEB-INF/web.xml',
            template: 'templates/web.ejs',
            contextPath: contextPath,
            embedded: embedded,
            useSsl: useSsl,
            embedderURL: embedderURL,
            chunks: []
        }),
    ],

    resolve: {
        extensions: ['', '.js', '.json'],
    },

    module: {
        loaders: [
            {
                test: /\.(js)$/, exclude: [/node_modules/, /\.bundle/], loader: ['babel-loader'],
                query: {
                    presets: ['react', 'es2015']
                }
            },
            {
                test: /\.json$/,
                loader: "json-loader"
            },
            {
                test: /\.(py|png|svg|gif|css|jpg|md|map)$/,
                loader: 'ignore-loader'
            },
            {   test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.less$/,
                loader: 'style!css!less'
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: 'file?name=/fonts/[name].[ext]'
            }
            // {
            //   test: /\.(jpe?g|png|gif|svg)$/i,
            //   loaders: [
            //     'file?hash=sha512&digest=hex&name=[hash].[ext]',
            //     'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
            //   ]
            // }

        ]
    },

    //  resolve : {
    //	    alias: {
    //	      // bind version of jquery-ui
    //	      "jquery-ui": "jquery-ui/jquery-ui.js",
    //	      // bind to modules;
    //	      modules: path.join(__dirname, "node_modules"),
    //	    }
    //	},

    node: {
        fs: 'empty',
        child_process: 'empty',
        module: 'empty'
    }
};