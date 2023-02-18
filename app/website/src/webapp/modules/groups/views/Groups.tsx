import React, { useEffect } from 'react';
import { IUserProfileActionTypes, IRoleActionTypes, IGroupActionTypes, IAssistActionTypes } from 'awayto';
import { useApi, useComponents, useRedux } from 'awayto-hooks';

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { POST_ROLES, DELETE_ROLES } = IRoleActionTypes;
const { CHECK_GROUPS_NAME, PUT_GROUPS, POST_GROUPS, DELETE_GROUPS } = IGroupActionTypes;
const { POST_ASSIST } = IAssistActionTypes;

export function Groups (props: IProps): JSX.Element {
  const api = useApi();
  const { ManageGroups } = useComponents()
  const user = useRedux(state => state.profile);

  useEffect(() => {

    
    const [abort, res] = api(POST_ASSIST, true, { message: 'What are the important things to review while examining the response from the first time I use the openai davinci 003 model using the openai npm package?'});
    res?.then(data => {
      console.log(data);
    });

    return () => abort();
  }, [])

  return <>
    {/* {groups.map(g => <Button key={`group_selection_${g.name}`} onClick={() => navigate(`/group/${g.name}/manage/users`)} > Manage Group</Button>)} */}
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

export default Groups;