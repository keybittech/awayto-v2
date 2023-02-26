import { Reducer } from 'redux';
import {
  IFormState,
  IFormActions,
  IFormActionTypes,
  IGetFormByIdAction,
  IGetFormsAction,
  IDeleteFormAction,
  IDisableFormAction,
  IPostFormAction,
  IPutFormAction
} from 'awayto';

const initialFormState = {
  forms: {}
} as IFormState;

function reduceDeleteForm(state: IFormState, action: IDeleteFormAction): IFormState {
  const forms = { ...state.forms };
  action.payload.forEach(form => {
    delete forms[form.id];
  });
  state.forms = forms;
  return { ...state };
}

function reduceForm(state: IFormState, action: IGetFormsAction | IDisableFormAction | IGetFormByIdAction | IPostFormAction | IPutFormAction): IFormState {
  const forms = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.forms = { ...state.forms, ...forms };
  return { ...state };
}

const formReducer: Reducer<IFormState, IFormActions> = (state = initialFormState, action) => {
  switch (action.type) {
    case IFormActionTypes.DELETE_FORM:
      return reduceDeleteForm(state, action);
    case IFormActionTypes.PUT_FORM:
    case IFormActionTypes.GET_FORM_BY_ID:
    case IFormActionTypes.POST_FORM:
    case IFormActionTypes.DISABLE_FORM:
    case IFormActionTypes.GET_FORMS:
      return reduceForm(state, action);
    default:
      return state;
  }
};

export default formReducer;