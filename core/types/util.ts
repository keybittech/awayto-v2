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
  error: Error;
  canSubmitAssignments: boolean;
  snackType: 'success' | 'info' | 'warning' | 'error';
  snackOn: string;
  snackRequestId: string;
  perPage: number;
  theme: 'light' | 'dark';
}

export const utilConfig = {
  name: 'util',
  initialState: {
    snackOn: '',
    isLoading: false,
    loadingMessage: '',
    isConfirming: false,
    canSubmitAssignments: true
  } as IUtil,
  reducers: {
    setTheme: (state: IUtil, action: { payload: Pick<IUtil, 'theme'> }) => {
      const { theme } = action.payload;
      localStorage.setItem('kbt_theme', theme);
      state.theme = theme;
    },
    openConfirm: (state: IUtil, action: { payload: Pick<IUtil, 'isConfirming' | 'confirmEffect' | 'confirmAction'> }) => {
      state.isConfirming = true;
      state.confirmEffect = action.payload.confirmEffect;
      state.confirmAction = action.payload.confirmAction;
    },
    closeConfirm: (state: IUtil) => {
      state.isConfirming = false;
    },
    setLoading: (state: IUtil, action: { payload: Pick<IUtil, 'isLoading' | 'loadingMessage'> }) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.loadingMessage;
    },
    setSnack: (state: IUtil, action: { payload: Pick<IUtil, 'snackOn' | 'snackType' | 'snackRequestId'> }) => {
      state.snackOn = action.payload.snackOn;
      state.snackType = action.payload.snackType || 'info';
      state.snackRequestId = action.payload.snackRequestId || '';
    },
    apiError: (state: IUtil, action: { payload: Pick<IUtil, 'error'> }) => {
      state.snackOn = action.payload.error.message;
    },
    setUpdateAssignments: (state: IUtil, action: { payload: Pick<IUtil, 'canSubmitAssignments'> }) => {
      state.canSubmitAssignments = action.payload.canSubmitAssignments;
    },
  },
} as const;
