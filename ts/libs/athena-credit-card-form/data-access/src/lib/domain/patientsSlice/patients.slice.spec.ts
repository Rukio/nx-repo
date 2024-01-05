import { environment } from '../../../environments/environment';
import {
  setupTestStore,
  testApiUpdateSuccessResponse,
  testApiUpdateErrorResponse,
} from '../../../testUtils';
import {
  CreatePaymentRequestDataPayload,
  SaveCreditCardRequestDataPayload,
  CreditCardsQuery,
  DeleteCreditCardRequestDataPayload,
} from '../../types';
import { mockPayment, mockCreditCards } from './mocks';
import {
  getCreatePaymentURL,
  getSaveCreditCardURL,
  getCreditCardsURL,
  patientsSlice,
  selectCreditCards,
  getDeleteCreditCardURL,
} from './patients.slice';

const { serviceURL } = environment;

const mockedCreatePaymentData: CreatePaymentRequestDataPayload = {
  accountNumber: '1234123412341234',
  departmentId: 1,
  billingAddress: '123 Main St., Denver',
  billingZip: '12345',
  cvv: 123,
  expirationMonth: 12,
  expirationYear: 2000,
  nameOnCard: 'John Dow',
  amount: '1',
  patientId: '1234',
};

const mockedSaveCreditCardData: SaveCreditCardRequestDataPayload = {
  accountNumber: '1234123412341234',
  departmentId: 1,
  billingAddress: '123 Main St., Denver',
  billingZip: '12345',
  cvv: 123,
  expirationMonth: 12,
  expirationYear: 2000,
  nameOnCard: 'John Dow',
  patientId: '1234',
};

const mockedCreditCardsQuery: CreditCardsQuery = {
  departmentId: '1',
  patientId: '1234',
};

const mockDeleteCreditCardData: DeleteCreditCardRequestDataPayload = {
  patientId: '1234',
  departmentId: '1',
  creditCardId: '12345',
};

describe('payment.slice', () => {
  describe('createPayment', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store
        .dispatch(
          patientsSlice.endpoints.createPayment.initiate(
            mockedCreatePaymentData
          )
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('POST');
          expect(url).toEqual(
            `${serviceURL}${getCreatePaymentURL(
              mockedCreatePaymentData.patientId
            )}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockPayment));
      const store = setupTestStore();

      const action = await store.dispatch(
        patientsSlice.endpoints.createPayment.initiate(mockedCreatePaymentData)
      );
      testApiUpdateSuccessResponse(action, mockPayment);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        patientsSlice.endpoints.createPayment.initiate(mockedCreatePaymentData)
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('saveCreditCard', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store
        .dispatch(
          patientsSlice.endpoints.saveCreditCard.initiate(
            mockedSaveCreditCardData
          )
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('POST');
          expect(url).toEqual(
            `${serviceURL}${getSaveCreditCardURL(
              mockedSaveCreditCardData.patientId
            )}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockPayment));
      const store = setupTestStore();

      const action = await store.dispatch(
        patientsSlice.endpoints.saveCreditCard.initiate(
          mockedSaveCreditCardData
        )
      );
      testApiUpdateSuccessResponse(action, mockPayment);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        patientsSlice.endpoints.saveCreditCard.initiate(
          mockedSaveCreditCardData
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getCreditCards', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ creditCards: mockCreditCards }));
      const store = setupTestStore();
      await store
        .dispatch(
          patientsSlice.endpoints.getCreditCards.initiate(
            mockedCreditCardsQuery
          )
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('GET');
          expect(url).toEqual(
            `${serviceURL}${getCreditCardsURL(
              mockedCreditCardsQuery.patientId
            )}?departmentId=${mockedCreditCardsQuery.departmentId}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ creditCards: mockCreditCards }));
      const store = setupTestStore();

      const action = await store.dispatch(
        patientsSlice.endpoints.getCreditCards.initiate(mockedCreditCardsQuery)
      );
      testApiUpdateSuccessResponse(action, mockCreditCards);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        patientsSlice.endpoints.getCreditCards.initiate(mockedCreditCardsQuery)
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });

    it('should select credit cards from store', async () => {
      fetchMock.mockResponse(JSON.stringify({ creditCards: mockCreditCards }));
      const store = setupTestStore();
      await store.dispatch(
        patientsSlice.endpoints.getCreditCards.initiate(mockedCreditCardsQuery)
      );

      const { data: creditCardsFromState } = selectCreditCards(
        mockedCreditCardsQuery
      )(store.getState());
      expect(creditCardsFromState).toEqual(mockCreditCards);
    });
  });

  describe('deleteCreditCard', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store
        .dispatch(
          patientsSlice.endpoints.deleteCreditCard.initiate(
            mockDeleteCreditCardData
          )
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('DELETE');
          expect(url).toEqual(
            `${serviceURL}${getDeleteCreditCardURL(
              mockDeleteCreditCardData.patientId,
              mockDeleteCreditCardData.creditCardId
            )}?departmentId=${mockDeleteCreditCardData.departmentId}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockPayment));
      const store = setupTestStore();

      const action = await store.dispatch(
        patientsSlice.endpoints.deleteCreditCard.initiate(
          mockDeleteCreditCardData
        )
      );
      testApiUpdateSuccessResponse(action, mockPayment);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        patientsSlice.endpoints.deleteCreditCard.initiate(
          mockDeleteCreditCardData
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });
});
