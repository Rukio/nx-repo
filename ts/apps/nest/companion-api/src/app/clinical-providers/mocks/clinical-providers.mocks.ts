import * as faker from 'faker';
import { DeepPartial } from '../../utility/types/deep-partial';
import { ClinicalProviderSearchDto } from '../dto/clinical-provider-search.dto';
import { ClinicalProviderSearchParams } from '../interfaces/clinical-provider';

export const buildMockClinicalProviderSearchParams = (
  init: Partial<ClinicalProviderSearchParams> = {}
): ClinicalProviderSearchParams => ({
  entityName: undefined,
  firstName: faker.datatype.string(),
  lastName: faker.datatype.string(),
  zip: faker.datatype.number().toString(),
  limit: 100,
  distanceMiles: 25,
  ...init,
});

export const buildMockClinicalProviderSearchDto = (
  init: DeepPartial<ClinicalProviderSearchDto> = {}
): ClinicalProviderSearchDto => {
  const { clinicalProvider: clinicalProviderInit, ...rest } = init;

  return {
    clinicalProvider:
      buildMockClinicalProviderSearchParams(clinicalProviderInit),
    ...rest,
  };
};
