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

const initialFilesState: IFilesState = {};

function reduceDeleteFiles(state: IFilesState, action: IDeleteFilesAction): IFilesState {
  action.payload.forEach(file => {
    delete state[file.id as string];
  });
  return { ...state };
}

function reduceFile(state: IFilesState, action: IGetFilesByIdAction | IPutFilesAction): IFilesState {
  const { id } = action.payload;
  if (id) {
    state[id] = action.payload;
  }
  return { ...state };
}

function reduceFiles(state: IFilesState, action: IGetFilesAction | IPostFilesAction | IDisableFilesAction): IFilesState {
  for (let i = 0, v = action.payload.length; i < v; i++) {
    const file = action.payload[i];
    const { id } = file;
    if (id) {
      state[id] = file;
    }
  }
  return { ...state };
}

const fileReducer: Reducer<IFilesState, IFilesActions> = (state = initialFilesState, action) => {
  switch (action.type) {
    case IFilesActionTypes.DELETE_FILES:
      return reduceDeleteFiles(state, action);
    case IFilesActionTypes.PUT_FILES:
    case IFilesActionTypes.GET_FILES_BY_ID:
      return reduceFile(state, action);
    case IFilesActionTypes.POST_FILES:
    case IFilesActionTypes.DISABLE_FILES:
    case IFilesActionTypes.GET_FILES:
      return reduceFiles(state, action);
    default:
      return state;
  }
};

export default fileReducer;