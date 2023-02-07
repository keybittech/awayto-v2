import Tests from './tests';
import Public from './public';
import Files from './files';
import Users from './users';
import UuidGroups from './uuid_groups';
import UuidFiles from './uuid_files';
import UuidNotes from './uuid_notes';
import UuidRoles from './uuid_roles';
import Roles from './roles';
import ManageRoles from './manage_roles';
import Groups from './groups';
import ManageGroups from './manage_groups';
import ManageUsers from './manage_users';

import Forms from './forms';

import Bookings from './bookings';
import Contacts from './contacts';
import Payments from './payments';
import Quotes from './quotes';
import ScheduleContexts from './schedule_contexts';
import Schedules from './schedules';
import ServiceAddons from './service_addons';
import ServiceTiers from './service_tiers';
import Services from './services';

import { AuthEventHandlers } from './auth';

export default  {
  events: {
    ...AuthEventHandlers
  },
  protected: [
    ...Tests,
    ...Files,
    ...Users,
    ...UuidGroups,
    ...UuidFiles,
    ...UuidNotes,
    ...UuidRoles,
    ...Roles,
    ...ManageRoles,
    ...Groups,
    ...ManageGroups,
    ...ManageUsers,
    ...Forms,
    ...Bookings,
    ...Contacts,
    ...Payments,
    ...Quotes,
    ...ScheduleContexts,
    ...Schedules,
    ...ServiceAddons,
    ...ServiceTiers,
    ...Services
  ],
  public: [
    ...Public
  ]
}