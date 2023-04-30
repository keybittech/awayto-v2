type ConfirmActionProps = [
  approval?: boolean,
]

/**
 * @category Util
 * @purpose stores UI and general application related properties for use in application user experience enhancing functionalities
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
  error: Error;
  canSubmitAssignments: boolean;
  snackType: 'success' | 'info' | 'warning' | 'error';
  snackOn: string;
  snackRequestId: string;
  perPage: number;
  theme: 'light' | 'dark';
}

type UtilPayload = [
  state: IUtil,
  action: { payload: Partial<IUtil> }
]

export const utilConfig = {
  name: 'util',
  initialState: {
    snackOn: '',
    isLoading: false,
    loadingMessage: '',
    isConfirming: false
  } as IUtil,
  reducers: {
    setTheme: (...[state, { payload: { theme }}]: UtilPayload) => {
      if (theme) {
        state.theme = theme;
      }
    },
    openConfirm: (...[state, { payload: { confirmEffect, confirmSideEffect, confirmAction }}]: UtilPayload) => {
      if (confirmEffect && confirmAction) {
        state.isConfirming = true;
        state.confirmEffect = confirmEffect;
        state.confirmSideEffect = confirmSideEffect;
        state.confirmAction = confirmAction;
      }
    },
    closeConfirm: (...[state]: UtilPayload) => {
      state.isConfirming = false;
    },
    setLoading: (...[state, { payload: { isLoading, loadingMessage }}]: UtilPayload) => {
      state.isLoading = isLoading || !state.isLoading;
      state.loadingMessage = loadingMessage || '';
    },
    setSnack: (...[state, action]: UtilPayload) => {
      state.snackOn = action.payload.snackOn || '';
      state.snackType = action.payload.snackType || 'info';
      state.snackRequestId = action.payload.snackRequestId || '';
    }
  },
};
