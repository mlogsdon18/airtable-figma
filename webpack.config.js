const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

// For this example, AIRTABLE_API_KEY will need to be setup in environment variables
const  AIRTABLE_API_KEY  = process.env.AIRTABLE_API_KEY;

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
          apiKey: 'keybFJbuq3xnPLGX9',
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

})
