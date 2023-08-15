import { graylog } from 'graylog2';
import { PerformanceObserver, performance } from 'perf_hooks';

const {
  GRAYLOG_HOST,
  GRAYLOG_PORT
} = process.env as { [prop: string]: string } & { PG_PORT: number };

export const logger = new graylog({
  servers: [{
    host: GRAYLOG_HOST as string,
    port: parseInt(GRAYLOG_PORT as string)
  }]
});

// Log all performance measurements
const obs = new PerformanceObserver(items => {
  items.getEntries().forEach(measure => {
    const payload: Record<string, unknown> = { ...measure };
    const [measureType, ...data] = measure.name.split(' ');
    
    if ('regroup' === measureType) {
      payload.groupCount = data[0];
      payload.roleCount = data[1];
    }

    ['Start', 'End'].forEach(markType => performance.clearMarks(`${measureType}${markType}`));

    logger.log('performance', { body: payload });
  });
});
obs.observe({ entryTypes: ['measure'] });


export default logger;