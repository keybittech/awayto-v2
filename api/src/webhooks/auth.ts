import { IUserProfile, IUserProfileActionTypes } from 'awayto';
import { ApiEvent, AuthBody, IWebhooks } from '../api';
import profiles from '../apis/profiles';

export const AuthWebhooks: IWebhooks = {
  AUTH_REGISTER: async (props) => {
    if (!props.event) return;
    const { userId, details, ipAddress } = props.event.body as AuthBody;

    const user: Partial<IUserProfile> = {
      firstName: details.first_name,
      lastName: details.last_name,
      email: details.email,
      username: details.username
    };

    const postUserProfile = profiles.find(api => api.action === IUserProfileActionTypes.POST_USER_PROFILE);

    await postUserProfile?.cmnd({
      event: {
        ...props.event,
        userSub: userId,
        sourceIp: ipAddress,
        body: user
      } as ApiEvent,
      db: props.db,
      redis: props.redis
    }) as IUserProfile;
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