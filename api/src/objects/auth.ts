import { IUserProfile } from 'awayto';
import { keycloak } from '../util/keycloak';
import { AuthEvent, AuthEventHandler } from '../util/db';
import users from './users';

export const AuthEventHandlers: AuthEventHandler = { 
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

    const usersApiPostUser = users.findIndex(api => 'post' === api.method.toLowerCase() && 'users' === api.path.toLowerCase());

    await users[usersApiPostUser].cmnd(props) as IUserProfile;
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