import { accountsSlice, selectDomainAccount } from './accounts.slice';
import {
  testApiSuccessResponse,
  testApiErrorResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import {
  setupTestStore,
  buildMockAccount,
  buildMockConsistencyToken,
} from '../../../testUtils';
import { environment } from '../../../environments/environment';
import { FindOrCreateAccountByTokenResponse } from '@*company-data-covered*/protos/patients/accounts/service';
import { buildAccountsPath } from '../api-paths';

const { serviceURL } = environment;

describe('accountsSlice', () => {
  const mockAccount = buildMockAccount();
  const mockFindOrCreateAccountByTokenResponseGood: FindOrCreateAccountByTokenResponse =
    {
      account: mockAccount,
      consistencyToken: buildMockConsistencyToken(),
    };
  const mockFindOrCreateAccountByTokenResponseEmptyAccount: FindOrCreateAccountByTokenResponse =
    {
      account: undefined,
      consistencyToken: buildMockConsistencyToken(),
    };

  describe('findOrCreateAccountByToken', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify(mockFindOrCreateAccountByTokenResponseGood)
      );
      const store = setupTestStore();

      await store.dispatch(
        accountsSlice.endpoints.findOrCreateAccountByToken.initiate()
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(new URL(buildAccountsPath(), serviceURL).toString());
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify(mockFindOrCreateAccountByTokenResponseGood)
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        accountsSlice.endpoints.findOrCreateAccountByToken.initiate()
      );
      testApiSuccessResponse(
        action,
        mockFindOrCreateAccountByTokenResponseGood.account
      );
    });

    it('bad response format', async () => {
      const errorMessage = 'expected given value to be truthy';
      fetchMock.mockResponse(
        JSON.stringify(mockFindOrCreateAccountByTokenResponseEmptyAccount)
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        accountsSlice.endpoints.findOrCreateAccountByToken.initiate()
      );
      const { status, isError, error } = action;

      expect(status).toEqual('rejected');
      expect(isError).toEqual(true);
      expect(error).toEqual(
        expect.objectContaining({
          message: errorMessage,
          name: 'Error',
        })
      );
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'ahhhhh, an error';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();

      const action = await store.dispatch(
        accountsSlice.endpoints.findOrCreateAccountByToken.initiate()
      );
      testApiErrorResponse(action, errorMessage);
    });
  });

  describe('selectDomainAccount', () => {
    it('should select the correct data', async () => {
      fetchMock.mockResponse(
        JSON.stringify(mockFindOrCreateAccountByTokenResponseGood)
      );
      const store = setupTestStore();
      await store.dispatch(
        accountsSlice.endpoints.findOrCreateAccountByToken.initiate()
      );

      const { data: modalitiesState } = selectDomainAccount(store.getState());
      expect(modalitiesState).toEqual(
        mockFindOrCreateAccountByTokenResponseGood.account
      );
    });
  });
});
