import { Reducer } from 'redux';
import {
  IGroupUserScheduleState,
  IGroupUserScheduleActions,
  IGroupUserScheduleActionTypes,
  IGetGroupUserSchedulesAction,
  IDeleteGroupUserScheduleAction,
  IPostGroupUserScheduleAction,
  IPutGroupUserScheduleAction
} from 'awayto';

const initialGroupUserScheduleState = {
  groupUserSchedules: {}
} as IGroupUserScheduleState;

function reduceDeleteGroupUserSchedule(state: IGroupUserScheduleState, action: IDeleteGroupUserScheduleAction): IGroupUserScheduleState {
  const groupUserSchedules = { ...state.groupUserSchedules };
  action.payload.forEach(groupSchedule => {
    delete groupUserSchedules[groupSchedule.id];
  });
  state.groupUserSchedules = groupUserSchedules;
  return { ...state };
}

function reducePostGroupUserSchedules(state: IGroupUserScheduleState, action: IPostGroupUserScheduleAction | IPutGroupUserScheduleAction): IGroupUserScheduleState {
  const groupUserSchedules = action.payload.reduce((a, b) => ({ ...a, ...{ [b.id]: b } }), {});
  state.groupUserSchedules = { ...state.groupUserSchedules, ...groupUserSchedules };
  return { ...state };
}

function reduceGetGroupUserSchedules(state: IGroupUserScheduleState, action: IGetGroupUserSchedulesAction): IGroupUserScheduleState {
  state.groupUserSchedules = action.payload.reduce((a, b) => ({ ...a, ...{ [b.id]: b } }), {});
  return { ...state };
}

const groupUserSchedulesReducer: Reducer<IGroupUserScheduleState, IGroupUserScheduleActions> = (state = initialGroupUserScheduleState, action) => {
  switch (action.type) {
    case IGroupUserScheduleActionTypes.DELETE_GROUP_USER_SCHEDULE:
      return reduceDeleteGroupUserSchedule(state, action);
    case IGroupUserScheduleActionTypes.POST_GROUP_USER_SCHEDULE:
    case IGroupUserScheduleActionTypes.PUT_GROUP_USER_SCHEDULE:
      return reducePostGroupUserSchedules(state, action);
    case IGroupUserScheduleActionTypes.GET_GROUP_USER_SCHEDULES:
      return reduceGetGroupUserSchedules(state, action);
    default:
      return state;
  }
};

export default groupUserSchedulesReducer;

export const persist = true;