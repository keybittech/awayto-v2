import { NextFunction, Request, Response } from 'express';

const {
  KC_API_CLIENT_SECRET,
  SOCK_SECRET
} = process.env as { [prop: string]: string };

export const checkBackchannel = (req: Request, res: Response, next: NextFunction) => {
  const backchannelId = req.header('x-backchannel-id');
  if (backchannelId && [KC_API_CLIENT_SECRET, SOCK_SECRET].includes(backchannelId)) {
    return next()
  } else {
    res.status(404).send();
  }
}