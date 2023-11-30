import { v4 } from 'uuid';
import { ApiProps } from './types';

export const isExternal = (loc: string) => {
  return loc.startsWith('/app/ext/');
}

let arbitraryCounter = 0;

export function nid(uuid?: string) {
  if ('v4' === uuid) {
    return v4();
  }
  arbitraryCounter++;
  return arbitraryCounter;
}

/**
 * @category Util
 */
export async function asyncForEach<T>(array: T[], callback: (item: T, idx: number, arr: T[]) => Promise<void>): Promise<void> {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function charCount(chars: string): number {
  let count = 0;
  for (let i = 0; i < chars.length; i++) {
    count += chars.charCodeAt(i);
  }
  return count;
}

const sets = [
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '0123456789',
  '!@#$%^&*_/\\'
];

export const passwordGen = (): string => {
  const chars = 4;
  const pass: string[] = [];

  sets.forEach(set => {
    for (let i = 0, n = set.length; i < chars; i++) {
      const seed = Math.floor(Math.random() * n);
      pass.splice(seed + i * chars, 0, set.charAt(seed));
    }
  });

  return pass.join('');
}

export function obfuscate(input: string): string {
  const allChars = sets.join('');
  const base = allChars.length;
  let output = '';

  for (const char of input) {
    let index = allChars.indexOf(char);
    if (index === -1) continue;  // Skip characters not in sets
    
    // Apply a transformation to index
    index = (index + 13) % base; // Rotate index by 13

    // Convert to base-N where N is base of all characters in sets
    let encoded = '';
    let tempIndex = index;
    do {
      const remainder = tempIndex % base;
      encoded = allChars[remainder] + encoded;
      tempIndex = Math.floor(tempIndex / base);
    } while (tempIndex > 0);

    output += encoded;
  }

  return output;
}


type Mode = 'encode' | 'decode';

export function decodeVal(input: string): string {
  return processString(input, 'decode');
}

export function encodeVal(input: string): string {
  return processString(input, 'encode');
}

export function processString(input: string, mode: Mode): string {
  const allChars = sets.join('');
  const base = allChars.length;
  let output = '';

  for (const char of input) {
    let index = allChars.indexOf(char);
    if (index === -1) continue;  // Skip characters not in sets
    
    // Apply or reverse the transformation to index based on mode
    index = (mode === 'encode' ? (index + 13) : (index - 13 + base)) % base;

    // Convert to base-N where N is base of all characters in sets
    let processed = '';
    let tempIndex = index;
    do {
      const remainder = tempIndex % base;
      processed = allChars[remainder] + processed;
      tempIndex = Math.floor(tempIndex / base);
    } while (tempIndex > 0);

    output += processed;
  }

  return output;
}


export const toSnakeCase = (name: string): string => {
  return name.substring(1).replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`).slice(1);
};

export const toTitleCase = (name: string): string => {
  return name.substring(1).replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
};

export function generateLightBgColor(): string {
  // Function to convert a single component of a color from hex to decimal
  function hexToDec(hex: string): number {
    return parseInt(hex, 16);
  }

  // Function to calculate the relative luminance of a color
  function calculateLuminance(r: number, g: number, b: number): number {
    let a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  // Function to generate a random light color
  function generateColor(): string {
    let color = Math.floor(Math.random() * Math.pow(256, 3)).toString(16);
    while (color.length < 6) {
      color = '0' + color;
    }
    return color;
  }

  // Generate a random color
  let color = generateColor();

  // Calculate the relative luminance of the color
  let luminance = calculateLuminance(
    hexToDec(color.slice(0, 2)),
    hexToDec(color.slice(2, 4)),
    hexToDec(color.slice(4, 6))
  );

  // If the color is too dark, generate a new color
  while (luminance < 0.5) {
    color = generateColor();
    luminance = calculateLuminance(
      hexToDec(color.slice(0, 2)),
      hexToDec(color.slice(2, 4)),
      hexToDec(color.slice(4, 6))
    );
  }

  // Return the color
  return '#' + color;
}


// convert a string into a unique symbol for the purposes of dynamic attr selection
// const thing = 'myAttr';
// const requestAccessor: ReturnType<typeof sym> = sym(thing);
// const { [requestAccessor]: giveItAName } = someObject;
export const sym: (a: string) => { readonly 0: unique symbol }[0] = a => Symbol(a) as ReturnType<typeof sym>;

// XOR encryption
// Example string
// const str = 'group_name_here=38fjs9ed';

// // Generate a random byte
// const randomByte = Math.floor(Math.random() * 256);

// // Convert string to array of character codes
// const charCodes = str.split('').map((char) => char.charCodeAt(0));

// // XOR each character code with the random byte
// const encryptedCharCodes = charCodes.map((charCode) => charCode ^ randomByte);

// // Convert the encrypted character codes back to a string
// let encryptedStr = String.fromCharCode(...encryptedCharCodes);

// // Use Base64 encoding to make the string URL-safe
// encryptedStr = btoa(encryptedStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// XOR Decryption
// // Encrypted URL-safe string (from previous example)
// const encryptedStr = 'YWp7ZHsnLn10KWZzbCkjZWAj';

// // Convert the URL-safe string to Base64
// let decryptedStr = atob(encryptedStr.replace(/-/g, '+').replace(/_/g, '/'));

// // Convert the decrypted string to an array of character codes
// const decryptedCharCodes = decryptedStr.split('').map((char) => char.charCodeAt(0));

// // XOR each character code with the random byte to decrypt
// const randomByte = 149; // Random byte used for encryption (from previous example)
// const charCodes = decryptedCharCodes.map((charCode) => charCode ^ randomByte);

// // Convert the decrypted character codes back to a string
// decryptedStr = String.fromCharCode(...charCodes);

// throttle

type ThrottleFunction<T extends unknown[]> = (this: void, ...args: T) => void;

export function throttle<T extends unknown[]>(func: ThrottleFunction<T>, limit: number): ThrottleFunction<T> {
  let lastFunc: ReturnType<typeof setTimeout> | null;
  let lastRan: number;
  return function (this: void, ...args: T) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      lastFunc && clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item) as T) as unknown as T;
  }

  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }

  return result as T;
}

export function getMapFromArray<T extends { id: string }>(state: Map<string, T>, payload: T[]): Map<string, T> {
  return payload.reduce((m, d) => {
    m.set(d.id, { ...m.get(d.id), ...d });
    return m;
  }, new Map(state))
}

export type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
type DistributeKey<K, T> = T extends infer U ? K extends keyof U ? U[K] : unknown : never;

export type Merge<T> = T extends AnyRecord
  ? {
    [K in keyof T]: T[K] extends AnyRecord
    ? DistributeKey<string, T[K]>
    : T[K];
  }
  : never;
export type AnyRecordTypes = string | number | boolean | Partial<Void> | ArrayBuffer | undefined | unknown[];
export interface AnyRecord { [prop: string]: (AnyRecordTypes | AnyRecord | ArrayBuffer) extends infer U ? U : never; }

export type Void = { _void: never };
export type ReplaceVoid<T> = T extends Void ? void : T;
export type Extend<T> = { [K in keyof T]: T[K] };
export type RemoveNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K]; };
type PartialUndefined<T> = { [P in keyof T]: T[P] | undefined; };

export const createEmptyType = <T>(...args: string[]): Partial<T> => {
  let t = {} as Partial<T>;
  for (const prop of args) {
    t[prop as keyof T] = undefined;
  }
  return t;
}

export function extractParams(genericUrl: string, requestUrl: string) {
  const genericUrlParts = genericUrl.split('/');
  const requestUrlParts = requestUrl.split('/');

  const result = {} as AnyRecord;

  for (let i = 0; i < genericUrlParts.length; i++) {
    if (genericUrlParts[i].startsWith(':')) {
      const paramName = genericUrlParts[i].slice(1);
      result[paramName] = requestUrlParts[i];
    }
  }

  return result;
}

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

export function withEvent<T extends AnyRecord | ArrayBuffer>(props: ApiProps<AnyRecord | ArrayBuffer>, eventBody: T): ApiProps<T> {
  return {
    ...props,
    event: {
      ...props.event,
      body: eventBody
    }
  };
}

export function isVoid(obj: unknown): obj is Void {
  return Object.keys(obj as Record<string, unknown>).length === 0 || typeof obj === 'undefined';
}