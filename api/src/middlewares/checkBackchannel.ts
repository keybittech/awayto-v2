import { NextFunction, Request, Response } from 'express';

const {
  KC_API_CLIENT_SECRET
} = process.env as { [prop: string]: string };

export const checkBackchannel = (req: Request, res: Response, next: NextFunction) => {
  if (req.header('x-backchannel-id') === KC_API_CLIENT_SECRET) {
    return next()
  } else {
    res.status(404).send();
  }
}