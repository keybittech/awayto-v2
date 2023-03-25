export const IActions: Record<string, Record<string, string>> = {};

export type IActionTypes = string;

export function findActionByPath(value: IActionTypes): { name: string, key: string } | null {
  for (const [name, enumObject] of Object.entries(IActions)) {
    for (const [key, val] of Object.entries(enumObject)) {
      if (val === value) {
        return { name, key };
      }
    }
  }
  return null;
}