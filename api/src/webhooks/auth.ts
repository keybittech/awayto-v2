import { IWebhooks, Void, withEvent } from 'awayto/core';

import { siteApiHandlerRef } from '../handlers';

export const AuthWebhooks: IWebhooks = {
  AUTH_REGISTER: async (props) => {
    if (!props.event) return;

    try {
      const {
        userId: sub,
        details: {
          group_code: code,
          first_name: firstName,
          last_name: lastName,
          email,
          username
        }
      } = props.event.body;

      await siteApiHandlerRef.postUserProfile(withEvent(props, {
        firstName,
        lastName,
        email,
        sub,
        username,
        image: ''
      }));
      
      if (code) {
        await siteApiHandlerRef.joinGroup(withEvent(props, { code }));
        await siteApiHandlerRef.activateProfile(withEvent(props, {} as Void));
      }

      console.log({ sending_success: true })
    } catch (error) {
      const err = error as Error;
      console.log({ sending_success: false, err: err.message, stack: err.stack })
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