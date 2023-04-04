const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, `settings.${process.argv.includes('--local') ? 'local' : process.env.NODE_ENV}.env`) });
dotenv.config({ path: path.join(__dirname, `settings.application.env`) });

const fs = require('fs');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

const { getLoaders, loaderByName, addBeforeLoader, ESLINT_MODES, } = require('@craco/craco');

const crypto = require('crypto');
const glob = require('glob');
const express = require('express');


const { AWAYTO_CORE, AWAYTO_WEBAPP_MODULES, AWAYTO_WEBAPP } = process.env;

/**
 * 
 * @param {string} n A path name returned from glob.sync
 * @returns An object like `{ 'MyComponent': 'common/views/MyComponent' }`
 */
const buildPathObject = n => ({ [`${n[n.length - 1].split('.')[0]}`]: `${n[n.length - 3]}/${n[n.length - 2]}/${n[n.length - 1].split('.')[0]}` }) // returns { 'MyThing': 'common/views/bla' }

const appBuildOutputPath = path.resolve(__dirname + AWAYTO_WEBAPP + '/build.json');
const appRolesOutputPath = path.resolve(__dirname + AWAYTO_WEBAPP + '/roles.json');
const globOpts = {
  cache: false,
  statCache: false
};

try {
  if (!fs.existsSync(appBuildOutputPath)) fs.closeSync(fs.openSync(appBuildOutputPath, 'w'));
  if (!fs.existsSync(appRolesOutputPath)) fs.closeSync(fs.openSync(appRolesOutputPath, 'w'));
} catch (error) { }

/**
 * 
 * @param {string} path A file path to a set of globbable files
 * @returns An object containing file names as keys and values as file paths
 * ```
 * {
 *   "views": {
 *     "Home": "common/views/Home",
 *     "Login": "common/views/Login",
 *     "Secure": "common/views/Secure",
 *   },
 *   "reducers": {
 *     "login": "common/reducers/login",
 *     "util": "common/reducers/util",
 *   }
 * }
 * ```
 */
function parseResource(path) {
  return glob.sync(path, globOpts).map((m) => buildPathObject(m.split('/'))).reduce((a, b) => ({ ...a, ...b }), {});
}

/**
 * <p>We keep a reference to the old hash of files</p>.
 */
let oldAppOutputHash;
let oldRolesOutputHash;

/**
 * <p>This function runs on build and when webpack dev server receives a request.</p>
 * <p>Scan the file system for views and reducers and parse them into something we can use in the app.</p>
 * <p>Check against a hash of existing file structure to see if we need to update the build file. The build file is used later in the app to load the views and reducers.</p>
 * 
 * @param {app.next} next The next function from express app
 */
function checkWriteBuildFile(next) {
  try {
    const files = {
      views: parseResource('.' + AWAYTO_WEBAPP_MODULES + '/**/views/*.tsx'),
      reducers: parseResource('.' + AWAYTO_WEBAPP_MODULES + '/**/reducers/*.ts')
    };
    const filesString = JSON.stringify(files);

    const roles = {};
    Object.values(files.views).forEach(file => {
      const fileString = fs.readFileSync('.' + AWAYTO_WEBAPP_MODULES + '/' + file + '.tsx').toString();
      const found = fileString.match(/(?<=export const roles = )(\[.*\])/igm);
      if (found?.length) {
        roles[file] = JSON.parse(found[0].replaceAll('\'', '"'));
      }
    });
    const rolesString = JSON.stringify({ roles });

    const newRolesOutputHash = crypto.createHash('sha1').update(Buffer.from(rolesString)).digest('base64');

    if (oldRolesOutputHash !== newRolesOutputHash) {
      oldRolesOutputHash = newRolesOutputHash;
      fs.writeFileSync(appRolesOutputPath, rolesString);
    }

    const newAppOutputHash = crypto.createHash('sha1').update(Buffer.from(filesString)).digest('base64');

    if (oldAppOutputHash !== newAppOutputHash) {
      oldAppOutputHash = newAppOutputHash;
      // write new roles here
      fs.writeFile(appBuildOutputPath, filesString, () => next && next())
    } else {
      next && next()
    }
  } catch (error) {
    console.log('error!', error)
  }
}

checkWriteBuildFile();

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

module.exports = {
  eslint: {
    enable: false,
    mode: ESLINT_MODES.NONE
  },
  webpack: {
    alias: {
      'awayto/core': resolveApp(AWAYTO_CORE + '/index.ts'),
      'awayto/hooks': resolveApp('.' + AWAYTO_WEBAPP + '/hooks/index.ts'),
    },
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => !(plugin instanceof ModuleScopePlugin)
      );

      webpackConfig.plugins.push(
        new ForkTsCheckerWebpackPlugin({
          typescript: {
            enabled: true,
            configFile: resolveApp('./tsconfig.json'),
          },
        }),
        new CircularDependencyPlugin({
          exclude: /a\.js|node_modules/,
          include: /src/,
          failOnError: true,
          allowAsyncCycles: false,
          cwd: process.cwd()
        })
      );

      const { matches } = getLoaders(webpackConfig, loaderByName('babel-loader'))
      addBeforeLoader(webpackConfig, loaderByName('babel-loader'), {
        ...matches[0].loader,
        include: [resolveApp(AWAYTO_CORE)]
      })

      return webpackConfig;
    },
    devServer: (devServerConfig, { env, paths, proxy, allowedHost }) => {
      devServerConfig.before = (app, server, compiler) => {
        app.use(express.static(__dirname + AWAYTO_CORE, {
          etag: false
        }));
        app.use((req, res, next) => {
          checkWriteBuildFile(next);
        });
      };
      return devServerConfig;
    }
  }
};
