type ModuleName = string;
type EnumKey = string;
export type IActionTypes = string;
export interface ILoadedActionTypes extends Record<ModuleName, Record<EnumKey, IActionTypes>> { }

export const IActions = {} as ILoadedActionTypes;

export function getModuleNameByActionType(value: IActionTypes): { name: ModuleName, key: IActionTypes } {
  for (const [name, enumObject] of Object.entries(IActions)) {
    if (enumObject) {
      for (const [key, val] of Object.entries(enumObject)) {
        if (val === value) {
          return { name, key };
        }
      }
    }
  }
  throw new Error('No module found for ' + value);
}
