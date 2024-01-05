import { plainToInstance } from 'class-transformer';
import * as faker from 'faker';
import { ConsentCapturesQuery } from '../types/consent-captures-query';

export function buildMockConsentCapturesQuery(
  init: Partial<ConsentCapturesQuery> = {}
): ConsentCapturesQuery {
  const plain: ConsentCapturesQuery = {
    patientId: faker.datatype.number(),
    visitId: faker.datatype.number(),
    episodeId: faker.datatype.number(),
    serviceLine: faker.datatype.number(),
    ...init,
  };

  return plainToInstance(ConsentCapturesQuery, plain);
}
