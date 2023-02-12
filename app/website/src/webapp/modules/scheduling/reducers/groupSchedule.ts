import { Reducer } from 'redux';
import {
  IGroupSchedules,
  IGroupScheduleState,
  IGroupScheduleActions,
  IGroupScheduleActionTypes,
  IGetGroupSchedulesAction,
  IDeleteGroupScheduleAction,
  IPostGroupScheduleAction,
} from 'awayto';

const initialGroupScheduleState: IGroupScheduleState = {
  groupSchedules: {} as IGroupSchedules
};

function reduceDeleteGroupSchedule(state: IGroupScheduleState, action: IDeleteGroupScheduleAction): IGroupScheduleState {
  const groupSchedules = { ...state.groupSchedules } as IGroupSchedules;
  action.payload.forEach(groupSchedule => {
    delete groupSchedules[groupSchedule.id as string];
  });
  state.groupSchedules = groupSchedules;
  return { ...state };
}

function reducePostGroupSchedules(state: IGroupScheduleState, action: IPostGroupScheduleAction): IGroupScheduleState {
  const groupSchedules = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id as string}`]: b } }), {});
  state.groupSchedules = { ...state.groupSchedules, ...groupSchedules };
  return { ...state };
}

function reduceGetGroupSchedules(state: IGroupScheduleState, action: IGetGroupSchedulesAction): IGroupScheduleState {
  state.groupSchedules = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id as string}`]: b } }), {});
  return { ...state };
}

const groupSchedulesReducer: Reducer<IGroupScheduleState, IGroupScheduleActions> = (state = initialGroupScheduleState, action) => {
  switch (action.type) {
    case IGroupScheduleActionTypes.DELETE_GROUP_SCHEDULE:
      return reduceDeleteGroupSchedule(state, action);
    case IGroupScheduleActionTypes.POST_GROUP_SCHEDULE:
      return reducePostGroupSchedules(state, action);
    case IGroupScheduleActionTypes.GET_GROUP_SCHEDULES:
      return reduceGetGroupSchedules(state, action);
    default:
      return state;
  }
};

export default groupSchedulesReducer;

export const persist = true;