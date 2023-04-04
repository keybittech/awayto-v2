import { Merge } from "../util";
import { IServiceAddon } from "./service_addon";


declare global {
  interface IMergedState extends Merge<IGroupServiceAddonState> { }
}

/**
 * @category Group Service Addon
 */
export type IGroupServiceAddon = IServiceAddon & {
  groupId: string;
};

/**
 * @category Group Service Addon
 */
export type IGroupServiceAddonState = IGroupServiceAddon & {
  groupServiceAddons: Record<string, IGroupServiceAddon>;
};

/**
 * @category Action Types
 */
export enum IGroupServiceAddonActionTypes {
  POST_GROUP_SERVICE_ADDON = "POST/group/:groupName/service_addons/:serviceAddonId",
  GET_GROUP_SERVICE_ADDONS = "GET/group/:groupName/service_addons",
  DELETE_GROUP_SERVICE_ADDON = "DELETE/group/:groupName/service_addons/:serviceAddonId"
}