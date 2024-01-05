import { isTruthyOrError } from '../../utils';
import { buildAccountsPath } from '../api-paths';
import { patientPortalApiSlice } from '../apiSlice';
import {
  Account,
  FindOrCreateAccountByTokenResponse,
} from '@*company-data-covered*/protos/patients/accounts/service';

export const accountsSlice = patientPortalApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    findOrCreateAccountByToken: builder.query<Account, void>({
      query: () => ({
        url: buildAccountsPath(),
        method: 'POST',
      }),
      transformResponse: ({ account }: FindOrCreateAccountByTokenResponse) =>
        isTruthyOrError(account),
    }),
  }),
});

export const selectDomainAccount =
  accountsSlice.endpoints.findOrCreateAccountByToken.select();

export const { useFindOrCreateAccountByTokenQuery } = accountsSlice;
