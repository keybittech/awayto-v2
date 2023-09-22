import type { NextFunction, Request, Response } from 'express';
import jwtDecode from 'jwt-decode';
import { DecodedJWTToken, IGroup, StrategyUser, UserGroupRoles, nid } from 'awayto/core';
import { redisProxy } from '../modules/redis';
import { db } from '../modules/db';

export const checkToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.headers.authorization) {
      const user = req.user as StrategyUser;

      const { groupRoleActions } = await redisProxy('groupRoleActions');

      const token = jwtDecode<DecodedJWTToken>(req.headers.authorization || '');

      req.session.groups = token.groups;
      req.session.availableUserGroupRoles = {} as UserGroupRoles;

      try {

        for (const subgroupPath of req.session.groups) {
          const [groupName, subgroupName] = subgroupPath.slice(1).split('/');
          req.session.availableUserGroupRoles[groupName] = req.session.availableUserGroupRoles[groupName] || {};
          req.session.availableUserGroupRoles[groupName][subgroupName] = groupRoleActions[subgroupPath]?.actions.map(a => a.name) || []
        }

        const gNameSelect = req.headers['x-gid-select'];

        req.session.group = req.session.group || {} as IGroup;
        const groupNames = Object.keys(req.session.availableUserGroupRoles);

        const needsGroupAttach = req.session.groups.length && !Object.keys(req.session.group).length;
        const needsGroupChange = gNameSelect && req.session.group?.id !== gNameSelect;

        if (needsGroupAttach || needsGroupChange) {
          const gid = gNameSelect ? gNameSelect : groupNames[0];

          const group = await db.one<IGroup>(`
            SELECT eg.id, eg.name, eg."displayName", eg.purpose
            FROM dbview_schema.enabled_groups eg
            JOIN dbview_schema.enabled_group_users egu ON egu."groupId" = eg.id
            JOIN dbtable_schema.users u ON u.id = egu."userId"
            WHERE eg.name = $1 AND u.sub = $2
          `, [gid, user.sub]);
          req.session.group = group;
          req.session.nonce = nid('v4') as string;
        }

        const sessionGroupChanged = groupNames.length && req.session.group.name && !groupNames.includes(req.session.group.name);

        if (sessionGroupChanged) {
          const group = await db.one<IGroup>(`
            SELECT id, name, display_name as "displayName", purpose
            FROM dbtable_schema.groups
            WHERE created_sub = $1 
          `, [user.sub]);
          console.log('a group name was changed', user.sub, group.id);
          req.session.group = group;
        }
      } catch (error) {
        // TODO: Catch non-user error
        return res.status(400).send();
        // return next();
      }
    }

    return next();

  } catch (error) {
    console.log('check token general error', req.url, error);

    res.status(400).send();
  }
}