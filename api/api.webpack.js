const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

const dd = process.env.NODE_ENV === 'docker';

module.exports = {
  context: __dirname,
  entry: './src/apiserver.ts',
  mode: dd ? 'production' : 'development',
  devtool: dd ? undefined : 'inline-source-map',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'api.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'awayto/core': path.resolve(__dirname, '../core/src/index.ts')
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'esbuild-loader'
        }
      }
    ],
  },
  target: 'node',
  optimization: {
    minimize: false
  },
  plugins: Array.prototype.concat([
    new webpack.ContextReplacementPlugin(/@ts-morph\/common\/dist/, /^$/),
    new webpack.ContextReplacementPlugin(/express\/lib/, /^$/),
  ], ...(dd ? [] : [new Dotenv()]))
};