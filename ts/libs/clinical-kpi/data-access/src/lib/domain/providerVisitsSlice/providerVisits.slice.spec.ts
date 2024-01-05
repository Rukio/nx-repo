import fetchMock from 'jest-fetch-mock';
import {
  getProviderLatestVisitsPath,
  providerVisitsSlice,
} from './providerVisits.slice';
import { mockedVisitsResponse } from './mocks';
import {
  setupTestStore,
  testApiErrorResponse,
  testApiSuccessResponse,
} from '../../../testUtils';
import { environment } from '../../../environments/environment';
import { mockedLeaderHubIndividualProviderVisitsParams } from '../../utils/mappers/mocks';
import { transformProviderVisitsParams } from '../../utils';

const { serviceURL } = environment;

describe('providerLeader slice', () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('GetLeaderHubProviderVisits', () => {
    it('successful API call and selectors have correct state', async () => {
      const expectedUrl = `${serviceURL}${getProviderLatestVisitsPath(
        mockedLeaderHubIndividualProviderVisitsParams.providerId
      )}?page=${
        mockedLeaderHubIndividualProviderVisitsParams.page
      }&search_text=${
        mockedLeaderHubIndividualProviderVisitsParams.searchText
      }&is_abx_prescribed=${
        mockedLeaderHubIndividualProviderVisitsParams.isAbxPrescribed
      }&is_escalated=${
        mockedLeaderHubIndividualProviderVisitsParams.isEscalated
      }`;

      fetchMock.mockResponse(JSON.stringify(mockedVisitsResponse));
      const store = setupTestStore();

      const action = await store.dispatch(
        providerVisitsSlice.endpoints.getProviderVisits.initiate(
          transformProviderVisitsParams(
            mockedLeaderHubIndividualProviderVisitsParams
          )
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');
      expect(url).toEqual(expectedUrl);

      testApiSuccessResponse(action, mockedVisitsResponse);
    });

    it('unsuccessful API call', async () => {
      const errorMessage = 'An error occurred.';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();
      const action = await store.dispatch(
        providerVisitsSlice.endpoints.getProviderVisits.initiate(
          transformProviderVisitsParams(
            mockedLeaderHubIndividualProviderVisitsParams
          )
        )
      );

      testApiErrorResponse(action, errorMessage);
    });
  });
});
