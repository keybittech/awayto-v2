import { ApiProps } from '../api';

export default async function auditRequest(props: ApiProps): Promise<void> {

  const { event, db } = props;

  const auditBody = typeof event.body == 'object' ? JSON.stringify(event.body) : typeof event.body == 'string' ? event.body : null;
  const path = `${event.method}/${event.path}`;

  await db.query(`
    INSERT INTO request_log(ip_address, sub, path, payload, direction)
    VALUES ($1, $2, $3, $4, $5)
  `, [event.sourceIp || 'localhost', event.userSub, path, auditBody, "REQUEST"]);

}