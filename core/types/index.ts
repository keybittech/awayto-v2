export interface AppState {}

export type PaletteMode = 'light' | 'dark';

/**
 * @category Build
 * @param {string} n A path name returned from glob.sync
 * @returns An object like `{ 'MyComponent': 'common/views/MyComponent' }`
 */
export declare function buildPathObject(path: string): string;

/**
 * @category Build
 * @param {string} path A file path to a set of globbable files
 * @returns An object containing file names as keys and values as file paths.
 * @example
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
export declare function parseResource(path: string): Record<string, string>;

/**
 * <p>This function runs on build and when webpack dev server receives a request.</p>
 * <p>Scan the file system for views and reducers and parse them into something we can use in the app.</p>
 * <p>Check against a hash of existing file structure to see if we need to update the build file. The build file is used later in the app to load the views and reducers.</p>
 * 
 * ```
 * // from config-overrides.js
 * 
 * function checkWriteBuildFile(next) {
 *   try {
 *     const files = JSON.stringify({
 *       views: parseResource('.' + REACT_APP_AWAYTO_WEBAPP_MODULES + '/**\/views/*.tsx'),
 *       reducers: parseResource('.' + REACT_APP_AWAYTO_WEBAPP_MODULES + '/**\/reducers/*.ts')
 *     });
 * 
 *     const newHash = crypto.createHash('sha1').update(Buffer.from(files)).digest('base64');
 * 
 *     if (oldHash != newHash) {
 *       oldHash = newHash;
 *       fs.writeFile(filePath, files, () => next && next())
 *     } else {
 *       next && next()
 *     }
 *   } catch (error) {
 *     console.log('error!', error)
 *   }
 * }
 * 
 * ```
 * @category Build
 * @param {app.next} next The next function from express app
 */
export declare function checkWriteBuildFile(next: () => unknown): void;

export * from './auth';
export * from './api';
export * from './assist';
export * from './booking_transcript';
export * from './booking';
export * from './contact';
export * from './exchange';
export * from './feedback';
export * from './file';
export * from './file_store';
export * from './form';
export * from './group_form';
export * from './group_role';
export * from './group_schedule';
export * from './group_service_addon';
export * from './group_service';
export * from './group_user_schedule';
export * from './group_user';
export * from './group';
export * from './lookup';
export * from './manage_role';
export * from './payment';
export * from './profile';
export * from './quote';
export * from './role';
export * from './schedule';
export * from './service_addon';
export * from './service_tier';
export * from './service';
export * from './time_unit';
export * from './user';
export * from './util';
export * from './uuid_files';
export * from './uuid_notes';