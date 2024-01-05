import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import AccountDto from '../dto/patient-account.dto';
import { PATIENT_ACCOUNT_MOCK } from './mocks/patient-accounts.mapper.mock';

describe(`${AccountDto.name}`, () => {
  it.each([
    {
      name: 'valid values',
      values: PATIENT_ACCOUNT_MOCK,
      expectedErrorLength: 0,
    },

    {
      name: 'empty object',
      values: {},
      expectedErrorLength: 0,
    },
    {
      name: 'invalid email',
      values: { ...PATIENT_ACCOUNT_MOCK, email: 'test' },
      expectedErrorLength: 1,
    },
    {
      name: 'invalid id',
      values: { ...PATIENT_ACCOUNT_MOCK, id: 'test' },
      expectedErrorLength: 1,
    },
  ])(
    'should return correct errors list for $name',
    async ({ values, expectedErrorLength }) => {
      const instance = plainToInstance(AccountDto, values);
      const errors = await validate(instance);
      expect(errors).toHaveLength(expectedErrorLength);
    }
  );
});
