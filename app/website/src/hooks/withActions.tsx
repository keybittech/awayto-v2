// import { useEffect, useMemo, useRef, useState } from 'react';
// import { ActionCreatorWithoutPayload, ActionCreatorWithPayload } from '@reduxjs/toolkit';
// import { getModuleNameByActionType, IActions, IActionTypes } from 'awayto/core';
// import { LoadedDispatchableSliceActions, LoadedDispatchableApiEndpointActions } from '.';
// import { useDispatch } from 'react-redux';

// export interface WithActionsProps {
//   sliceActions: LoadedDispatchableSliceActions[],
//   apiActions: string[]
// }

// type withActionsProps = {
//   sliceActionTypes?: IActionTypes[],
//   apiActionTypes?: IActionTypes[]
// }

// export const withActions = ({ sliceActionTypes = [], apiActionTypes = [] }: withActionsProps) => (
//   WrappedComponent: (props: WithActionsProps) => JSX.Element
// ) => {
//   function WithActions(props: Partial<WithActionsProps>): JSX.Element {
//     const dispatch = useNewDispatch();
    
//     const sliceActions = useSliceActions(sliceActionTypes, dispatch);
//     const apiActions = useAPIActions(apiActionTypes, dispatch);
//     const sliceReadyRef = useRef(false);
//     const apiReadyRef = useRef(false);
//     const counter = useRef(1);

//     console.log({ turn: counter.current, sliceActionTypes, sliceActions, apiActionTypes, apiActions })

//     if (sliceActionTypes.length === sliceActions.length && !sliceReadyRef.current) {
//       console.log('slice actions are ready on turn', counter.current, sliceActions);
//       sliceReadyRef.current = true;
//     }

//     if (apiActionTypes.length === apiActions.length && !apiReadyRef.current) {
//       console.log('api actions are ready on turn', counter.current, apiActions);
//       apiReadyRef.current = true;
//     }

//     counter.current++;

//     if (false === sliceReadyRef.current || false === apiReadyRef.current) return <>Loading...</>;

//     return <WrappedComponent {...props} apiActions={apiActions} sliceActions={sliceActions} />;
//   }

//   return WithActions;
// };

export default {};