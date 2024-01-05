import { DefaultPharmacyDto } from '../dto/default-pharmacy.dto';
import * as faker from 'faker';

export const buildMockDefaultPharmacy = (
  init: Partial<DefaultPharmacyDto> = {}
): DefaultPharmacyDto => ({
  defaultPharmacy: {
    id: faker.datatype.number(),
  },
  ...init,
});
