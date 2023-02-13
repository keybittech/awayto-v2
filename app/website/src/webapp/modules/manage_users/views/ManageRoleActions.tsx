import React, { useEffect, useMemo } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import Checkbox from '@mui/material/Checkbox';

import { IRoles, IActionTypes } from 'awayto';
import { useApi, useRedux } from 'awayto-hooks';

export type ManageUsersProps = {
  getRolesAction?: IActionTypes;
  roles?: IRoles;
};

declare global {
  interface IProps extends ManageUsersProps { }
}

export function ManageRoleActions ({ getRolesAction }: IProps & Required<ManageUsersProps>): JSX.Element {

  const api = useApi();
  const util = useRedux(state => state.util);
  const { roles } = useRedux(state => state.profile);

  const options = useMemo(
    () =>
      ['TURN_OFF', 'TURN_ON', 'SOME_OPTIONS_ARE_LONG', 'AND_THERE_ARE_A_LOT_OF_OPTIONS', 'SOME_OPTIONS_ARE_LONG', 'AND_THERE_ARE_A_LOT_OF_OPTIONS', 'TURN_ON', 'SOME_OPTIONS_ARE_LONG']
      .map(name => ({ name })) as {name: string}[]
    , undefined);

  const columns = useMemo(() => [
    { name: '', selector: row => row.name },
    ...Object.values(roles).reduce((memo, { name }) => {
      memo.push({ name, cell: ({  }) => <Checkbox /> }); // TODO Need to take action here to create groupRoleActions
      return memo;
    }, [] as TableColumn<{ name: string }>[])
  ], [roles])

  useEffect(() => {
    const [abort] = api(getRolesAction, true);
    return () => abort();
  }, []);

  return <>
    <DataTable
      title="Action-Role Matrix"
      data={options}
      theme={util.theme}
      columns={columns}
      // customStyles={{
      //   headCells: {
      //     style: {
      //       writingMode: 'vertical-rl',
      //       transform: 'rotate(225deg)'
      //     }
      //   }
      // }}
    />
  </>
}

export default ManageRoleActions;