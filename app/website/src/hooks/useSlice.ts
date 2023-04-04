import { createSlice } from '@reduxjs/toolkit';
import { getModuleNameByActionType, IActionTypes } from 'awayto/core';
import { useEffect, useState } from 'react';
import { LoadedSlices, loadedSlices, loadSlice } from '.';

export function useSlice <T extends keyof LoadedSlices>(moduleName: T): LoadedSlices[T] {
  const [slice, setSlice] = useState<ReturnType<typeof createSlice>>(loadedSlices[moduleName])
  useEffect(() => {
    async function go() {
      if (!loadedSlices[moduleName]) {
        await loadSlice(moduleName);
      }
      setSlice(loadedSlices[moduleName])
    }
    void go();
  }, [moduleName]);

  return slice as LoadedSlices[T];
}