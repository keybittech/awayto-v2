import { PayloadAction } from '.';
import { Merge } from '../util';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState {
    util: IUtilState,
    uuidFiles: IUuidFilesState;
    file: IFileState;
  }

  interface IMergedState extends Merge<Merge<Merge<Merge<unknown, IFileState>, IUuidFilesState>, IUtilState>, IUuidNotesState> {}

  /**
   * @category Awayto Redux
   */
  type ICommonModuleActions = IUtilActions | IUuidNotesActions | IUuidFilesActions | IFileActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    util: IUtilActionTypes;
    uuidNotes: IUuidNotesActionTypes;
    uuidFiles: IUuidFilesActionTypes;
    file: IFileActionTypes;
  }
}

type ConfirmActionProps = [
  approval?: boolean,
]

/**
 * @category Awayto
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
  hasSignUpCode: boolean;
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


/**
 * @category Util
 */
export type IUtilLoadingActionPayload = { isLoading: boolean };

/**
 * @category Util
 */
export type IApiErrorActionPayload = { error: string }

/**
 * @category Util
 */
export type ISetThemeActionPayload = { theme: string }

/**
 * @category Util
 */
export type IClearReduxAction = PayloadAction<IUtilActionTypes.CLEAR_REDUX, null>;

/**
 * @category Util
 */
export type IOpenConfirmAction = PayloadAction<IUtilActionTypes.OPEN_CONFIRM, { isConfirming: boolean, message: string, action: Promise<void> }>;

/**
 * @category Util
 */
export type ICloseConfirmAction = PayloadAction<IUtilActionTypes.CLOSE_CONFIRM, { isConfirming: boolean, message: string }>;

/**
 * @category Util
 */
export type ISetLoadingAction = PayloadAction<IUtilActionTypes.SET_LOADING, IUtilLoadingActionPayload>;

/**
 * @category Util
 */
export type ISetThemeAction = PayloadAction<IUtilActionTypes.SET_THEME, ISetThemeActionPayload>;

/**
 * @category Util
 */
export type ISetSnackAction = PayloadAction<IUtilActionTypes.SET_SNACK, { snackType: string, snackOn: string }>;

/**
 * @category Util
 */
export type ITestApiAction = PayloadAction<IUtilActionTypes.TEST_API, { test: { objectUrl?: Record<string, string> | string } }>;

/**
 * @category Util
 */
export type IApiErrorAction = PayloadAction<IUtilActionTypes.API_ERROR, IApiErrorActionPayload>;

/**
 * @category Util
 */
export type IApiSuccessAction = PayloadAction<IUtilActionTypes.API_SUCCESS, void>;

/**
 * @category Util
 */
export type ISetUpdateAssignmentsAction = PayloadAction<IUtilActionTypes.SET_UPDATE_ASSIGNMENTS, { canSubmitAssignments: boolean }>;

/**
 * @category Util
 */
export type IUtilActions = IClearReduxAction
  | IOpenConfirmAction
  | ICloseConfirmAction
  | ISetLoadingAction
  | ISetThemeAction
  | ISetSnackAction
  | ITestApiAction
  | IApiErrorAction
  | ISetUpdateAssignmentsAction;



/**
 * @category Awayto
 */
export type IUuidNotes = {
  id: string;
  parentUuid: string;
  note: string;
}

/**
 * @category Uuid Notes
 */
export type IUuidNotesState = IUuidNotes & {
  notes: Record<string, IUuidNotes>;
};

/**
 * @category Action Types
 */
export enum IUuidNotesActionTypes {
  POST_UUID_NOTES = "POST/uuid_notes",
  PUT_UUID_NOTES = "PUT/uuid_notes",
  GET_UUID_NOTES = "GET/uuid_notes",
  GET_UUID_NOTES_BY_ID = "GET/uuid_notes/:id",
  DELETE_UUID_NOTES = "DELETE/uuid_notes/:id",
  DISABLE_UUID_NOTES = "PUT/uuid_notes/disable"
}

/**
 * @category Uuid Notes
 */
export type IPostUuidNotesAction = PayloadAction<IUuidNotesActionTypes.POST_UUID_NOTES, IUuidNotes[]>;

/**
 * @category Uuid Notes
 */
export type IPutUuidNotesAction = PayloadAction<IUuidNotesActionTypes.PUT_UUID_NOTES, IUuidNotes[]>;

/**
 * @category Uuid Notes
 */
export type IGetUuidNotesAction = PayloadAction<IUuidNotesActionTypes.GET_UUID_NOTES, IUuidNotes[]>;

/**
 * @category Uuid Notes
 */
export type IGetUuidNotesByIdAction = PayloadAction<IUuidNotesActionTypes.GET_UUID_NOTES_BY_ID, IUuidNotes[]>;

/**
 * @category Uuid Notes
 */
export type IDeleteUuidNotesAction = PayloadAction<IUuidNotesActionTypes.DELETE_UUID_NOTES, IUuidNotes[]>;

/**
 * @category Uuid Notes
 */
export type IDisableUuidNotesAction = PayloadAction<IUuidNotesActionTypes.DISABLE_UUID_NOTES, IUuidNotes[]>;

/**
 * @category Uuid Notes
 */
export type IUuidNotesActions = IPostUuidNotesAction
  | IPutUuidNotesAction
  | IGetUuidNotesAction
  | IGetUuidNotesByIdAction
  | IDeleteUuidNotesAction
  | IDisableUuidNotesAction;


/**
 * @category Awayto
 */
export type IUuidFiles = {
  id: string;
  parentUuid: string;
  fileId: string;
}

/**
 * @category Uuid Files
 */
export type IUuidFilesState = IUuidFiles & {
  uuidFiles: Record<string, IUuidFiles>;
};

/**
 * @category Action Types
 */
export enum IUuidFilesActionTypes {
  POST_UUID_FILES = "POST/uuid_files",
  PUT_UUID_FILES = "PUT/uuid_files",
  GET_UUID_FILES = "GET/uuid_files",
  GET_UUID_FILES_BY_ID = "GET/uuid_files/:id",
  DELETE_UUID_FILES = "DELETE/uuid_files/:id",
  DISABLE_UUID_FILES = "PUT/uuid_files/disable"
}

/**
 * @category Uuid Files
 */
export type IPostUuidFilesAction = PayloadAction<IUuidFilesActionTypes.POST_UUID_FILES, IUuidFilesState>;

/**
 * @category Uuid Files
 */
export type IPutUuidFilesAction = PayloadAction<IUuidFilesActionTypes.PUT_UUID_FILES, IUuidFilesState>;

/**
 * @category Uuid Files
 */
export type IGetUuidFilesAction = PayloadAction<IUuidFilesActionTypes.GET_UUID_FILES, IUuidFilesState>;

/**
 * @category Uuid Files
 */
export type IGetUuidFilesByIdAction = PayloadAction<IUuidFilesActionTypes.GET_UUID_FILES_BY_ID, IUuidFilesState>;

/**
 * @category Uuid Files
 */
export type IDeleteUuidFilesAction = PayloadAction<IUuidFilesActionTypes.DELETE_UUID_FILES, IUuidFilesState>;

/**
 * @category Uuid Files
 */
export type IDisableUuidFilesAction = PayloadAction<IUuidFilesActionTypes.DISABLE_UUID_FILES, IUuidFilesState>;

/**
 * @category Uuid Files
 */
export type IUuidFilesActions = IPostUuidFilesAction
  | IPutUuidFilesAction
  | IGetUuidFilesAction
  | IGetUuidFilesByIdAction
  | IDeleteUuidFilesAction
  | IDisableUuidFilesAction;



/**
 * @category File
 */
export type IFileType = {
  id: string;
  name: string;
}

/**
 * @category File
 */
export type IFile = {
  id: string;
  fileTypeId: string;
  fileTypeName: string;
  name: string;
  location: string;
}

/**
 * @category File
 */
export type IFileState = IFile & {
  files: Record<string, IFile>
};

/**
 * @category Action Types
 */
export enum IFileActionTypes {
  POST_FILE = "POST/files",
  PUT_FILE = "PUT/files",
  GET_FILES = "GET/files",
  GET_FILE_BY_ID = "GET/files/:id",
  DELETE_FILE = "PUT/files/delete",
  DISABLE_FILE = "PUT/files/disable"
}

/**
 * @category File
 */
export type IPostFileAction = PayloadAction<IFileActionTypes.POST_FILE, IFile[]>;
export type IPutFileAction = PayloadAction<IFileActionTypes.PUT_FILE, IFile[]>;
export type IGetFilesAction = PayloadAction<IFileActionTypes.GET_FILES, IFile[]>;
export type IGetFileByIdAction = PayloadAction<IFileActionTypes.GET_FILE_BY_ID, IFile[]>;
export type IDeleteFileAction = PayloadAction<IFileActionTypes.DELETE_FILE, IFile[]>;
export type IDisableFileAction = PayloadAction<IFileActionTypes.DISABLE_FILE, IFile[]>;

/**
 * @category File
 */
export type IFileActions = IPostFileAction
  | IPutFileAction
  | IGetFilesAction
  | IGetFileByIdAction
  | IDeleteFileAction
  | IDisableFileAction;