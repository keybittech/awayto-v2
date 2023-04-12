import { graylog } from 'graylog2';
import { PerformanceObserver, performance } from 'perf_hooks';

const {
  GRAYLOG_HOST,
  GRAYLOG_PORT
} = process.env;

export const logger = new graylog({
  servers: [{
    host: GRAYLOG_HOST as string,
    port: parseInt(GRAYLOG_PORT as string)
  }]
});

// Log all performance measurements
const obs = new PerformanceObserver(items => {
  logger.log('performance', { body: items.getEntries() });

  items.getEntries().forEach(measure => {
    measure.name.split(' to ').forEach(mark => performance.clearMarks(mark));
  });
});
obs.observe({ entryTypes: ['measure'] });


export default logger;