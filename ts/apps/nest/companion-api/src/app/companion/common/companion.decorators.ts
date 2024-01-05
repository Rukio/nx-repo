import { Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';
import { LINK_ID_PARAM_NAME } from './companion.constants';
import { ParseLinkPipe } from './companion.pipes';

export const ApiCompanionLinkIdParam = () =>
  ApiParam({
    name: LINK_ID_PARAM_NAME,
    description: `The link ID of the companion link.`,
  });

export const Link = () =>
  Param(LINK_ID_PARAM_NAME, ParseUUIDPipe, ParseLinkPipe);
