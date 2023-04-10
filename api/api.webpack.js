const path = require('path');
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
    alias: {
      'awayto/core': path.resolve(__dirname, '../core/index.ts')
    },
    extensions: ['.ts', '.js'],
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
    new Dotenv()
  ]
};