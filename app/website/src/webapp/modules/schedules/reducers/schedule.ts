import { Reducer } from 'redux';
import {
  IScheduleState,
  IScheduleActions,
  IScheduleActionTypes,
  ISchedule,
  IScheduleBracket,
  IScheduleBracketSlot,
  IService
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
      state.schedules = new Map([ ...state.schedules ]
        .concat( action.payload.map(sched => {
          sched.brackets = new Map(Object.entries(sched.brackets || {}) as Iterable<readonly [string, IScheduleBracket]>);

          for (const bracket of sched.brackets.values()) {
            bracket.services = new Map(Object.entries(bracket.services || {}) as Iterable<readonly [string, IService]>);
            bracket.slots = new Map(Object.entries(bracket.slots || {}) as Iterable<readonly [string, IScheduleBracketSlot]>);
          }
          
          return  [sched.id, sched];
        }) as readonly [string, ISchedule][] ));
      return state;
    default:
      return state;
  }
};

export default scheduleReducer;

export const persist = true;