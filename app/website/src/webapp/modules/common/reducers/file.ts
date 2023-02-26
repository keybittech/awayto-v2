import { Reducer } from 'redux';
import {
  IFileState,
  IFileActions,
  IFileActionTypes,
  IGetFileByIdAction,
  IGetFilesAction,
  IDeleteFileAction,
  IDisableFileAction,
  IPostFileAction,
  IPutFileAction
} from 'awayto';

const initialFileState = {
  files: {}
} as IFileState;

function reduceDeleteFile(state: IFileState, action: IDeleteFileAction): IFileState {
  const files = { ...state.files };
  action.payload.forEach(file => {
    delete files[file.id];
  });
  state.files = files;
  return { ...state };
}

function reduceFile(state: IFileState, action: IGetFilesAction | IDisableFileAction | IGetFileByIdAction | IPostFileAction | IPutFileAction): IFileState {
  const files = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.files = { ...state.files, ...files };
  return { ...state };
}

const fileReducer: Reducer<IFileState, IFileActions> = (state = initialFileState, action) => {
  switch (action.type) {
    case IFileActionTypes.DELETE_FILE:
      return reduceDeleteFile(state, action);
    case IFileActionTypes.PUT_FILE:
    case IFileActionTypes.GET_FILE_BY_ID:
    case IFileActionTypes.POST_FILE:
    case IFileActionTypes.DISABLE_FILE:
    case IFileActionTypes.GET_FILES:
      return reduceFile(state, action);
    default:
      return state;
  }
};

export default fileReducer;