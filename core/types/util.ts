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

export const utilConfig = {
  name: 'util',
  initialState: {
    snackOn: '',
    isLoading: false,
    isConfirming: false,
    canSubmitAssignments: true
  } as IUtil,
  reducers: {
    setTheme: (state: IUtil, action: { payload: { theme: 'dark' | 'light' } }) => {
      const { theme } = action.payload;
      localStorage.setItem('kbt_theme', theme);
      state.theme = theme;
    },
    openConfirm: (state: IUtil) => {
      state.isConfirming = true;
    },
    closeConfirm: (state: IUtil) => {
      state.isConfirming = false;
    },
    setLoading: (state: IUtil, action: { payload: { isLoading: boolean } }) => {
      state.isLoading = action.payload.isLoading;
    },
    setSnack: (state: IUtil, action: { payload: { snackOn: string, snackType?: 'success' | 'info' | 'warning' | 'error', snackRequestId?: string } }) => {
      state.snackOn = action.payload.snackOn;
      state.snackType = action.payload.snackType || 'info';
      state.snackRequestId = action.payload.snackRequestId || '';
    },
    apiError: (state: IUtil, action: { payload: { error: Error } }) => {
      state.snackOn = action.payload.error.message;
    },
    setUpdateAssignments: (state: IUtil, action: { payload: { canSubmitAssignments: boolean } }) => {
      state.canSubmitAssignments = action.payload.canSubmitAssignments;
    },
  },
} as const;
