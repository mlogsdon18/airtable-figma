const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const webpack = require('webpack');
require('dotenv').config({ path: './.env' }); 

// For this example, AIRTABLE_API_KEY will need to be setup in environment variables
const AIRTABLE_API_KEY  = process.env.AIRTABLE_API_KEY;

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',

  // This is necessary because Figma's 'eval' works differently than normal eval
  devtool: argv.mode === 'production' ? false : 'inline-source-map',

  entry: './src/code.ts', // The entry point for your plugin code
  

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.cjs'],
  },

  module: {
    rules: [
      // Converts TypeScript code to JavaScript
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },

      {
        test: /\.airtable/,
        loader: 'airtable-loader',
        options: {
          apiKey: AIRTABLE_API_KEY,
          showStats: true
        }
      }
    ],
  },

  // Webpack tries these extensions for you if you omit the extension like "import './file'"
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'), // Compile into a folder called "dist"
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      npm_package_version: '1', // use 'development' unless process.env.NODE_ENV is defined
      AIRTABLE_ENDPOINT_URL: 'https://api.airtable.com',
      AIRTABLE_API_KEY: AIRTABLE_API_KEY
    })
    
  ]

})

