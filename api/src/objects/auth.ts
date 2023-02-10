import { IUserProfile } from 'awayto';
import { AuthEvent, IWebhooks } from '../util/db';
import profiles from './profiles';

export const AuthWebhooks: IWebhooks = { 
  AUTH_REGISTER: async (props) => {
    const { userId, details, ipAddress } = props.event.body as AuthEvent;

    const user: Partial<IUserProfile> = {
      firstName: details.first_name,
      lastName: details.last_name,
      email: details.email,
      username: details.username
    };

    props.event.userSub = userId
    props.event.sourceIp = ipAddress;
    props.event.body = user;

    const postUserProfile = profiles.findIndex(api => 'post' === api.method.toLowerCase() && 'profile' === api.path.toLowerCase());

    await profiles[postUserProfile].cmnd(props) as IUserProfile;
  },
  AUTH_LOGIN: async event => {
  },
  AUTH_LOGOUT: async event => {
  },
  AUTH_LOGIN_ERROR: async event => {
  },
  AUTH_REGISTER_ERROR: async event => {
  },
  AUTH_RESET_PASSWORD: async event => {
  },
  AUTH_SEND_VERIFY_EMAIL: async event => {
  },
  AUTH_UPDATE_PROFILE: async event => {
  },
}