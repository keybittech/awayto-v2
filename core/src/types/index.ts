import { ApiHandler, ApiMap } from './api';

import assistApiRef from './assist';
import bookingTranscriptApiRef from './booking_transcript';
import bookingApiRef from './booking';
import contactApiRef from './contact';
import fileApiRef from './file';
import formApiRef from './form';
import siteFeedbackApiRef from './feedback';
import groupFeedbackApiRef from './group_feedback';
import groupFilesApiRef from './group_files';
import groupFormApiRef from './group_form';
import groupRoleApiRef from './group_role';
import groupScheduleApiRef from './group_schedule';
import groupServiceAddonApiRef from './group_service_addon';
import groupServiceApiRef from './group_service';
import groupUserScheduleApiRef from './group_user_schedule';
import groupUserApiRef from './group_user';
import groupApiRef from './group';
import lookupApiRef from './lookup';
import manageGroupApiRef from './manage_group';
import manageRoleApiRef from './manage_role';
import paymentApiRef from './payment';
import profileApiRef from './profile';
import quoteApiRef from './quote';
import roleApiRef from './role';
import scheduleApiRef from './schedule';
import serviceAddonApiRef from './service_addon';
import serviceTierApiRef from './service_tier';
import serviceApiRef from './service';
import uuidNotesApiRef from './uuid_notes';
import todoApiRef from './todo';

export function createSiteApi<T extends ApiMap>(apis: T): T {
  return apis;
}

/**
 * @category API
 */
export const siteApiRef = createSiteApi({
  ...assistApiRef,
  ...bookingTranscriptApiRef,
  ...bookingApiRef,
  ...contactApiRef,
  ...fileApiRef,
  ...formApiRef,
  ...siteFeedbackApiRef,
  ...groupFeedbackApiRef,
  ...groupFilesApiRef,
  ...groupFormApiRef,
  ...groupRoleApiRef,
  ...groupScheduleApiRef,
  ...groupServiceAddonApiRef,
  ...groupServiceApiRef,
  ...groupUserScheduleApiRef,
  ...groupUserApiRef,
  ...groupApiRef,
  ...lookupApiRef,
  ...manageGroupApiRef,
  ...manageRoleApiRef,
  ...paymentApiRef,
  ...profileApiRef,
  ...quoteApiRef,
  ...roleApiRef,
  ...scheduleApiRef,
  ...serviceAddonApiRef,
  ...serviceTierApiRef,
  ...serviceApiRef,
  ...uuidNotesApiRef,
  ...todoApiRef
});

export type ApiHandlers = ApiHandler<typeof siteApiRef>;

export function createHandlers<T extends Partial<ApiHandlers>>(handlers: T): T {
  return handlers;
}

export * from './api';
export * from './assist';
export * from './auth';
export * from './booking_transcript';
export * from './booking';
export * from './contact';
export * from './exchange';
export * from './feedback';
export * from './file_store';
export * from './file';
export * from './form';
export * from './group_feedback';
export * from './group_files';
export * from './group_form';
export * from './group_role';
export * from './group_schedule';
export * from './group_service_addon';
export * from './group_service';
export * from './group_user_schedule';
export * from './group_user';
export * from './group';
export * from './kiosk';
export * from './lookup';
export * from './manage_group';
export * from './manage_role';
export * from './payment';
export * from './profile';
export * from './quote';
export * from './role';
export * from './schedule';
export * from './service_addon';
export * from './service_tier';
export * from './service';
export * from './time_unit';
export * from './util';
export * from './uuid_notes';
export * from './web_socket';
export * from './todo';