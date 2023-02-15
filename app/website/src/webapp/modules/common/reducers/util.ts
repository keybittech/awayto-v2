import { Reducer } from 'redux';
import {
  IUtilActionTypes,
  IUtilState,
  IUtilActions
} from 'awayto';

const kbtTheme = localStorage.getItem('kbt_theme');

const initialUtilState = {
  snackOn: '',
  isLoading: false,
  isConfirming: false,
  hasSignUpCode: false,
  canSubmitAssignments: true,
  theme: kbtTheme != "undefined" && kbtTheme ? kbtTheme : 'dark'
} as IUtilState;

function reduceUtil(state: IUtilState, action: IUtilActions): IUtilState {
  return { ...state, ...action.payload } as IUtilState;
}

const utilReducer: Reducer<IUtilState, IUtilActions> = (state = initialUtilState, action) => {
  switch (action.type) {
    case IUtilActionTypes.SET_THEME:
      const { theme } = action.payload;
      localStorage.setItem('kbt_theme', theme);
      return reduceUtil(state, action);
    case IUtilActionTypes.OPEN_CONFIRM:
    case IUtilActionTypes.CLOSE_CONFIRM:
    case IUtilActionTypes.SET_LOADING:
    case IUtilActionTypes.SET_SNACK:
    case IUtilActionTypes.TEST_API:
    case IUtilActionTypes.API_ERROR:
    case IUtilActionTypes.SET_UPDATE_ASSIGNMENTS:
      return reduceUtil(state, action);
    default:
      return state;
  }
};

export default utilReducer;