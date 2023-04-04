import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IServiceAddonState> {}
}

/**
 * @category Service Addon
 */
export type IServiceAddon = {
  id: string;
  name: string;
  order: number;
  createdOn: string;
};

/**
 * @category Service Addon
 */
 export type IServiceAddonState = IServiceAddon & {
   serviceAddons: Record<string, IServiceAddon>;
 };

 /**
  * @category Action Types
  */
 export enum IServiceAddonActionTypes {
   POST_SERVICE_ADDON = "POST/service_addons",
   PUT_SERVICE_ADDON = "PUT/service_addons",
   GET_SERVICE_ADDONS = "GET/service_addons",
   GET_SERVICE_ADDON_BY_ID = "GET/service_addons/:id",
   DELETE_SERVICE_ADDON = "DELETE/service_addons/:id",
   DISABLE_SERVICE_ADDON = "PUT/service_addons/:id/disable"
 }

 const initialServiceAddonState = {
  serviceAddons: {}
} as IServiceAddonState;