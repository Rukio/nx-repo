import { plainToInstance } from 'class-transformer';
import { ConsentDefinitionsQuery } from '../dto/consent-definition-query.dto';
import * as faker from 'faker';

export function buildMockConsentDefinitionsQuery(
  init: Partial<ConsentDefinitionsQuery> = {}
): ConsentDefinitionsQuery {
  const plain: ConsentDefinitionsQuery = {
    active: true,
    state: faker.address.stateAbbr(),
    signerIds: [faker.datatype.number().toString()],
    serviceLine: faker.datatype.number(),
    languageId: faker.datatype.number(),
    ...init,
  };

  return plainToInstance(ConsentDefinitionsQuery, plain);
}
