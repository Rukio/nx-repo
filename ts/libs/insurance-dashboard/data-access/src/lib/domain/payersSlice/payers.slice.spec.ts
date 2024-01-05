import {
  testApiSuccessResponse,
  testApiErrorResponse,
  testApiUpdateSuccessResponse,
  testApiUpdateErrorResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import { setupTestStore } from '../../../testUtils';
import {
  payersSlice,
  PAYERS_API_PATH,
  PatchInsurancePayerPayload,
  InsurancePayerRequestDataPayload,
  selectPayer,
} from './payers.slice';
import { PayersSortDirection, PayersSortFields } from '../../types';
import { mockedInsurancePayer } from './mocks';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;

const mockedPatchPayerData: PatchInsurancePayerPayload = {
  id: 1,
  name: 'New Awesome Name',
  payerGroupId: '1',
  active: true,
};

const mockedCreatePayerData: InsurancePayerRequestDataPayload = {
  name: 'My New Payer',
  payerGroupId: '1',
  active: true,
};

describe('payers.slice', () => {
  describe('getInsurancePayer', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore();
      await store
        .dispatch(
          payersSlice.endpoints.getPayer.initiate(mockedInsurancePayer.id)
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('GET');
          expect(url).toEqual(
            `${serviceURL}${PAYERS_API_PATH}/${mockedInsurancePayer.id}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore();

      const action = await store.dispatch(
        payersSlice.endpoints.getPayer.initiate(mockedInsurancePayer.id)
      );
      testApiSuccessResponse(action, mockedInsurancePayer);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Payer does not exist.';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();

      const action = await store.dispatch(
        payersSlice.endpoints.getPayer.initiate(mockedInsurancePayer.id)
      );
      testApiErrorResponse(action, errorMessage);
    });

    it('should select payer from store', async () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore();
      await store.dispatch(
        payersSlice.endpoints.getPayer.initiate(mockedInsurancePayer.id)
      );

      const { data: payerFromState } = selectPayer(mockedInsurancePayer.id)(
        store.getState()
      );
      expect(payerFromState).toEqual(mockedInsurancePayer);
    });
  });

  describe('getPayers', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ payers: [mockedInsurancePayer] })
      );
      const store = setupTestStore();
      await store.dispatch(payersSlice.endpoints.getPayers.initiate());
      expect(fetchMock).toBeCalledTimes(1);

      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(`${serviceURL}${PAYERS_API_PATH}`);
    });

    it('should make correct API call with query', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ payers: [mockedInsurancePayer] })
      );
      const store = setupTestStore();
      await store
        .dispatch(
          payersSlice.endpoints.getPayers.initiate({
            sortField: PayersSortFields.NAME,
            sortDirection: PayersSortDirection.ASC,
          })
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('GET');
          expect(url).toEqual(
            `${serviceURL}${PAYERS_API_PATH}?sortField=${PayersSortFields.NAME}&sortDirection=${PayersSortDirection.ASC}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ payers: [mockedInsurancePayer] })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        payersSlice.endpoints.getPayers.initiate()
      );
      testApiSuccessResponse(action, [mockedInsurancePayer]);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Payers do not exist.';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();

      const action = await store.dispatch(
        payersSlice.endpoints.getPayers.initiate()
      );
      testApiErrorResponse(action, errorMessage);
    });
  });

  describe('createPayer', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store
        .dispatch(
          payersSlice.endpoints.createPayer.initiate(mockedCreatePayerData)
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('POST');
          expect(url).toEqual(`${serviceURL}${PAYERS_API_PATH}`);
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore();

      const action = await store.dispatch(
        payersSlice.endpoints.createPayer.initiate(mockedCreatePayerData)
      );
      testApiUpdateSuccessResponse(action, { payer: mockedInsurancePayer });
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        payersSlice.endpoints.createPayer.initiate(mockedCreatePayerData)
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('patchPayer', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store
        .dispatch(
          payersSlice.endpoints.patchPayer.initiate(mockedPatchPayerData)
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('PATCH');
          expect(url).toEqual(
            `${serviceURL}${PAYERS_API_PATH}/${mockedPatchPayerData.id}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore();

      const action = await store.dispatch(
        payersSlice.endpoints.patchPayer.initiate(mockedPatchPayerData)
      );
      testApiUpdateSuccessResponse(action, { payer: mockedInsurancePayer });
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        payersSlice.endpoints.patchPayer.initiate(mockedPatchPayerData)
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('deletePayer', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store
        .dispatch(
          payersSlice.endpoints.deletePayer.initiate(mockedPatchPayerData.id)
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('DELETE');
          expect(url).toEqual(
            `${serviceURL}${PAYERS_API_PATH}/${mockedPatchPayerData.id}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedInsurancePayer));
      const store = setupTestStore();

      const action = await store.dispatch(
        payersSlice.endpoints.deletePayer.initiate(mockedPatchPayerData.id)
      );
      testApiUpdateSuccessResponse(action, mockedInsurancePayer);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        payersSlice.endpoints.deletePayer.initiate(mockedPatchPayerData.id)
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });
});
