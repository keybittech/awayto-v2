import { Merge } from '../util';

declare global {
  /**
   * @category Awayto Redux
   */
  type ISharedActions =  ICommonModuleActions | IManageModuleActions | IProfileModuleActions;

  interface IMergedState {}

}

export type PaletteMode = 'light' | 'dark';

export interface Action<T = unknown> {
  type: T
}

/**
 * @category Awayto Redux
 */
export type MetaAction<Type, Meta> = Action<Type> & {
  meta?: Meta;
};

/**
 * @category Awayto Redux
 */
export type PayloadAction<Type, Payload, Meta = void> = MetaAction<Type, Meta> & {
  readonly payload: Payload;
};

/**
 * @category Awayto Redux
 */
export type ILoadedState = ISharedState[keyof ISharedState];

export type ValueOf<T> = T[keyof T];

export type StatePayloadValues = Record<string, ValueOf<ISharedState>>

/**
 * @category Action Types
 */
export type IActionTypes = ISharedActionTypes[keyof ISharedActionTypes];

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






















/**
 * @category Authorization
 */
export enum SiteRoles {
  APP_ROLE_CALL = 'APP_ROLE_CALL',
  APP_GROUP_ADMIN = 'APP_GROUP_ADMIN',
  APP_GROUP_ROLES = 'APP_GROUP_ROLES',
  APP_GROUP_USERS = 'APP_GROUP_USERS',
  // APP_GROUP_MATRIX = 'APP_GROUP_MATRIX',
  APP_GROUP_SERVICES = 'APP_GROUP_SERVICES',
  APP_GROUP_BOOKINGS = 'APP_GROUP_BOOKINGS',
  APP_GROUP_FEATURES = 'APP_GROUP_FEATURES',
  APP_GROUP_SCHEDULES = 'APP_GROUP_SCHEDULES'
}

/**
 * @category Authorization
 */
export type DecodedJWTToken = {
  resource_access: {
    [prop: string]: { roles: string[] }
  },
  groups: string[]
}

/**
 * @category Awayto
 */
export class ApiResponse {
  responseText?: string;
  responseString?: string;
  responseBody?: Response;
}

/**
 * @category Awayto
 */
export interface CallApi {
  actionType: IActionTypes;
  body?: string;
}

/**
 * @category Awayto
 */
export interface ApiResponseBody {
  error: Error | string;
  type: string;
  message: string;
  statusCode: number;
  requestId: string;
}

/**
 * @category Awayto
 */
export interface IPreviewFile extends File {
  preview?: string;
}

export * from './time_unit';

export * from './assist';

export * from './common';
export * from './manage';
export * from './profile';

export * from './group';
export * from './role';
export * from './user';

export * from './booking';
export * from './contact';
export * from './form';
export * from './lookup';
export * from './payment';
export * from './quote';
export * from './schedule';
export * from './service';
