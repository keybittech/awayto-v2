import { Reducer } from 'redux';
import {
  ISchedule,
  IScheduleState,
  IScheduleActions,
  IScheduleActionTypes,
  IGetScheduleByIdAction,
  IGetSchedulesAction,
  IDeleteScheduleAction,
  IDisableScheduleAction,
  IPostScheduleAction,
  IPutScheduleAction
} from 'awayto';

const initialScheduleState: IScheduleState = {
  schedules: {} as Record<string, ISchedule>
};

function reduceDeleteSchedule(state: IScheduleState, action: IDeleteScheduleAction): IScheduleState {
  const schedules = { ...state.schedules };
  action.payload.forEach(serviceAddon => {
    delete schedules[serviceAddon.id as string];
  });
  state.schedules = schedules;
  return { ...state };
}

function reduceSchedules(state: IScheduleState, action: IGetSchedulesAction | IDisableScheduleAction | IGetScheduleByIdAction | IPostScheduleAction | IPutScheduleAction): IScheduleState {
  const schedules = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id as string}`]: b } }), {});
  state.schedules = { ...state.schedules, ...schedules };
  return { ...state };
}

const scheduleReducer: Reducer<IScheduleState, IScheduleActions> = (state = initialScheduleState, action) => {
  switch (action.type) {
    case IScheduleActionTypes.DELETE_SCHEDULE:
      return reduceDeleteSchedule(state, action);
    case IScheduleActionTypes.PUT_SCHEDULE:
    case IScheduleActionTypes.POST_SCHEDULE:
    case IScheduleActionTypes.GET_SCHEDULE_BY_ID:
      // return reduceSchedule(state, action);
    case IScheduleActionTypes.DISABLE_SCHEDULE:
    case IScheduleActionTypes.GET_SCHEDULES:
      return reduceSchedules(state, action);
    default:
      return state;
  }
};

export default scheduleReducer;

export const persist = true;