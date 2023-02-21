import { Reducer } from 'redux';
import {
  IFilesState,
  IFilesActions,
  IFilesActionTypes,
  IGetFilesByIdAction,
  IGetFilesAction,
  IDeleteFilesAction,
  IDisableFilesAction,
  IPostFilesAction,
  IPutFilesAction
} from 'awayto';

const initialFilesState = {
  files: {}
} as IFilesState;

function reduceDeleteFiles(state: IFilesState, action: IDeleteFilesAction): IFilesState {
  const files = { ...state.files };
  action.payload.forEach(file => {
    delete files[file.id];
  });
  state.files = files;
  return { ...state };
}

function reduceFiles(state: IFilesState, action: IGetFilesAction | IDisableFilesAction | IGetFilesByIdAction | IPostFilesAction | IPutFilesAction): IFilesState {
  const files = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.files = { ...state.files, ...files };
  return { ...state };
}

const fileReducer: Reducer<IFilesState, IFilesActions> = (state = initialFilesState, action) => {
  switch (action.type) {
    case IFilesActionTypes.DELETE_FILES:
      return reduceDeleteFiles(state, action);
    case IFilesActionTypes.PUT_FILES:
    case IFilesActionTypes.GET_FILES_BY_ID:
    case IFilesActionTypes.POST_FILES:
    case IFilesActionTypes.DISABLE_FILES:
    case IFilesActionTypes.GET_FILES:
      return reduceFiles(state, action);
    default:
      return state;
  }
};

export default fileReducer;