const path = require('path');
const Dotenv = require('dotenv-webpack');

const { NODE_ENV } = process.env;
const BUILD_ENV = 'development' === NODE_ENV ? 'development' : 'docker';

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
      awayto: `${'development' === BUILD_ENV ? '../../../app/website/src/core/index.ts' : '/api/src/core/index.ts'}`
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
            configFile: `tsconfig${'development' === BUILD_ENV ? '' : `.${BUILD_ENV}`}.json`
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