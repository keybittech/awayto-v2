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