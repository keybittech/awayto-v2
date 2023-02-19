// import Tests from './tests';
import Public from './public';
import Forms from './forms';
import Files from './files';
import Profiles from './profiles';
import UuidGroups from './uuid_groups';
import UuidFiles from './uuid_files';
import UuidNotes from './uuid_notes';
import UuidRoles from './uuid_roles';
import Roles from './roles';
import ManageRoles from './manage_roles';
import ManageGroups from './manage_groups';
import Users from './users';
import ManageUsers from './manage_users';

import Bookings from './bookings';
import Contacts from './contacts';
import Payments from './payments';
import Quotes from './quotes';
import Services from './services';
import ServiceAddons from './service_addons';
import ServiceTiers from './service_tiers';
import Schedules from './schedules';

import Groups from './groups';
import GroupServices from './group_services';
import GroupServiceAddons from './group_service_addons';
import GroupSchedules from './group_schedules';


import { AssistWebhooks } from './assist';
import { AuthWebhooks } from './auth';

export default  {
  webhooks: {
    ...AuthWebhooks,
    ...AssistWebhooks
  },
  protected: [
    // ...Tests,
    ...Files,
    ...Forms,
    ...Profiles,
    ...UuidGroups,
    ...UuidFiles,
    ...UuidNotes,
    ...UuidRoles,
    ...Roles,
    ...Users,
    ...ManageRoles,
    ...ManageGroups,
    ...ManageUsers,
    ...Bookings,
    ...Contacts,
    ...Payments,
    ...Quotes,
    ...Schedules,
    ...Services,
    ...ServiceAddons,
    ...ServiceTiers,
    ...Groups,
    ...GroupServices,
    ...GroupServiceAddons,
    ...GroupSchedules
  ],
  public: [
    ...Public
  ]
}