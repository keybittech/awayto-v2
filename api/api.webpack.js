const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
  context: __dirname,
  entry: './src/apiserver.ts',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'api.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'awayto/core': path.resolve(__dirname, 'node_modules/awayto-core')
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: `tsconfig.json`
          }
        }
      }
    ],
  },
  target: 'node',
  optimization: {
    minimize: false
  },
  plugins: [
    new Dotenv(),
    new webpack.ContextReplacementPlugin(/@ts-morph\/common\/dist/, /^$/),
    new webpack.ContextReplacementPlugin(/express\/lib/, /^$/),
  ]
};