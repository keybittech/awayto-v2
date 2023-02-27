import React, { useEffect } from 'react';
import { IUserProfileActionTypes, IRoleActionTypes, IGroupActionTypes, IAssistActionTypes } from 'awayto';
import { useApi, useComponents, useRedux } from 'awayto-hooks';

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { POST_ROLES, DELETE_ROLES } = IRoleActionTypes;
const { CHECK_GROUPS_NAME, PUT_GROUPS, POST_GROUPS, DELETE_GROUPS } = IGroupActionTypes;
const { POST_ASSIST } = IAssistActionTypes;

export function GroupsHome (props: IProps): JSX.Element {
  const api = useApi();
  const { ManageGroups } = useComponents()
  const user = useRedux(state => state.profile);

  return <>
    <ManageGroups {...props}
      groups={user.groups}
      roles={user.roles}
      getGroupsAction={GET_USER_PROFILE_DETAILS}
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

export default GroupsHome;