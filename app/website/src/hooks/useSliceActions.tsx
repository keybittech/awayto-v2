import { useEffect, useMemo, useRef, useState } from 'react';
import { getModuleNameByActionType, IActionTypes } from 'awayto/core';
import { LoadedDispatchableSliceActions, LoadedSlices, loadedSlices, loadSlice, loadSliceRequests } from '.';
import { Dispatch } from 'redux';

export function useSliceActions(actionTypes: IActionTypes[], dispatch: Dispatch): LoadedDispatchableSliceActions[] {
  const [dispatches, setDispatches] = useState<LoadedDispatchableSliceActions[]>([]);
  const sliceActionLoadRef = useRef(true);

  useEffect(() => {
    if (!dispatches.length && sliceActionLoadRef.current) {
      console.log('request to load slices', actionTypes)
      sliceActionLoadRef.current = false;
      async function go() {
        console.log('slice going')
        if (actionTypes && actionTypes.length) {
          const newDispatches: LoadedDispatchableSliceActions[] = [];
          for (const actionType of actionTypes) {
            const { name: moduleName } = getModuleNameByActionType(actionType);
            if (!loadSliceRequests.includes(moduleName)) {
              loadSliceRequests.push(moduleName);
              await loadSlice(moduleName);
            }
            newDispatches.push((...params) => dispatch(loadedSlices[moduleName].actions[actionType](params)));
          }
          setDispatches(newDispatches);
        }
      }
      void go();
    }
  }, [dispatches]);

  return useMemo(() => {
    console.log('restting slice dispatches', dispatches);
    return dispatches;
  }, [dispatches]);
}