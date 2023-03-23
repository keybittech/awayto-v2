/**
 * @category Util
 */
export async function asyncForEach<T>(array: T[], callback: (item: T, idx: number, arr: T[]) => Promise<void>): Promise<void> {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const sets = [
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '0123456789',
  '!@#$%^&*'
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
  return function(this: void, ...args: T) {
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

export function getMapFromArray<T extends { id: string }>(state: Map<string, T>, payload: T[]): Map<string, T> {
  return payload.reduce((m, d) => {
    m.set(d.id, { ...m.get(d.id), ...d });
    return m;
  }, new Map(state))
}

// export function getMapFromArrayWithProps<T extends { id: string }>(state: Map<string, T>, payload: T[], ...props: (keyof T)[]): Map<string, T> {
//   return payload.reduce((m, d) => {
//     const obj = m.get(d.id) || {} as Record<keyof T, unknown>;
//     props.forEach(prop => {
//       if (Object.hasOwn(d, prop)) {
//         const propMap = obj[prop] as Map<string, unknown>;
//         const newMap = new Map(Object.entries(obj[prop] as Record<string, T>));
//         obj[prop] = new Map([ ...propMap, ...newMap ])
//       }
//     })

//     m.set(d.id, { ...obj, ...d });
//     return m;
//   }, new Map(state))
// }

//- ---------------------
type Primitive = Map<string, unknown> | string | number | boolean | bigint | symbol | null | undefined;
type Expand<T> = T extends Primitive ? T : { [K in keyof T]: T[K] };

type OptionalKeys<T> = {
    [K in keyof T]-?: T extends Record<K, T[K]> ? never : K;
}[keyof T];

type RequiredKeys<T> = {
    [K in keyof T]-?: T extends Record<K, T[K]> ? K : never;
}[keyof T] &
    keyof T;

type RequiredMergeKeys<T, U> = RequiredKeys<T> & RequiredKeys<U>;

type OptionalMergeKeys<T, U> =
    | OptionalKeys<T>
    | OptionalKeys<U>
    | Exclude<RequiredKeys<T>, RequiredKeys<U>>
    | Exclude<RequiredKeys<U>, RequiredKeys<T>>;

type MergeNonUnionObjects<T, U> = Expand<
    {
        [K in RequiredMergeKeys<T, U>]: Expand<Merge<T[K], U[K]>>;
    } & {
        [K in OptionalMergeKeys<T, U>]?: K extends keyof T
            ? K extends keyof U
                ? Expand<Merge<
                    Exclude<T[K], undefined>,
                    Exclude<U[K], undefined>
                >>
                : T[K]
            : K extends keyof U
            ? U[K]
            : never;
    }
>;

type MergeNonUnionArrays<T extends readonly unknown[], U extends readonly unknown[]> = Array<Expand<Merge<T[number], U[number]>>>

type MergeArrays<T extends readonly unknown[], U extends readonly unknown[]> = [T] extends [never]
    ? U extends unknown
        ? MergeNonUnionArrays<T, U>
        : never
    : [U] extends [never]
    ? T extends unknown
        ? MergeNonUnionArrays<T, U>
        : never
    : T extends unknown
    ? U extends unknown
        ? MergeNonUnionArrays<T, U>
        : never
    : never;

type MergeObjects<T, U> = [T] extends [never]
    ? U extends unknown
        ? MergeNonUnionObjects<T, U>
        : never
    : [U] extends [never]
    ? T extends unknown
        ? MergeNonUnionObjects<T, U>
        : never
    : T extends unknown
    ? U extends unknown
        ? MergeNonUnionObjects<T, U>
        : never
    : never;

export type Merge<T, U> =
    | Extract<T | U, Primitive>
    | MergeArrays<Extract<T, readonly unknown[]>, Extract<U, readonly unknown[]>>
    | MergeObjects<Exclude<T, Primitive | readonly unknown[]>, Exclude<U, Primitive | readonly unknown[]>>;


// ------------------------