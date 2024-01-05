import { ApiParam } from '@nestjs/swagger';

export const LINK_ID_PARAM_NAME = 'linkId';

export const ApiCompanionLinkIdParam = () =>
  ApiParam({
    name: LINK_ID_PARAM_NAME,
    description: `The link ID of the companion link.`,
  });
