import { IWebhooks, siteApiRef, siteApiHandlerRef, ApiProps } from 'awayto/core';
// import profiles from '../apis/profiles';

export const AuthWebhooks: IWebhooks = {
  AUTH_REGISTER: async (props) => {
    if (!props.event) return;
    const joinGroupApi = siteApiRef.joinGroup;
    const joinGroup = siteApiHandlerRef['joinGroup' as keyof typeof siteApiHandlerRef] as (params: ApiProps<typeof joinGroupApi.queryArg>) => Promise<typeof joinGroupApi.resultType>;  
    await joinGroup({ ...props, ...{ event: { ...props.event, body: { code: props.event.body.details.groupCode } } } });
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