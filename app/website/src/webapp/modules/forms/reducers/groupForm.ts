import { Reducer } from 'redux';
import {
  IGroupFormState,
  IGroupFormActions,
  IGroupFormActionTypes,
  IGetGroupFormsAction,
  IGetGroupFormByIdAction,
  IDeleteGroupFormAction,
  IPostGroupFormAction,
  IPostGroupFormVersionAction,
  IPutGroupFormAction
} from 'awayto';

const initialGroupFormState = {
  groupForms: {}
} as IGroupFormState;

function reduceDeleteGroupForm(state: IGroupFormState, action: IDeleteGroupFormAction): IGroupFormState {
  const groupForms = { ...state.groupForms };
  action.payload.forEach(groupForm => {
    delete groupForms[groupForm.id];
  });
  state.groupForms = groupForms;
  return { ...state };
}

function reducePostGroupForms(state: IGroupFormState, action: IPostGroupFormAction | IPostGroupFormVersionAction | IGetGroupFormByIdAction | IPutGroupFormAction): IGroupFormState {
  const groupForms = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.groupForms = { ...state.groupForms, ...groupForms };
  return { ...state };
}

function reduceGetGroupForms(state: IGroupFormState, action: IGetGroupFormsAction): IGroupFormState {
  state.groupForms = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  return { ...state };
}

const groupFormsReducer: Reducer<IGroupFormState, IGroupFormActions> = (state = initialGroupFormState, action) => {
  switch (action.type) {
    case IGroupFormActionTypes.DELETE_GROUP_FORM:
      return reduceDeleteGroupForm(state, action);
    case IGroupFormActionTypes.POST_GROUP_FORM:
    case IGroupFormActionTypes.POST_GROUP_FORM_VERSION:
    case IGroupFormActionTypes.PUT_GROUP_FORM:
    case IGroupFormActionTypes.GET_GROUP_FORM_BY_ID:
      return reducePostGroupForms(state, action);
    case IGroupFormActionTypes.GET_GROUP_FORMS:
      return reduceGetGroupForms(state, action);
    default:
      return state;
  }
};

export default groupFormsReducer;

export const persist = true;