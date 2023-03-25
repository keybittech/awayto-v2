import { Merge } from 'awayto';
import { PayloadAction} from '.';
import { IActions } from './actionTypes';

declare global {
  interface IMergedState extends Merge<IServiceState & IServiceAddonState & IServiceTierState> {}
}


/**
 * @category Awayto
 */
export type IService = {
  id: string;
  name: string;
  cost: string;
  tiers: Record<string, IServiceTier>;
  formId: string;
  createdOn: string;
};

/**
 * @category Service
 */
export type IServiceState = IService & {
  services: Map<string, IService>;
};

/**
 * @category Action Types
 */
export enum IServiceActionTypes {
  POST_SERVICE = "POST/services",
  PUT_SERVICE = "PUT/services",
  GET_SERVICES = "GET/services",
  GET_SERVICE_BY_ID = "GET/services/:id",
  DELETE_SERVICE = "DELETE/services/:ids",
  DISABLE_SERVICE = "PUT/services/:ids/disable"
}

IActions['service'] = IServiceActionTypes;

/**
 * @category Service
 */
export type IPostServiceAction = PayloadAction<IServiceActionTypes.POST_SERVICE, IService[]>;

/**
 * @category Service
 */
export type IPutServiceAction = PayloadAction<IServiceActionTypes.PUT_SERVICE, IService[]>;

/**
 * @category Service
 */
export type IGetServicesAction = PayloadAction<IServiceActionTypes.GET_SERVICES, IService[]>;

/**
 * @category Service
 */
export type IGetServiceByIdAction = PayloadAction<IServiceActionTypes.GET_SERVICE_BY_ID, IService[]>;

/**
 * @category Service
 */
export type IDeleteServiceAction = PayloadAction<IServiceActionTypes.DELETE_SERVICE, IService[]>;

/**
 * @category Service
 */
export type IDisableServiceAction = PayloadAction<IServiceActionTypes.DISABLE_SERVICE, IService[]>;

/**
 * @category Service
 */
export type IServiceActions = IPostServiceAction 
  | IPutServiceAction 
  | IGetServicesAction 
  | IGetServiceByIdAction
  | IDeleteServiceAction
  | IDisableServiceAction;



/**
 * @category Service
 */
 export type IServiceAddon = {
  id: string;
  name: string;
  order: number;
  createdOn: string;
};

/**
 * @category Service
 */
 export type IServiceAddonState = IServiceAddon & {
   serviceAddons: Map<string, IServiceAddon>;
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
 
 /**
  * @category Service
  */
 export type IPostServiceAddonAction = PayloadAction<IServiceAddonActionTypes.POST_SERVICE_ADDON, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IPutServiceAddonAction = PayloadAction<IServiceAddonActionTypes.PUT_SERVICE_ADDON, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IGetServiceAddonsAction = PayloadAction<IServiceAddonActionTypes.GET_SERVICE_ADDONS, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IGetServiceAddonByIdAction = PayloadAction<IServiceAddonActionTypes.GET_SERVICE_ADDON_BY_ID, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IDeleteServiceAddonAction = PayloadAction<IServiceAddonActionTypes.DELETE_SERVICE_ADDON, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IDisableServiceAddonAction = PayloadAction<IServiceAddonActionTypes.DISABLE_SERVICE_ADDON, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IServiceAddonActions = IPostServiceAddonAction 
   | IPutServiceAddonAction 
   | IGetServiceAddonsAction 
   | IGetServiceAddonByIdAction
   | IDeleteServiceAddonAction
   | IDisableServiceAddonAction;
 


/**
 * @category Service
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
 * @category Service
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
 
 /**
  * @category Service
  */
 export type IPostServiceTierAction = PayloadAction<IServiceTierActionTypes.POST_SERVICE_TIER, IServiceTier>;
 
 /**
  * @category Service
  */
 export type IPutServiceTierAction = PayloadAction<IServiceTierActionTypes.PUT_SERVICE_TIER, IServiceTier>;
 
 /**
  * @category Service
  */
 export type IGetServiceTiersAction = PayloadAction<IServiceTierActionTypes.GET_SERVICE_TIERS, IServiceTier>;
 
 /**
  * @category Service
  */
 export type IGetServiceTierByIdAction = PayloadAction<IServiceTierActionTypes.GET_SERVICE_TIER_BY_ID, IServiceTier>;
 
 /**
  * @category Service
  */
 export type IDeleteServiceTierAction = PayloadAction<IServiceTierActionTypes.DELETE_SERVICE_TIER, IServiceTierState>;
 
 /**
  * @category Service
  */
 export type IDisableServiceTierAction = PayloadAction<IServiceTierActionTypes.DISABLE_SERVICE_TIER, IServiceTierState>;
 
 /**
  * @category Service
  */
 export type IServiceTierActions = IPostServiceTierAction 
   | IPutServiceTierAction 
   | IGetServiceTiersAction 
   | IGetServiceTierByIdAction
   | IDeleteServiceTierAction
   | IDisableServiceTierAction;