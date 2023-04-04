type ConfirmActionProps = [
  approval?: boolean,
]

/**
 * @category Util
 */
export type IUtil = {
  confirmAction(...props: ConfirmActionProps): void | Promise<void>;
  isConfirming: boolean;
  confirmEffect: string;
  confirmSideEffect?: {
    approvalAction: string;
    approvalEffect: string;
    rejectionAction: string;
    rejectionEffect: string;
  };
  isLoading: boolean;
  loadingMessage: string;
  error: Error | string;
  canSubmitAssignments: boolean;
  snackType: 'success' | 'info' | 'warning' | 'error';
  snackOn: string;
  snackRequestId: string;
  perPage: number;
  theme: 'light' | 'dark';
  test: { objectUrl: string };
}

/**
 * @category Util
 */
export type IUtilState = IUtil;

/**
 * @category Action Types
 */
export enum IUtilActionTypes {
  CLEAR_REDUX = "util/CLEAR_REDUX",
  OPEN_CONFIRM = "util/OPEN_CONFIRM",
  CLOSE_CONFIRM = "util/CLOSE_CONFIRM",
  SET_LOADING = "util/SET_LOADING",
  SET_THEME = "util/SET_THEME",
  SET_SNACK = "util/SET_SNACK",
  TEST_API = "util/TEST_API",
  API_ERROR = "util/API_ERROR",
  API_SUCCESS = "util/API_SUCCESS",
  SET_UPDATE_ASSIGNMENTS = "util/SET_UPDATE_ASSIGNMENTS",
}

export const utilConfig = {
  name: 'util',
  initialState: {
    snackOn: '',
    isLoading: false,
    isConfirming: false,
    canSubmitAssignments: true
  } as IUtilState,
  reducers: {
    setTheme: (state: IUtilState, action: { payload: { theme: 'dark' | 'light' } }) => {
      const { theme } = action.payload;
      localStorage.setItem('kbt_theme', theme);
      state.theme = theme;
    },
    openConfirm: (state: IUtilState) => {
      state.isConfirming = true;
    },
    closeConfirm: (state: IUtilState) => {
      state.isConfirming = false;
    },
    setLoading: (state: IUtilState, action: { payload: { isLoading: boolean } }) => {
      state.isLoading = action.payload.isLoading;
    },
    setSnack: (state: IUtilState, action: { payload: { snackOn: string, snackType?: 'success' | 'info' | 'warning' | 'error', snackRequestId?: string } }) => {
      state.snackOn = action.payload.snackOn;
      state.snackType = action.payload.snackType || 'info';
      state.snackRequestId = action.payload.snackRequestId || '';
    },
    apiError: (state: IUtilState, action: { payload: { error: Error } }) => {
      state.snackOn = action.payload.error.message;
    },
    setUpdateAssignments: (state: IUtilState, action: { payload: { canSubmitAssignments: boolean } }) => {
      state.canSubmitAssignments = action.payload.canSubmitAssignments;
    },
  },
} as const;

declare module '.' {
  export interface AppState {
    util: IUtilState;
  }
}