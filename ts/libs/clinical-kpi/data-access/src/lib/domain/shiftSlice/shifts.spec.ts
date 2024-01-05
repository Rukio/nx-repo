import fetchMock from 'jest-fetch-mock';
import {
  shiftsSlice,
  selectShiftSnapshots,
  selectTimelineSnapshotsForShiftTeam,
} from './shifts.slice';
import {
  mockedMappedSnapshots,
  mockedShiftSnapshots,
  mockedTimelineSnapshots,
} from './mocks';
import {
  setupTestStore,
  setupFetchMocks,
  testApiErrorResponse,
  ERROR_MESSAGE,
  testApiSuccessResponse,
} from '../../../testUtils';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;

const shiftTeamId = '9502';

describe('shiftsSlice', () => {
  setupFetchMocks();

  describe('listShiftSnapshots', () => {
    it('successful API call and selectors have correct state', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          ...mockedShiftSnapshots,
        })
      );
      const store = setupTestStore();

      const { data: dataBefore } = selectShiftSnapshots(shiftTeamId)(
        store.getState()
      );
      expect(dataBefore).toEqual(undefined);

      const action = await store.dispatch(
        shiftsSlice.endpoints.listShiftSnapshots.initiate(shiftTeamId)
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');
      expect(url).toEqual(`${serviceURL}shifts/${shiftTeamId}/snapshots`);

      testApiSuccessResponse(action, mockedMappedSnapshots);

      const { data: dataAfter } = selectShiftSnapshots(shiftTeamId)(
        store.getState()
      );
      expect(dataAfter).toEqual(mockedMappedSnapshots);
    });

    it('unsuccessful API call', async () => {
      fetchMock.mockReject(new Error(ERROR_MESSAGE));
      const store = setupTestStore();

      const action = await store.dispatch(
        shiftsSlice.endpoints.listShiftSnapshots.initiate(shiftTeamId)
      );
      testApiErrorResponse(action, ERROR_MESSAGE);
    });
  });

  describe('selectTimelineSnapshotsForShiftTeam', () => {
    it('should select the correct data', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          ...mockedShiftSnapshots,
        })
      );
      const store = setupTestStore();

      const { data: dataBefore } = selectShiftSnapshots(shiftTeamId)(
        store.getState()
      );
      expect(dataBefore).toEqual(undefined);

      await store.dispatch(
        shiftsSlice.endpoints.listShiftSnapshots.initiate(shiftTeamId)
      );

      const dataAfter = selectTimelineSnapshotsForShiftTeam(shiftTeamId)(
        store.getState()
      );
      expect(dataAfter).toEqual(mockedTimelineSnapshots);
    });
  });
});
