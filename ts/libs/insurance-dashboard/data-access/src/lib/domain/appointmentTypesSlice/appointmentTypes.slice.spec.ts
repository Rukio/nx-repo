import {
  testApiSuccessResponse,
  testApiErrorResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import {
  APPOINTMENT_TYPES_API_PATH,
  buildAppointmentTypesPath,
  appointmentTypesSlice,
  selectDomainAppointmentTypes,
} from './appointmentTypes.slice';
import { setupTestStore } from '../../../testUtils';
import { mockedAppointmentTypesPathList } from './mocks';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;

describe('appointmentTypesSlice.slice', () => {
  describe('build api urls', () => {
    it('buildAppointmentTypesPath build correct api url', () => {
      const path = buildAppointmentTypesPath();

      expect(path).toEqual(APPOINTMENT_TYPES_API_PATH);
    });
  });

  describe('getAppointmentTypes', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ appointmentTypes: mockedAppointmentTypesPathList })
      );
      const store = setupTestStore();

      await store.dispatch(
        appointmentTypesSlice.endpoints.getAppointmentTypes.initiate()
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(serviceURL + buildAppointmentTypesPath());
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ appointmentTypes: mockedAppointmentTypesPathList })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        appointmentTypesSlice.endpoints.getAppointmentTypes.initiate()
      );
      testApiSuccessResponse(action, mockedAppointmentTypesPathList);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();

      const action = await store.dispatch(
        appointmentTypesSlice.endpoints.getAppointmentTypes.initiate()
      );
      testApiErrorResponse(action, errorMessage);
    });
  });

  it('should select appointment types from store', async () => {
    fetchMock.mockResponse(
      JSON.stringify({ appointmentTypes: mockedAppointmentTypesPathList })
    );
    const store = setupTestStore();
    await store.dispatch(
      appointmentTypesSlice.endpoints.getAppointmentTypes.initiate()
    );

    const { data: appointmentTypesState } = selectDomainAppointmentTypes(
      store.getState()
    );
    expect(appointmentTypesState).toEqual(mockedAppointmentTypesPathList);
  });
});
