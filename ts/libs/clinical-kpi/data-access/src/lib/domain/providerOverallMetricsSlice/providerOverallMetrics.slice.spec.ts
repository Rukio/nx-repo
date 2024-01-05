import fetchMock from 'jest-fetch-mock';
import {
  METRICS_LEADER_HUB_PROVIDERS_API_PATH,
  buildGetLeaderHubProviderShifts,
  providerOverallMetricsSlice,
  selectLeaderHubProviderMetrics,
  selectLeaderHubProviderShiftsQuery,
} from './providerOverallMetrics.slice';
import {
  mockedLeaderHubIndividualProviderMetrics,
  mockedProviderShifts,
} from './mocks';
import {
  setupTestStore,
  testApiErrorResponse,
  ERROR_MESSAGE,
  testApiSuccessResponse,
} from '../../../testUtils';
import { environment } from '../../../environments/environment';
import { LeaderHubProviderShiftsQuery } from '../../types';
import { fullAvatarURL } from '../../utils';

const { serviceURL } = environment;

const providerId = 116600;
const page = 1;
const sortOrder = 1;
const providerShiftsQueryParams: LeaderHubProviderShiftsQuery = {
  id: providerId,
  page,
  sort_order: sortOrder,
};

describe('providerLeader slice', () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('GetLeaderHubProviderMetrics', () => {
    it('successful API call and selectors have correct state', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          providerMetrics: mockedLeaderHubIndividualProviderMetrics,
        })
      );
      const store = setupTestStore();

      const { data: dataBefore } = selectLeaderHubProviderMetrics(providerId)(
        store.getState()
      );
      expect(dataBefore).toEqual(undefined);

      const action = await store.dispatch(
        providerOverallMetricsSlice.endpoints.getLeaderHubProviderMetrics.initiate(
          providerId
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${METRICS_LEADER_HUB_PROVIDERS_API_PATH}/${providerId}`
      );

      testApiSuccessResponse(action, mockedLeaderHubIndividualProviderMetrics);

      const { data: dataAfter } = selectLeaderHubProviderMetrics(providerId)(
        store.getState()
      );
      expect(dataAfter).toEqual(mockedLeaderHubIndividualProviderMetrics);
    });

    it('unsuccessful API call', async () => {
      fetchMock.mockReject(new Error(ERROR_MESSAGE));
      const store = setupTestStore();

      const action = await store.dispatch(
        providerOverallMetricsSlice.endpoints.getLeaderHubProviderMetrics.initiate(
          providerId
        )
      );
      testApiErrorResponse(action, ERROR_MESSAGE);
    });
  });

  describe('GetLeaderHubProviderShifts', () => {
    it('successful API call and selectors have correct state', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedProviderShifts));
      const store = setupTestStore();

      const { data: dataBefore } = selectLeaderHubProviderShiftsQuery(
        providerShiftsQueryParams
      )(store.getState());
      expect(dataBefore).toEqual(undefined);

      const action = await store.dispatch(
        providerOverallMetricsSlice.endpoints.getLeaderHubProviderShifts.initiate(
          providerShiftsQueryParams
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${buildGetLeaderHubProviderShifts(
          providerId
        )}?page=${page}&sort_order=${sortOrder}`
      );

      testApiSuccessResponse(action, mockedProviderShifts);

      const { data: dataAfter } = selectLeaderHubProviderShiftsQuery(
        providerShiftsQueryParams
      )(store.getState());
      expect(dataAfter).toEqual(mockedProviderShifts);
    });

    it('unsuccessful API call', async () => {
      fetchMock.mockReject(new Error(ERROR_MESSAGE));
      const store = setupTestStore();

      const action = await store.dispatch(
        providerOverallMetricsSlice.endpoints.getLeaderHubProviderShifts.initiate(
          providerShiftsQueryParams
        )
      );
      testApiErrorResponse(action, ERROR_MESSAGE);
    });
  });
});

describe('fullAvatarURL', () => {
  it.each([
    {
      avatarURL: '/avatar',
      expectedResult: 'https://qa.*company-data-covered*.com/avatar',
    },
    {
      avatarURL: undefined,
      expectedResult: undefined,
    },
    {
      avatarURL: 'https://non-station.com/avatar',
      expectedResult: 'https://non-station.com/avatar',
    },
  ])('should work for $avatarURL', async ({ avatarURL, expectedResult }) => {
    const fullURL = fullAvatarURL(avatarURL);
    expect(fullURL).toEqual(expectedResult);
  });
});
