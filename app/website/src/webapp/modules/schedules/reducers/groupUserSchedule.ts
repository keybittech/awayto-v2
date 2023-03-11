import { Reducer } from 'redux';
import {
  IGroupUserScheduleState,
  IGroupUserScheduleActions,
  IGroupUserScheduleActionTypes,
  IGroupUserSchedule,
  IScheduleBracket,
  IService,
  IScheduleBracketSlot
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
      state.groupUserSchedules = new Map([ ...state.groupUserSchedules ]
        .concat( action.payload.map(gus => {
          gus.brackets = new Map(Object.entries(gus.brackets || {}) as Iterable<readonly [string, IScheduleBracket]>);
          gus.services = new Map();
          for (const bracket of gus.brackets.values()) {
            bracket.services = new Map(Object.entries(bracket.services || {}) as Iterable<readonly [string, IService]>)
            bracket.slots = new Map(Object.entries(bracket.slots || {}) as Iterable<readonly [string, IScheduleBracketSlot]>)

            for (const service of bracket.services.values()) {
              gus.services.set(service.id, service);
            }
          }
          
          return  [gus.id, gus];
        }) as readonly [string, IGroupUserSchedule][] ));
      return state;
    default:
      return state;
  }
};

export default groupUserSchedulesReducer;

export const persist = true;