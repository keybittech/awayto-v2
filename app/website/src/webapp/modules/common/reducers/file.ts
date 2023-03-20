import { Reducer } from 'redux';
import {
  IFileState,
  IFileActions,
  IFileActionTypes,
  IFile,
  getMapFromArray
} from 'awayto';

const initialFileState = {
  files: new Map()
} as IFileState;

const fileReducer: Reducer<IFileState, IFileActions> = (state = initialFileState, action) => {
  switch (action.type) {
    case IFileActionTypes.DELETE_FILE:
      action.payload.forEach(file => {
        state.files.delete(file.id);
      });
      return state;
    case IFileActionTypes.PUT_FILE:
    case IFileActionTypes.GET_FILE_BY_ID:
    case IFileActionTypes.POST_FILE:
    case IFileActionTypes.DISABLE_FILE:
    case IFileActionTypes.GET_FILES:
      state.files = getMapFromArray<IFile>(state.files, action.payload);
      return state;
    default:
      return state;
  }
};

export default fileReducer;