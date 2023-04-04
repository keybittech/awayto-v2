


import { Merge } from '../util';
import { IService } from './service';

declare global {
  interface IMergedState extends Merge<IGroupServiceState> { }
}

/**
 * @category Group Service
 */
export type IGroupService = IService & {
  groupId: string;
};

/**
 * @category Group Service
 */
export type IGroupServiceState = IGroupService & {
  groupServices: Record<string, IGroupService>
};

/**
 * @category Action Types
 */
export enum IGroupServiceActionTypes {
  POST_GROUP_SERVICE = "POST/group/:groupName/services/:serviceId",
  GET_GROUP_SERVICES = "GET/group/:groupName/services",
  DELETE_GROUP_SERVICE = "DELETE/group/:groupName/services/:ids"
}
