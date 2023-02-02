const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  context: __dirname,
  entry: './src/api.ts',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'api.js'
  },
  resolve: {
    alias: {
      awayto: '../../../app/website/src/core/index.ts'
    },
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  target: 'node',
  optimization: {
    minimize: false
  },
  experiments: {
    topLevelAwait: true
  },
  plugins: [
    new Dotenv()
  ]
};