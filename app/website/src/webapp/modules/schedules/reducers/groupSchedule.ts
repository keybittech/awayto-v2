import { Reducer } from 'redux';
import {
  IGroupScheduleState,
  IGroupScheduleActions,
  IGroupScheduleActionTypes,
  IGroupSchedule
} from 'awayto';

const initialGroupScheduleState = {
  groupSchedules: new Map()
} as IGroupScheduleState;

const groupSchedulesReducer: Reducer<IGroupScheduleState, IGroupScheduleActions> = (state = initialGroupScheduleState, action) => {
  switch (action.type) {
    case IGroupScheduleActionTypes.DELETE_GROUP_SCHEDULE:
      action.payload.forEach(groupSchedule => {
        state. groupSchedules.delete(groupSchedule.id);
      });
      return state;
    case IGroupScheduleActionTypes.POST_GROUP_SCHEDULE:
    case IGroupScheduleActionTypes.PUT_GROUP_SCHEDULE:
    case IGroupScheduleActionTypes.GET_GROUP_SCHEDULE_MASTER_BY_ID:
    case IGroupScheduleActionTypes.GET_GROUP_SCHEDULES:
      state.groupSchedules = new Map([ ...state.groupSchedules ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IGroupSchedule][] ));
      return state;
    default:
      return state;
  }
};

export default groupSchedulesReducer;

export const persist = true;