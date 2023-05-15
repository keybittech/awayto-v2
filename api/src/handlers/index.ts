import { createHandlers } from 'awayto/core';

import assistApiHandler from './assist';
import bookingTranscriptApiHandler from './booking_transcript';
import bookingApiHandler from './booking';
import contactApiHandler from './contact';
import fileApiHandler from './file';
import formApiHandler from './form';
import groupFeedbackApiHandler from './group_feedback';
import groupFilesApiHandler from './group_files';
import groupFormApiHandler from './group_form';
import groupRoleApiHandler from './group_role';
import groupScheduleApiHandler from './group_schedule';
import groupServiceAddonApiHandler from './group_service_addon';
import groupServiceApiHandler from './group_service';
import groupUserScheduleApiHandler from './group_user_schedule';
import groupUserApiHandler from './group_user';
import groupApiHandler from './group';
import lookupApiHandler from './lookup';
import manageGroupApiHandler from './manage_group';
import manageRoleApiHandler from './manage_role';
import paymentApiHandler from './payment';
import profileApiHandler from './profile';
import quoteApiHandler from './quote';
import roleApiHandler from './role';
import scheduleApiHandler from './schedule';
import serviceAddonApiHandler from './service_addon';
import serviceTierApiHandler from './service_tier';
import serviceApiHandler from './service';
import uuidNotesApiHandler from './uuid_notes';

/**
 * @category API
 */
export const siteApiHandlerRef = createHandlers({
  ...assistApiHandler,
  ...bookingTranscriptApiHandler,
  ...bookingApiHandler,
  ...contactApiHandler,
  ...fileApiHandler,
  ...formApiHandler,
  ...groupFeedbackApiHandler,
  ...groupFormApiHandler,
  ...groupRoleApiHandler,
  ...groupScheduleApiHandler,
  ...groupServiceAddonApiHandler,
  ...groupServiceApiHandler,
  ...groupUserScheduleApiHandler,
  ...groupUserApiHandler,
  ...groupApiHandler,
  ...lookupApiHandler,
  ...manageGroupApiHandler,
  ...manageRoleApiHandler,
  ...paymentApiHandler,
  ...profileApiHandler,
  ...quoteApiHandler,
  ...roleApiHandler,
  ...scheduleApiHandler,
  ...serviceAddonApiHandler,
  ...serviceTierApiHandler,
  ...serviceApiHandler,
  ...groupFilesApiHandler,
  ...uuidNotesApiHandler
});