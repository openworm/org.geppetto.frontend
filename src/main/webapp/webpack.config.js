var packageJSON = require('./package.json');
var path = require('path');
var webpack = require('webpack');
var nodeEnv = process.env.NODE_ENV || 'development';
var publicPath = ((nodeEnv == 'development')?"/org.geppetto.frontend/":"/") + "geppetto/js/";


// console.log(process)
console.log(process.argv);
console.log(publicPath);

var generateTestsBundle = process.argv.indexOf('--noTest') == -1;
console.log(generateTestsBundle);
var entries = {
    main: "./js/main.js"
    // dashboard: "./dashboard/js/main.js",
};
if (generateTestsBundle){
    entries['tests']= "./js/GeppettoTests.js";
}
console.log(entries);



//const PATHS = {
//build: path.join(__dirname, 'target', 'classes', 'META-INF', 'resources', 'webjars', packageJSON.name, packageJSON.version)
//build: path.join(__dirname, 'target', 'classes', 'static')
//};

module.exports = {

  entry: entries,
  output: {
    //path: PATHS.build,
    path: './js/',
    //path: __dirname,
    filename: '[name].bundle.js',
    publicPath: publicPath,
  },



  resolve: {
    extensions: ['', '.js', '.json']
  },
  // target: "node",

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: ['babel-loader'],
        query: {
          presets: ['react', 'es2015']
        }
      },
      { test: /\.json$/, loader: "json-loader" },

      //TODO: This should not be needed, probably we need to use it because a wrong dynamic require
      { test: /\.(py|png|css|md)$/, loader: 'ignore-loader' },

      //{ test: /\.css$/, loader: "style!css" }
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