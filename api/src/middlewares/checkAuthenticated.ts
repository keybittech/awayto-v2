import type { NextFunction, Request, Response } from 'express';

export const checkAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // if (req.headers.authorization) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/api/auth/checkin');
  // }
  // return res.status(403).end();
}