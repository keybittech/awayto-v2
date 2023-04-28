import { IWebhooks, ApiProps, IUserProfile, getApiFunc } from 'awayto/core';
// import profiles from '../apis/profiles';

export const AuthWebhooks: IWebhooks = {
  AUTH_REGISTER: async (props) => {
    if (!props.event) return;

    try {
      const { userId: sub, details: { first_name: firstName, last_name: lastName, email, username } } = props.event.body;

      console.log({ AT: new Date(), REGIST_GET_KEY: sub + '_group_code' })

      const code = await props.redis.get(sub + '_group_code');

      const requestParams = {
        ...props,
        event: {
          body: {
            firstName,
            lastName,
            email,
            username,
            sub,
            code
          }
        }
      } as ApiProps<IUserProfile & { code: string }>;
      
      console.log({ IN_REGISTRATION_WITH_EVENT: JSON.stringify(requestParams.event, null, 2) });
      console.log({ newUserProfile: await getApiFunc('postUserProfile')(requestParams) });
      
      if (code) {
        await getApiFunc('joinGroup')(requestParams);      
      }

      console.log({ sending_scucess: true })
    } catch (error) {
      const err = error as Error;
      console.log({ sending_scucess: false, err: err.message, stack: err.stack })
    }
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