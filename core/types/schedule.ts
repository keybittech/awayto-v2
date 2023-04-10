import { AnyRecord, asyncForEach, Extend, Void } from '../util';
import { ITimeUnitNames, utcNowString } from './time_unit';
import { IQuote } from './quote';
import { IService } from './service';
import { ApiHandler, ApiOptions, ApiProps, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';

/**
 * @category Schedule
 */
export enum BookingModes {
  FIRST_COME = "First Come First Served",
  DISTRIBUTED = "Distributed"
}

/**
 * @category Schedule
 */
export type ScheduledParts = {
  ids?: string[];
  type: string;
}

/**
 * @category Schedule
 * @purpose records a potentially available slot on a Group User's Schedule when shown to users during Quote request
 */
export type IScheduleBracketSlot = {
  id: string;
  scheduleBracketId: string;
  startTime: string;
}

/**
 * @category Schedule
 * @purpose allows Group Users to schedule themselves in batches of time across the Schedule instead of one big block of time
 */
export type IScheduleBracket = {
  id: string;
  automatic: boolean;
  scheduleId: string;
  duration: number;
  multiplier: string;
  services: Record<string, IService>;
  slots: Record<string, IScheduleBracketSlot>;
  quotes: Record<string, IQuote>;
  createdOn: string;
};

/**
 * @category Schedule
 * @purpose contains the basic properties of a Schedule that may be attached directly to a User or a Group if it is a master schedule
 */
export type ISchedule = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  timezone: string;
  scheduleTimeUnitId: string;
  scheduleTimeUnitName: ITimeUnitNames;
  bracketTimeUnitId: string;
  bracketTimeUnitName: ITimeUnitNames;
  slotTimeUnitId: string;
  slotTimeUnitName: ITimeUnitNames;
  slotDuration: number;
  brackets: Record<string, IScheduleBracket>;
  createdOn: string;
};

/**
 * @category Schedule
 */
const scheduleApi = {
  postSchedule: {
    kind: EndpointType.MUTATION,
    url: 'schedules',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: {} as ISchedule,
    resultType: {} as ISchedule
  },
  postScheduleBrackets: {
    kind: EndpointType.MUTATION,
    url: 'schedule/brackets',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { scheduleId: '' as string, brackets: {} as Record<string, IScheduleBracket> },
    resultType: { id: '' as string, brackets: {} as Record<string, IScheduleBracket> }
  },
  putSchedule: {
    kind: EndpointType.MUTATION,
    url: 'schedules',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as ISchedule,
    resultType: {} as ISchedule
  },
  getSchedules: {
    kind: EndpointType.QUERY,
    url: 'schedules',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as ISchedule[]
  },
  getScheduleById: {
    kind: EndpointType.QUERY,
    url: 'schedules/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as ISchedule
  },
  deleteSchedule: {
    kind: EndpointType.MUTATION,
    url: 'schedules/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  },
  disableSchedule: {
    kind: EndpointType.MUTATION,
    url: 'schedules/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category Schedule
 */
const scheduleApiHandlers: ApiHandler<typeof scheduleApi> = {
  postSchedule: async props => {
    const schedule = props.event.body;

    const { name, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, slotDuration, startTime, endTime, timezone } = schedule;

    const { id } = await props.tx.one<ISchedule>(`
      INSERT INTO dbtable_schema.schedules (name, created_sub, slot_duration, schedule_time_unit_id, bracket_time_unit_id, slot_time_unit_id, start_time, end_time, timezone)
      VALUES ($1, $2::uuid, $3::integer, $4::uuid, $5::uuid, $6::uuid, $7, $8, $9)
      RETURNING id, name, created_on as "createdOn"
    `, [name, props.event.userSub, slotDuration, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, startTime || null, endTime || null, timezone]);

    schedule.id = id;

    return schedule;
  },
  postScheduleBrackets: async props => {
    const { scheduleId, brackets } = props.event.body;

    // Handle old brackets
    await removeScheduleBrackets(scheduleId, props);

    // For all new incoming brackets, create all resources
    for (const bracketTempId in brackets) {
      const b = brackets[bracketTempId];
      const { id: bracketId } = await props.tx.one<IScheduleBracket>(`
        INSERT INTO dbtable_schema.schedule_brackets (schedule_id, duration, multiplier, automatic, created_sub)
        VALUES ($1, $2, $3, $4, $5::uuid)
        RETURNING id
      `, [scheduleId, b.duration, b.multiplier, b.automatic, props.event.userSub]);

      b.id = bracketId;

      for (const servId in b.services) {
        await props.tx.none(`
          INSERT INTO dbtable_schema.schedule_bracket_services (schedule_bracket_id, service_id, created_sub)
          VALUES ($1, $2, $3::uuid)
        `, [bracketId, servId, props.event.userSub]);
      }

      for (const slotTemporaryId in b.slots) {
        const slot = b.slots[slotTemporaryId];
        const { id: slotId } = await props.tx.one(`
          INSERT INTO dbtable_schema.schedule_bracket_slots (schedule_bracket_id, start_time, created_sub)
          VALUES ($1, $2::interval, $3::uuid)
          RETURNING id
        `, [bracketId, slot.startTime, props.event.userSub]);

        slot.id = slotId;
        slot.scheduleBracketId = bracketId;
      }
    }

    await props.redis.del(props.event.userSub + `profile/details`);
    await props.redis.del(props.event.userSub + 'schedules/' + scheduleId);

    return { id: scheduleId, brackets };
  },
  putSchedule: async props => {
    const { id, startTime, endTime } = props.event.body;

    const updateProps = buildUpdate({
      id,
      start_time: startTime || null,
      end_time: endTime || null,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    const schedule = await props.tx.one<ISchedule>(`
      UPDATE dbtable_schema.schedules
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, name
    `, updateProps.array);

    return schedule;
  },
  getSchedules: async props => {
    const schedules = await props.db.manyOrNone<ISchedule>(`
      SELECT * FROM dbview_schema.enabled_schedules
      WHERE "createdSub" = $1
    `, [props.event.userSub]);

    return schedules;
  },
  getScheduleById: async props => {
    const { id } = props.event.pathParameters;

    const schedule = await props.db.one<ISchedule>(`
      SELECT * FROM dbview_schema.enabled_schedules_ext
      WHERE id = $1
    `, [id]);

    return schedule;
  },

  deleteSchedule: async props => {
    const { ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async scheduleId => {
      // Handle old brackets
      await removeScheduleBrackets(scheduleId, props);

      await props.tx.none(`
        UPDATE dbtable_schema.schedules
        SET enabled = false
        WHERE id = $1
      `, [scheduleId]);

      await props.tx.none(`
        DELETE FROM dbtable_schema.schedules
        WHERE dbtable_schema.schedules.id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM dbtable_schema.schedule_brackets bracket
          WHERE bracket.schedule_id = dbtable_schema.schedules.id
        )
      `, [scheduleId]);
    });

    await props.redis.del(props.event.userSub + `schedules`);
    await props.redis.del(props.event.userSub + `profile/details`);

    return idsSplit.map(id => ({ id }));
  },

  disableSchedule: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      UPDATE dbtable_schema.schedules
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);

    return { id };
  }
} as const;

/**
 * @category Schedule
 */
type ScheduleApi = typeof scheduleApi;

/**
 * @category Schedule
 */
type ScheduleApiHandler = typeof scheduleApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<ScheduleApi> { }
  interface SiteApiHandlerRef extends Extend<ScheduleApiHandler> { }
}

Object.assign(siteApiRef, scheduleApi);
Object.assign(siteApiHandlerRef, scheduleApiHandlers);

async function removeScheduleBrackets<Q extends AnyRecord>(scheduleId: string, props: ApiProps<Q>): Promise<void> {

  const parts = await props.tx.manyOrNone<ScheduledParts>(`
    SELECT * FROM dbfunc_schema.get_scheduled_parts($1);
  `, [scheduleId]);

  const scheduledSlots = parts.find(p => p.ids?.length && 'slot' === p.type);
  const scheduledServices = parts.find(p => p.ids?.length && 'service' === p.type);

  const { ids }= await props.tx.one<{ ids: string[] }>(`
    SELECT JSONB_AGG(id) as ids FROM dbtable_schema.schedule_brackets
    WHERE schedule_id = $1
  `, [scheduleId]);

  // If there are existing brackets for this user schedule
  if (ids) {

    // Loop through old bracket ids
    for (const bracketId of ids) {

      // If any slots or services are tied to existing quotes or bookings
      if (scheduledSlots?.ids?.length || scheduledServices?.ids?.length) {

        // Delete and disable this old bracket's unused and used slots
        if (scheduledSlots) {
          await props.tx.none(`
            DELETE FROM dbtable_schema.schedule_bracket_slots
            WHERE schedule_bracket_id = $1 AND id <> ALL($2::uuid[])
          `, [bracketId, scheduledSlots.ids]);

          // Disable record so we can catch all disabled records later
          await props.tx.none(`
            UPDATE dbtable_schema.schedule_bracket_slots
            SET enabled = false
            WHERE schedule_bracket_id = $1 AND id = ANY($2::uuid[])
          `, [bracketId, scheduledSlots.ids]);
        }

        // Delete and disable this old bracket's unused and used services
        if (scheduledServices) {
          await props.tx.none(`
            DELETE FROM dbtable_schema.schedule_bracket_services
            WHERE schedule_bracket_id = $1 AND id <> ALL($2::uuid[])
          `, [bracketId, scheduledServices.ids]);

          // Disable record so we can catch all disabled records later
          await props.tx.none(`
            UPDATE dbtable_schema.schedule_bracket_services
            SET enabled = false
            WHERE schedule_bracket_id = $1 AND id = ANY($2::uuid[])
          `, [bracketId, scheduledServices.ids]);
        }

        // Delete and disable brackets with unused and used slots or services
        await props.tx.none(`
          DELETE FROM dbtable_schema.schedule_brackets
          USING dbtable_schema.schedule_bracket_slots slot,
                dbtable_schema.schedule_bracket_services service
          WHERE dbtable_schema.schedule_brackets.id = $1
          AND dbtable_schema.schedule_brackets.id = slot.schedule_bracket_id
          AND slot.schedule_bracket_id = service.schedule_bracket_id
          AND slot.id <> ALL($2::uuid[])
          AND service.id <> ALL($3::uuid[])
        `, [bracketId, (scheduledSlots?.ids || []), (scheduledServices?.ids || [])]);

        // Disable record so we can catch all disabled records later
        await props.tx.none(`
          UPDATE dbtable_schema.schedule_brackets
          SET enabled = false
          FROM dbtable_schema.schedule_bracket_slots slot
          JOIN dbtable_schema.schedule_bracket_services service ON service.schedule_bracket_id = slot.schedule_bracket_id
          WHERE dbtable_schema.schedule_brackets.id = $1
          AND slot.schedule_bracket_id = dbtable_schema.schedule_brackets.id
          AND (slot.id = ANY($2::uuid[])
          OR service.id = ANY($3::uuid[]))
        `, [bracketId, (scheduledSlots?.ids || []), (scheduledServices?.ids || [])]);
      } else {
        // If there were no slots or services attached to this bracket, delete it completely
        await props.tx.none(`
          DELETE FROM dbtable_schema.schedule_brackets
          WHERE id = $1
        `, [bracketId]);
      }
    }
  }
}