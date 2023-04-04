import { Merge } from '../util';
import { IServiceTier } from './service_tier';

declare global {
  interface IMergedState extends Merge<IServiceState> {}
}

/**
 * @category Service
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
  services: Record<string, IService>;
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

const initialServiceState = {
  services: {}
} as IServiceState;

// export const servicesApi = createApi({
//   reducerPath: 'servicesApi',
//   baseQuery: getQueryAuth,
//   tagTypes: ['Services'],
//   endpoints: (builder) => ({
//     getServices: builder.query<IService[], void>({
//       query: () => '/services',
//       providesTags: ['Services'],
//     }),
//     getServiceById: builder.query<IService, string>({
//       query: (id) => `/services/${id}`,
//       providesTags: (result, error, id) => [{ type: 'Services', id }],
//     }),
//     postService: builder.mutation<IService, Partial<IService>>({
//       query: (body) => ({
//         url: '/services',
//         method: 'POST',
//         body,
//       }),
//       invalidatesTags: ['Services'],
//     }),
//     putService: builder.mutation<IService, Partial<IService>>({
//       query: (body) => ({
//         url: '/services',
//         method: 'PUT',
//         body,
//       }),
//       invalidatesTags: ['Services'],
//     }),
//     deleteService: builder.mutation<void, string[]>({
//       query: (ids) => ({
//         url: `/services/${ids.join(',')}`,
//         method: 'DELETE',
//       }),
//       invalidatesTags: ['Services'],
//     }),
//     disableService: builder.mutation<void, string[]>({
//       query: (ids) => ({
//         url: `/services/${ids.join(',')}/disable`,
//         method: 'PUT',
//       }),
//       invalidatesTags: ['Services'],
//     }),
//   }),
// });