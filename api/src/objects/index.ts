import Tests from './tests';
import Public from './public';
import Files from './files';
import Users from './users';
import UuidGroups from './uuid_groups';
import UuidFiles from './uuid_files';
import UuidNotes from './uuid_notes';
import UuidRoles from './uuid_roles';
import ManageRoles from './manage_roles';
import ManageGroups from './manage_groups';
import ManageUsers from './manage_users';

export default  {
  protected: [
    ...Tests,
    ...Files,
    ...Users,
    ...UuidGroups,
    ...UuidFiles,
    ...UuidNotes,
    ...UuidRoles,
    ...ManageRoles,
    ...ManageGroups,
    ...ManageUsers
  ],
  public: [
    ...Public
  ]
}