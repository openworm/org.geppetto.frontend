var packageJSON = require('./package.json');
var path = require('path');
var webpack = require('webpack');

const PATHS = {
  //build: path.join(__dirname, 'target', 'classes', 'META-INF', 'resources', 'webjars', packageJSON.name, packageJSON.version)
		build: path.join(__dirname, 'target', 'classes', 'static')
};

module.exports = {
  entry: './js/main.js',
  devtool: 'source-map',
  output: {
    //path: PATHS.build,
	 path: './js/',
    filename: 'app-bundle.js',
    publicPath: "/geppetto/js/",
  },
  
  // target: "node",
  
  module: {
      loaders: [
          { test: /\.css$/, loader: "style!css" },
        {
            test: /\.js?/,
            exclude: /node_modules/,
            loader: ['babel-loader'],
            query: {
              presets: ['react', 'es2015']
            }
        },
        { test: /\.json$/, loader: "json-loader" },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          loaders: [
            'file?hash=sha512&digest=hex&name=[hash].[ext]',
            'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
          ]
        }

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