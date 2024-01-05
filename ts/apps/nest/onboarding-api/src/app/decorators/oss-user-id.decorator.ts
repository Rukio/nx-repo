import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

export const USER_TOKEN_PROPS_KEY = 'https://*company-data-covered*.com/props';

export interface OSSUser extends Express.User {
  [USER_TOKEN_PROPS_KEY]?: {
    identity_provider_user_id?: string;
  };
}

export const ossUserIdParamFactory = (
  _: unknown,
  ctx: ExecutionContext
): string => {
  const request = ctx.switchToHttp().getRequest<Request>();

  const userId = (request.user as OSSUser)?.[USER_TOKEN_PROPS_KEY]
    ?.identity_provider_user_id;

  if (!userId) {
    throw new BadRequestException();
  }

  return userId;
};

export const OSSUserId = createParamDecorator(ossUserIdParamFactory);
