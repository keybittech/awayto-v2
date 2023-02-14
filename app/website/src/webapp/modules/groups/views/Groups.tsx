import React from 'react';
import { IUserProfileActionTypes, IRoleActionTypes, IGroupActionTypes } from 'awayto';
import { useComponents, useRedux } from 'awayto-hooks';

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { POST_ROLES, DELETE_ROLES } = IRoleActionTypes;
const { CHECK_GROUPS_NAME, PUT_GROUPS, POST_GROUPS, GET_GROUPS, DELETE_GROUPS } = IGroupActionTypes;

export function Groups (props: IProps): JSX.Element {
  
  const { ManageGroups } = useComponents()
  const user = useRedux(state => state.profile);

  return <>
    {/* {groups.map(g => <Button key={`group_selection_${g.name}`} onClick={() => navigate(`/group/${g.name}/manage/users`)} > Manage Group</Button>)} */}
    <ManageGroups {...props}
      groups={user.groups}
      roles={user.roles}
      getGroupsAction={GET_GROUPS}
      deleteGroupsAction={DELETE_GROUPS}
      putGroupsAction={PUT_GROUPS}
      postGroupsAction={POST_GROUPS}
      checkNameAction={CHECK_GROUPS_NAME}
      getRolesAction={GET_USER_PROFILE_DETAILS}
      deleteRolesAction={DELETE_ROLES}
      postRolesAction={POST_ROLES}
    />
  </>
}

export default Groups;