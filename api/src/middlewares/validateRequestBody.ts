import type { NextFunction, Request, Response } from 'express';
import { AnyRecord, AnyRecordTypes, extractParams } from 'awayto/core';

export function validateRequestBody<T extends AnyRecord | AnyRecordTypes>(queryArg: T, url: string) {
  return (req: Request, res: Response, next: NextFunction) => {

    if ('application/octet-stream' === req.headers['content-type']) {
      if (Buffer.byteLength(req.body) > 0) {
        next()
      } else {
        res.status(400).json({ message: 'No stream content length.'  });
      }
    } else {
      const issue = hasRequiredArgs(queryArg as AnyRecord, Object.assign(req.body, extractParams(url, req.url.slice(5)), req.query));
      if (true === issue) {
        next();
      } else if ('string' === typeof issue) {
        res.status(400).json({ message: 'Badly formed request. Issue - ' + issue  });
      }
    }

  };
}

export function hasRequiredArgs<T extends AnyRecord>(targetType: T, sourceType: AnyRecord): boolean | string {
  
  console.log({ targetType, sourceType })
  const targetTypeKeys = Object.keys(targetType).filter(key => key !== '_void').sort();
  const sourceTypeKeys = Object.keys(sourceType).sort();

  const extraKeys = sourceTypeKeys.filter((key) => !targetTypeKeys.includes(key));

  if (extraKeys.length > 0) {
    return 'params not allowed: ' + extraKeys.join(', ');
  }

  const missingKeys = targetTypeKeys.filter((key) => !sourceTypeKeys.includes(key));

  if (missingKeys.length > 0) {
    return 'missing params: ' + missingKeys;
  }

  return targetTypeKeys.every((key) => {
    const value1 = targetType[key];
    const value2 = sourceType[key];

    if (typeof value1 !== typeof value2) {
      return `param mismatch: ${key} expected type: ${typeof value1}, type received ${typeof value2}`;
    }

    if (Array.isArray(value1) && Array.isArray(value2)) {
      return true;
    }

    // if (typeof value1 === 'object' && typeof value2 === 'object') {
    //   return hasRequiredArgs(value1 as AnyRecord, value2 as AnyRecord) === true;
    // }

    return true;
  });
}