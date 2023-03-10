import { Reducer } from 'redux';
import {
  IGroupUserScheduleState,
  IGroupUserScheduleActions,
  IGroupUserScheduleActionTypes,
  IGetGroupUserSchedulesAction,
  IDeleteGroupUserScheduleAction,
  IPostGroupUserScheduleAction,
  IPutGroupUserScheduleAction,
  IGroupUserSchedule
} from 'awayto';

const initialGroupUserScheduleState = {
  groupUserSchedules: new Map()
} as IGroupUserScheduleState;

const groupUserSchedulesReducer: Reducer<IGroupUserScheduleState, IGroupUserScheduleActions> = (state = initialGroupUserScheduleState, action) => {
  switch (action.type) {
    case IGroupUserScheduleActionTypes.DELETE_GROUP_USER_SCHEDULE_BY_USER_SCHEDULE_ID:
      action.payload.forEach(groupSchedule => {
        state.groupUserSchedules.delete(groupSchedule.id);
      });
      return state;
    case IGroupUserScheduleActionTypes.POST_GROUP_USER_SCHEDULE:
    case IGroupUserScheduleActionTypes.PUT_GROUP_USER_SCHEDULE:
    case IGroupUserScheduleActionTypes.GET_GROUP_USER_SCHEDULES:
      state.groupUserSchedules = new Map([ ...state.groupUserSchedules ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IGroupUserSchedule][] ));
      return state;
    default:
      return state;
  }
};

export default groupUserSchedulesReducer;

export const persist = true;