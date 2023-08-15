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
    logger.log('performance', { body: measure });
    measure.name.split(' to ').forEach(mark => performance.clearMarks(mark));
  });
});
obs.observe({ entryTypes: ['measure'] });


export default logger;