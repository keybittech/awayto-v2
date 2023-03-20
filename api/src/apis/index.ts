// import Tests from './tests';
import Public from './public';
import Lookups from './lookups';
import Files from './files';
import Forms from './forms';
import Profiles from './profiles';
import UuidFiles from './uuid_files';
import UuidNotes from './uuid_notes';
import Roles from './roles';
import ManageRoles from './manage_roles';
import ManageGroups from './manage_groups';
import Users from './users';
import ManageUsers from './manage_users';

import Bookings from './bookings';
import BookingTranscripts from './booking_transcripts';
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
import GroupUserSchedules from './group_user_schedules';
import GroupUsers from './group_users';
import GroupForms from './group_forms';
import GroupFeedbacks from './group_feedbacks';
import GroupRoles from './group_roles';

import Assist from './assist';


export default  {
  protected: [
    // ...Tests,
    ...Assist,
    ...Files,
    ...Forms,
    ...Lookups,
    ...Profiles,
    ...UuidFiles,
    ...UuidNotes,
    ...Roles,
    ...Users,
    ...ManageRoles,
    ...ManageGroups,
    ...ManageUsers,
    ...Bookings,
    ...BookingTranscripts,
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
    ...GroupSchedules,
    ...GroupUserSchedules,
    ...GroupUsers,
    ...GroupForms,
    ...GroupFeedbacks,
    ...GroupRoles
  ],
  public: [
    ...Public
  ]
}