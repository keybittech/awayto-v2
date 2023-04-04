import { Merge } from "../util";
import { IServiceAddon } from "./service_addon";

declare global {
  interface IMergedState extends Merge<IServiceTierState> {}
}

/**
 * @category Service Tier
 */
export type IServiceTier = {
  id: string;
  serviceId: string;
  formId: string;
  name: string;
  multiplier: string;
  addons: Record<string, IServiceAddon>;
  order: number;
  createdOn: string;
};


/**
 * @category Service Tier
 */
 export type IServiceTierState = IServiceTier & {
  serviceTiers: Record<string, IServiceTier>
 };

 /**
  * @category Action Types
  */
 export enum IServiceTierActionTypes {
   POST_SERVICE_TIER = "POST/service_tiers",
   PUT_SERVICE_TIER = "PUT/service_tiers",
   GET_SERVICE_TIERS = "GET/service_tiers",
   GET_SERVICE_TIER_BY_ID = "GET/service_tiers/:id",
   DELETE_SERVICE_TIER = "DELETE/service_tiers/:id",
   DISABLE_SERVICE_TIER = "PUT/service_tiers/:id/disable"
 }