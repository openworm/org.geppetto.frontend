var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
//var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var geppettoConfig;
try {
    geppettoConfig = require('./GeppettoConfiguration.json');
    console.log('\nLoaded Geppetto config from file');
} catch (e) {
    // Failed to load config file
    console.error('\nFailed to load Geppetto Configuration')
}

var publicPath = ((geppettoConfig.contextPath == '/') ? geppettoConfig.contextPath : path.join("/", geppettoConfig.contextPath, "geppetto/build/"));
console.log("\nThe public path (used by the main bundle when including split bundles) is: " + publicPath);


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

module.exports = function(env){

	if(env!=undefined){
		console.log(env);
		if(env.contextPath){
			geppettoConfig.contextPath=env.contextPath;
		}
		if(env.useSsl){
			geppettoConfig.useSsl= JSON.parse(env.useSsl);
		}
		if(env.noTest){
			geppettoConfig.noTest= JSON.parse(env.noTest);
		}
		if(env.embedded){
			geppettoConfig.embedded= JSON.parse(env.embedded);
		}
		if(env.embedderURL){
			geppettoConfig.embedderURL=env.embedderURL;
		}
	}
	
	console.log('Geppetto configuration \n');
	console.log(JSON.stringify(geppettoConfig, null, 2), '\n');
	
	var entries = {
		    main: "./js/pages/geppetto/main.js",
		    admin: "./js/pages/admin/admin.js"
	};

	console.log("\nThe Webpack entries are:");
	console.log(entries);

		


    return {
	    entry: entries,
	  
	    output: {
	        path: path.resolve(__dirname, 'build'),
	        filename: '[name].bundle.js',
	        publicPath: publicPath
	    },
	    plugins: [
	        // new BundleAnalyzerPlugin({
	        //     analyzerMode: 'static'
	        // }),
		    new webpack.optimize.CommonsChunkPlugin(['common']),
	        new CopyWebpackPlugin(availableExtensions),
	        new HtmlWebpackPlugin({
	            filename: 'geppetto.vm',
	            template: './js/pages/geppetto/geppetto.ejs',
	            GEPPETTO_CONFIGURATION: geppettoConfig,
	            // chunks: ['main'] Not specifying the chunk since its not possible
				// yet (need to go to Webpack2) to specify UTF-8 as charset without
				// which we have errors
	            chunks: []
	        }),
	        new HtmlWebpackPlugin({
	            filename: 'admin.vm',
	            template: './js/pages/admin/admin.ejs',
	            // chunks: ['admin'] Not specifying the chunk since its not possible
				// yet (need to go to Webpack2) to specify UTF-8 as charset without
				// which we have errors
	            chunks: []
	        }),
	        new HtmlWebpackPlugin({
	            filename: 'dashboard.vm',
	            template: './js/pages/dashboard/dashboard.ejs',
	            GEPPETTO_CONFIGURATION: geppettoConfig,
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
	                test: /\.(js|jsx)$/,
	                include: [path.resolve(__dirname, './js'), path.resolve(__dirname, './extensions'), path.resolve(__dirname, './style'), path.resolve(__dirname, './WEB-INF')],
	                exclude: [/ami.min.js/], 
	                loader: 'babel-loader',
	                query: {
	                    presets: [['babel-preset-env', { "modules": false }], 'stage-2', 'react']
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
    }
};
