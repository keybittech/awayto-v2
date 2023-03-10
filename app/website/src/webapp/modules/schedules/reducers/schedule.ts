import { Reducer } from 'redux';
import {
  IScheduleState,
  IScheduleActions,
  IScheduleActionTypes,
  ISchedule
} from 'awayto';

const initialScheduleState = {
  schedules: new Map()
} as IScheduleState;

const scheduleReducer: Reducer<IScheduleState, IScheduleActions> = (state = initialScheduleState, action) => {
  switch (action.type) {
    case IScheduleActionTypes.DISABLE_SCHEDULE:
    case IScheduleActionTypes.DELETE_SCHEDULE:
      action.payload.forEach(serviceAddon => {
        state.schedules.delete(serviceAddon.id);
      });
      return state;
    case IScheduleActionTypes.PUT_SCHEDULE:
    case IScheduleActionTypes.POST_SCHEDULE:
    case IScheduleActionTypes.GET_SCHEDULE_BY_ID:
    case IScheduleActionTypes.GET_SCHEDULES:
      state.schedules = new Map([ ...state.schedules ].concat( action.payload.map(q => [q.id, q]) as readonly [string, ISchedule][] ));
      return state;
    default:
      return state;
  }
};

export default scheduleReducer;

export const persist = true;