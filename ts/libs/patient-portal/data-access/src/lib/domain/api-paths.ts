import { Account } from '@*company-data-covered*/protos/patients/accounts/service';

export const URL_SEGMENTS = {
  ACCOUNTS: 'accounts',
};

export const buildAccountsPath = (id?: Account['accountId']) => {
  return id ? `${URL_SEGMENTS.ACCOUNTS}/${id}` : `${URL_SEGMENTS.ACCOUNTS}`;
};
