import * as faker from 'faker';
import { PrimaryCareProviderDto } from '../dto/pcp.dto';

export const buildMockPrimaryCareProvider = (
  init: Partial<PrimaryCareProviderDto> = {}
): PrimaryCareProviderDto => ({
  clinicalProvider: {
    id: faker.datatype.number(),
  },
  ...init,
});
