import fetchMock from 'jest-fetch-mock';
import {
  userSlice,
  selectAuthenticatedUser,
  selectAuthenticatedUserId,
  selectAuthenticatedUserFirstname,
  selectAuthenticatedUserPosition,
  selectAuthenticatedUserMarkets,
  CURRENT_USER_BASE_PATH,
  selectAuthenticatedUserSortedMarkets,
} from './user.slice';
import { mockedAuthenticatedUser } from './mocks';
import {
  setupTestStore,
  testApiErrorResponse,
  testApiSuccessResponse,
  ERROR_MESSAGE,
} from '../../../testUtils';
import { environment } from '../../../environments/environment';
import { sortMarketsAlphabetically } from './utils';

const { serviceURL } = environment;

describe('getAuthecticatedUser', () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('successful API call and selectors have correct state', async () => {
    fetchMock.mockResponse(JSON.stringify({ user: mockedAuthenticatedUser }));
    const store = setupTestStore();
    let state = store.getState();

    const { data: assertDataBefore } = selectAuthenticatedUser(
      store.getState()
    );
    const { userId: assertUserIdBefore } = selectAuthenticatedUserId(state);
    const { firstName: assertFirstnameBefore } =
      selectAuthenticatedUserFirstname(state);
    const { markets: assertMarketsBefore } =
      selectAuthenticatedUserMarkets(state);

    const { markets: assertSortedMarketsBefore } =
      selectAuthenticatedUserSortedMarkets(state);

    const { userPosition: assertUserPositionBefore } =
      selectAuthenticatedUserPosition(state);

    expect(assertDataBefore).toEqual(undefined);
    expect(assertUserIdBefore).toEqual(undefined);
    expect(assertFirstnameBefore).toEqual(undefined);
    expect(assertMarketsBefore).toEqual(undefined);
    expect(assertSortedMarketsBefore).toEqual(undefined);
    expect(assertUserPositionBefore).toEqual(undefined);

    const action = await store.dispatch(
      userSlice.endpoints.getAuthenticatedUser.initiate()
    );

    expect(fetchMock).toBeCalledTimes(1);
    const { method, url } = fetchMock.mock.calls[0][0] as Request;

    expect(method).toEqual('GET');
    expect(url).toEqual(`${serviceURL}${CURRENT_USER_BASE_PATH}`);

    testApiSuccessResponse(action, mockedAuthenticatedUser);
    state = store.getState();

    const { data: dataAfter } = selectAuthenticatedUser(state);
    const { userId } = selectAuthenticatedUserId(state);
    const { firstName } = selectAuthenticatedUserFirstname(state);
    const { markets } = selectAuthenticatedUserMarkets(state);
    const { markets: sortedMarkets } =
      selectAuthenticatedUserSortedMarkets(state);
    const { userPosition } = selectAuthenticatedUserPosition(state);

    expect(dataAfter).toEqual(mockedAuthenticatedUser);
    expect(userId).toEqual(mockedAuthenticatedUser.id);
    expect(firstName).toEqual(mockedAuthenticatedUser.firstName);
    expect(markets).toEqual(mockedAuthenticatedUser.markets);
    expect(sortedMarkets).toEqual(
      sortMarketsAlphabetically(mockedAuthenticatedUser.markets)
    );
    expect(userPosition).toEqual(
      mockedAuthenticatedUser.providerProfile.position
    );
  });

  it('unsuccessful API call and selectors have default state', async () => {
    fetchMock.mockReject(new Error(ERROR_MESSAGE));
    const store = setupTestStore();

    const action = await store.dispatch(
      userSlice.endpoints.getAuthenticatedUser.initiate()
    );
    testApiErrorResponse(action, ERROR_MESSAGE);

    const state = store.getState();
    const { userId } = selectAuthenticatedUserId(state);
    const { firstName } = selectAuthenticatedUserFirstname(state);
    const { markets } = selectAuthenticatedUserMarkets(state);
    expect(userId).toEqual(undefined);
    expect(firstName).toEqual(undefined);
    expect(markets).toEqual(undefined);
  });
});
