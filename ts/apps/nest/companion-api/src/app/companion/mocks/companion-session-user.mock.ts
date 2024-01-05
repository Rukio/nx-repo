import { CompanionSessionUserModel } from '../companion.strategy';
import * as faker from 'faker';

export function buildMockSessionUser(
  init?: Partial<CompanionSessionUserModel>
): CompanionSessionUserModel {
  return {
    linkId: faker.datatype.uuid(),
    careRequestId: faker.datatype.number(),
    ...init,
  };
}
