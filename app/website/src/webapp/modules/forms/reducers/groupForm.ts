import { Reducer } from 'redux';
import {
  IGroupFormState,
  IGroupFormActions,
  IGroupFormActionTypes,
  IGroupForm
} from 'awayto';

const initialGroupFormState = {
  groupForms: new Map()
} as IGroupFormState;

const groupFormsReducer: Reducer<IGroupFormState, IGroupFormActions> = (state = initialGroupFormState, action) => {
  switch (action.type) {
    case IGroupFormActionTypes.DELETE_GROUP_FORM:
      action.payload.forEach(groupForm => {
        state.groupForms.delete(groupForm.id);
      });
      return state;
    case IGroupFormActionTypes.POST_GROUP_FORM:
    case IGroupFormActionTypes.POST_GROUP_FORM_VERSION:
    case IGroupFormActionTypes.PUT_GROUP_FORM:
    case IGroupFormActionTypes.GET_GROUP_FORM_BY_ID:
    case IGroupFormActionTypes.GET_GROUP_FORMS:
      state.groupForms = new Map([ ...state.groupForms ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IGroupForm][] ));
      return state;
    default:
      return state;
  }
};

export default groupFormsReducer;

export const persist = true;