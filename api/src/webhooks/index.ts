
import { AssistWebhooks } from './assist';
import { AuthWebhooks } from './auth';

export default {
  ...AuthWebhooks,
  ...AssistWebhooks
}