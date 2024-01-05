import { plainToInstance } from 'class-transformer';
import * as faker from 'faker';
import { Definition } from '../domain/definition';

export function buildMockConsentDefinition(
  init: Partial<Definition> = {}
): Definition {
  const plain: Definition = {
    id: faker.datatype.number(),
    active: true,
    allServiceLines: true,
    allStates: false,
    captureMethodId: faker.datatype.number(),
    categoryId: faker.datatype.number(),
    documentContent: faker.lorem.paragraphs(),
    expiresNumber: faker.datatype.number(),
    expiresUnit: faker.lorem.paragraphs(),
    frequencyId: faker.datatype.number(),
    languageId: faker.datatype.number(),
    name: faker.lorem.words(3),
    required: true,
    revocable: true,
    serviceLines: new Array(10).fill(0).map(() => faker.datatype.number()),
    signerIds: new Array(10).fill(0).map(() => faker.datatype.number()),
    states: new Array(10).fill(0).map(() => faker.address.stateAbbr()),
    versionName: `${faker.datatype.number()}.${faker.datatype.number()}`,
    ...init,
  };

  return plainToInstance(Definition, plain);
}
