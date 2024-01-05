import { Account } from '@*company-data-covered*/protos/patients/accounts/service';
import { buildMockPhoneNumber } from './phone-number';

export const buildMockAccount = (init: Partial<Account> = {}): Account => {
  const result: Account = {
    accountId: '1',
    email: 'luke.skywalker@example.com',
    number: buildMockPhoneNumber(),
    givenName: 'Luke',
    familyName: 'Skywalker',
    updatedAt: '2023-07-26T10:44:42.254Z',
  };

  return Object.assign(result, init);
};
