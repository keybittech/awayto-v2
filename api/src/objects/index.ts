import Tests from './tests';
import Public from './public';
import Files from './files';
import Profiles from './profiles';
import UuidGroups from './uuid_groups';
import UuidFiles from './uuid_files';
import UuidNotes from './uuid_notes';
import UuidRoles from './uuid_roles';
import Roles from './roles';
import ManageRoles from './manage_roles';
import Groups from './groups';
import ManageGroups from './manage_groups';
import Users from './users';
import ManageUsers from './manage_users';

import Forms from './forms';

import Bookings from './bookings';
import Contacts from './contacts';
import Payments from './payments';
import Quotes from './quotes';
import Services from './services';
import GroupServices from './group_services';
import ServiceAddons from './service_addons';
import GroupServiceAddons from './group_service_addons';
import ServiceTiers from './service_tiers';
import ScheduleContexts from './schedule_contexts';
import Schedules from './schedules';

import { AuthWebhooks } from './auth';

export default  {
  webhooks: {
    ...AuthWebhooks
  },
  protected: [
    ...Tests,
    ...Files,
    ...Profiles,
    ...UuidGroups,
    ...UuidFiles,
    ...UuidNotes,
    ...UuidRoles,
    ...Roles,
    ...ManageRoles,
    ...Groups,
    ...ManageGroups,
    ...Users,
    ...ManageUsers,
    ...Forms,
    ...Bookings,
    ...Contacts,
    ...Payments,
    ...Quotes,
    ...ScheduleContexts,
    ...Schedules,
    ...ServiceAddons,
    ...GroupServices,
    ...GroupServiceAddons,
    ...ServiceTiers,
    ...Services
  ],
  public: [
    ...Public
  ]
}