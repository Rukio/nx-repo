import { setupTestStore } from '../../../testUtils';
import {
  mockPatientAccount,
  mockUpdatePatientAccountPayload,
  mockCreatePatientAccountAddressResponse,
  mockCreatePatientAccountAddressPayload,
  mockUpdatePatientAccountAddressResponse,
  mockUpdatePatientAccountAddressPayload,
  mockGetAccountPatientsQuery,
  mockAccountPatients,
  mockPatientAccountUnverifiedPatient,
  mockCreatePatientAccountUnverifiedPatientPayload,
  mockPatientAccountPatientLink,
  mockAddPatientAccountUnverifiedPatientLinkPayload,
  mockInsurance,
  mockCreatePatientAccountInsurancePayload,
  mockInsuranceWithEligibleStatus,
  mockPatientAccountCheckEligibilityQuery,
  mockCreatePatientEhrRecordPayload,
  mockDomainPatientAccountAddress,
  mockGetPatientInsurancesQuery,
  mockUpdatePatientAccountInsurancePayload,
  mockUpdateAccountPatientPayload,
  mockPatient,
  mockGetPatientQuery,
  mockDeletePatientInsuranceQuery,
  mockDeletePatientInsuranceSuccessfulResponse,
} from './mocks';
import {
  buildPatientAccountPath,
  buildPatientAccountAddressPath,
  buildUpdatePatientAccountAddressPath,
  patientAccountsSlice,
  PATIENT_ACCOUNTS_API_PATH,
  selectDomainPatientAccount,
  buildPatientAccountPatientsPath,
  selectDomainPatientAccountPatients,
  buildAddUnverifiedAccountPatientLinkPath,
  buildPatientAccountInsurancesPath,
  buildPatientAccountCheckEligibilityPath,
  INSURANCES_SEGMENT,
  CHECK_ELIGIBILITY_SEGMENT,
  buildCreatePatientEhrRecordPath,
  selectDomainPatientAddresses,
  selectPatientInsurances,
  buildPatientAccountInsurancePath,
  buildAccountPatientPath,
} from './patientAccounts.slice';
import { environment } from '../../../environments/environment';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
  testApiUpdateErrorResponse,
  testApiUpdateSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import { GetPatientInsurancesQuery } from './types';

const { serviceURL } = environment;

const buildPatientAccountCreateInsuranceApiPath = (
  accountId: string | number,
  patientId: string | number
) =>
  `${serviceURL}${buildPatientAccountInsurancesPath(
    accountId
  )}?patientId=${patientId}`;

const buildPatientAccountGetInsurancesApiPath = ({
  accountId,
  patientId,
}: GetPatientInsurancesQuery) =>
  `${serviceURL}${buildPatientAccountInsurancesPath(
    accountId
  )}?patientId=${patientId}`;

const buildPatientAccountUpdateInsuranceApiPath = (
  accountId: string | number,
  patientId: string | number,
  insuranceId: string | number
) =>
  `${serviceURL}${buildPatientAccountInsurancePath(
    accountId,
    insuranceId
  )}?patientId=${patientId}`;

describe('patientAccounts.slice', () => {
  describe('getAccount', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockPatientAccount }));
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.getAccount.initiate()
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(serviceURL + PATIENT_ACCOUNTS_API_PATH);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockPatientAccount }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.getAccount.initiate()
      );
      testApiSuccessResponse(action, mockPatientAccount);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.getAccount.initiate()
      );
      testApiErrorResponse(action, errorMessage);
    });
  });

  describe('updateAccount', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockPatientAccount }));
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.updateAccount.initiate(
          mockUpdatePatientAccountPayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('PATCH');
      expect(url).toEqual(
        `${serviceURL}${buildPatientAccountPath(
          mockUpdatePatientAccountPayload.id
        )}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockPatientAccount }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.updateAccount.initiate(
          mockUpdatePatientAccountPayload
        )
      );
      testApiUpdateSuccessResponse(action, mockPatientAccount);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.updateAccount.initiate(
          mockUpdatePatientAccountPayload
        )
      );
      testApiUpdateErrorResponse(action, errorMessage);
    });
  });

  describe('createAddress', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockCreatePatientAccountAddressResponse })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.createAddress.initiate(
          mockCreatePatientAccountAddressPayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(
        `${serviceURL}${buildPatientAccountAddressPath(
          Number(mockCreatePatientAccountAddressPayload.accountId)
        )}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockCreatePatientAccountAddressResponse })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.createAddress.initiate(
          mockCreatePatientAccountAddressPayload
        )
      );
      testApiUpdateSuccessResponse(
        action,
        mockCreatePatientAccountAddressResponse
      );
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.createAddress.initiate(
          mockCreatePatientAccountAddressPayload
        )
      );
      testApiUpdateErrorResponse(action, errorMessage);
    });
  });

  describe('updateAddress', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockUpdatePatientAccountAddressResponse })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.updateAddress.initiate(
          mockUpdatePatientAccountAddressPayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('PATCH');
      expect(url).toEqual(
        `${serviceURL}${buildUpdatePatientAccountAddressPath(
          mockUpdatePatientAccountAddressPayload.accountId,
          mockUpdatePatientAccountAddressPayload.id
        )}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockUpdatePatientAccountAddressResponse })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.updateAddress.initiate(
          mockUpdatePatientAccountAddressPayload
        )
      );
      testApiUpdateSuccessResponse(
        action,
        mockUpdatePatientAccountAddressResponse
      );
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.updateAddress.initiate(
          mockUpdatePatientAccountAddressPayload
        )
      );
      testApiUpdateErrorResponse(action, errorMessage);
    });
  });

  describe('getAccountPatients', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockAccountPatients }));
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.getAccountPatients.initiate(
          mockGetAccountPatientsQuery
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        serviceURL +
          buildPatientAccountPatientsPath(mockGetAccountPatientsQuery.id)
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockAccountPatients }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.getAccountPatients.initiate(
          mockGetAccountPatientsQuery
        )
      );
      testApiSuccessResponse(action, mockAccountPatients);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.getAccountPatients.initiate(
          mockGetAccountPatientsQuery
        )
      );
      testApiErrorResponse(action, errorMessage);
    });
  });

  describe('selectors', () => {
    describe('selectDomainPatientAccount', () => {
      it('should select patient account from store', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: mockPatientAccount }));
        const { store } = setupTestStore();
        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        const { data: patientAccount } = selectDomainPatientAccount(
          store.getState()
        );
        expect(patientAccount).toEqual(mockPatientAccount);
      });
    });

    describe('selectDomainPatientAccountPatients', () => {
      it('should select patient account patients from store', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: mockAccountPatients }));
        const { store } = setupTestStore();
        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate(
            mockGetAccountPatientsQuery
          )
        );

        const { data: patientAccount } = selectDomainPatientAccountPatients(
          mockGetAccountPatientsQuery
        )(store.getState());
        expect(patientAccount).toEqual(mockAccountPatients);
      });
    });

    describe('selectDomainPatientAddresses', () => {
      it('should select patient addresses', async () => {
        fetchMock.mockResponse(
          JSON.stringify({ data: [mockDomainPatientAccountAddress] })
        );
        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getAddresses.initiate(
            mockPatientAccount.id
          )
        );

        const { data: patientAddresses } = selectDomainPatientAddresses(
          mockPatientAccount.id
        )(store.getState());
        expect(patientAddresses).toEqual([mockDomainPatientAccountAddress]);
      });
    });

    describe('selectPatientInsurances', () => {
      it('should select patient insurances from store', async () => {
        fetchMock.mockResponse(
          JSON.stringify({ data: [mockInsuranceWithEligibleStatus] })
        );
        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getPatientInsurances.initiate(
            mockGetPatientInsurancesQuery
          )
        );

        const { data: insurances } = selectPatientInsurances(
          mockGetPatientInsurancesQuery
        )(store.getState());
        expect(insurances).toEqual([mockInsuranceWithEligibleStatus]);
      });
    });
  });

  describe('createUnverifiedPatient', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockPatientAccountUnverifiedPatient })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.createUnverifiedPatient.initiate(
          mockCreatePatientAccountUnverifiedPatientPayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(
        `${serviceURL}${buildPatientAccountPatientsPath(
          mockCreatePatientAccountUnverifiedPatientPayload.accountId
        )}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockPatientAccountUnverifiedPatient })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.createUnverifiedPatient.initiate(
          mockCreatePatientAccountUnverifiedPatientPayload
        )
      );
      testApiUpdateSuccessResponse(action, mockPatientAccountUnverifiedPatient);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.createUnverifiedPatient.initiate(
          mockCreatePatientAccountUnverifiedPatientPayload
        )
      );
      testApiUpdateErrorResponse(action, errorMessage);
    });
  });

  describe('createUnverifiedPatient', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockPatientAccountUnverifiedPatient })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.createUnverifiedPatient.initiate(
          mockCreatePatientAccountUnverifiedPatientPayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(
        `${serviceURL}${buildPatientAccountPatientsPath(
          mockCreatePatientAccountUnverifiedPatientPayload.accountId
        )}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockPatientAccountUnverifiedPatient })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.createUnverifiedPatient.initiate(
          mockCreatePatientAccountUnverifiedPatientPayload
        )
      );
      testApiUpdateSuccessResponse(action, mockPatientAccountUnverifiedPatient);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.createUnverifiedPatient.initiate(
          mockCreatePatientAccountUnverifiedPatientPayload
        )
      );
      testApiUpdateErrorResponse(action, errorMessage);
    });
  });

  describe('addUnverifiedAccountPatientLink', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockPatientAccountPatientLink })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.addUnverifiedAccountPatientLink.initiate(
          mockAddPatientAccountUnverifiedPatientLinkPayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('PATCH');
      expect(url).toEqual(
        `${serviceURL}${buildAddUnverifiedAccountPatientLinkPath(
          mockAddPatientAccountUnverifiedPatientLinkPayload.accountId
        )}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockPatientAccountPatientLink })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.addUnverifiedAccountPatientLink.initiate(
          mockAddPatientAccountUnverifiedPatientLinkPayload
        )
      );
      testApiUpdateSuccessResponse(action, mockPatientAccountPatientLink);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.addUnverifiedAccountPatientLink.initiate(
          mockAddPatientAccountUnverifiedPatientLinkPayload
        )
      );
      testApiUpdateErrorResponse(action, errorMessage);
    });
  });

  describe('createInsurance', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockInsurance }));
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.createInsurance.initiate(
          mockCreatePatientAccountInsurancePayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      const { accountId, patientId } = mockCreatePatientAccountInsurancePayload;

      expect(method).toEqual('POST');
      expect(url).toEqual(
        buildPatientAccountCreateInsuranceApiPath(accountId, patientId)
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockInsurance }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.createInsurance.initiate(
          mockCreatePatientAccountInsurancePayload
        )
      );
      testApiUpdateSuccessResponse(action, mockInsurance);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.createInsurance.initiate(
          mockCreatePatientAccountInsurancePayload
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('checkEligibility', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockInsuranceWithEligibleStatus })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.checkEligibility.initiate(
          mockPatientAccountCheckEligibilityQuery
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      const { accountId, insuranceId, patientId } =
        mockPatientAccountCheckEligibilityQuery;

      expect(method).toEqual('POST');
      expect(url).toEqual(
        `${serviceURL}${buildPatientAccountCheckEligibilityPath(
          accountId,
          insuranceId
        )}?patientId=${patientId}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockInsuranceWithEligibleStatus })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.checkEligibility.initiate(
          mockPatientAccountCheckEligibilityQuery
        )
      );
      testApiUpdateSuccessResponse(action, mockInsuranceWithEligibleStatus);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.checkEligibility.initiate(
          mockPatientAccountCheckEligibilityQuery
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getPatientInsurances', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: [mockInsuranceWithEligibleStatus] })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.getPatientInsurances.initiate(
          mockGetPatientInsurancesQuery
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        buildPatientAccountGetInsurancesApiPath(mockGetPatientInsurancesQuery)
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: [mockInsuranceWithEligibleStatus] })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.getPatientInsurances.initiate(
          mockGetPatientInsurancesQuery
        )
      );
      testApiUpdateSuccessResponse(action, [mockInsuranceWithEligibleStatus]);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.getPatientInsurances.initiate(
          mockGetPatientInsurancesQuery
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('updatePatientInsurance', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockInsurance }));
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.updatePatientInsurance.initiate(
          mockUpdatePatientAccountInsurancePayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      const { accountId, patientId, insuranceId } =
        mockUpdatePatientAccountInsurancePayload;

      expect(method).toEqual('PUT');
      expect(url).toEqual(
        buildPatientAccountUpdateInsuranceApiPath(
          accountId,
          patientId,
          insuranceId
        )
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockInsurance }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.updatePatientInsurance.initiate(
          mockUpdatePatientAccountInsurancePayload
        )
      );
      testApiUpdateSuccessResponse(action, mockInsurance);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.updatePatientInsurance.initiate(
          mockUpdatePatientAccountInsurancePayload
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('deletePatientInsurance', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify(mockDeletePatientInsuranceSuccessfulResponse)
      );
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.deletePatientInsurance.initiate(
          mockDeletePatientInsuranceQuery
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      const { accountId, insuranceId, patientId } =
        mockDeletePatientInsuranceQuery;

      expect(method).toEqual('DELETE');
      expect(url).toEqual(
        `${serviceURL}${buildPatientAccountInsurancePath(
          accountId,
          insuranceId
        )}?patientId=${patientId}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify(mockDeletePatientInsuranceSuccessfulResponse)
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.deletePatientInsurance.initiate(
          mockDeletePatientInsuranceQuery
        )
      );
      testApiUpdateSuccessResponse(
        action,
        mockDeletePatientInsuranceSuccessfulResponse
      );
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.deletePatientInsurance.initiate(
          mockDeletePatientInsuranceQuery
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('url builders', () => {
    describe('buildPatientAccountInsurancesPath', () => {
      it('should build correct path', () => {
        const { accountId } = mockCreatePatientAccountInsurancePayload;
        expect(buildPatientAccountInsurancesPath(accountId)).toEqual(
          `${PATIENT_ACCOUNTS_API_PATH}/${accountId}${INSURANCES_SEGMENT}`
        );
      });
    });

    describe('buildPatientAccountCheckEligibilityPath', () => {
      it('should build correct path', () => {
        const { accountId, insuranceId } =
          mockPatientAccountCheckEligibilityQuery;
        expect(
          buildPatientAccountCheckEligibilityPath(accountId, insuranceId)
        ).toEqual(
          `${PATIENT_ACCOUNTS_API_PATH}/${accountId}${INSURANCES_SEGMENT}/${insuranceId}${CHECK_ELIGIBILITY_SEGMENT}`
        );
      });
    });

    describe('buildPatientAccountInsurancePath', () => {
      it('should build correct path', () => {
        const { accountId, insuranceId } =
          mockUpdatePatientAccountInsurancePayload;
        expect(
          buildPatientAccountInsurancePath(accountId, insuranceId)
        ).toEqual(
          `${PATIENT_ACCOUNTS_API_PATH}/${accountId}${INSURANCES_SEGMENT}/${insuranceId}`
        );
      });
    });
  });

  describe('createPatientEhrRecord', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockPatient }));
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.createPatientEhrRecord.initiate(
          mockCreatePatientEhrRecordPayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(
        `${serviceURL}${buildCreatePatientEhrRecordPath(mockPatientAccount.id)}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockPatient }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.createPatientEhrRecord.initiate(
          mockCreatePatientEhrRecordPayload
        )
      );
      testApiUpdateSuccessResponse(action, mockPatient);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.createPatientEhrRecord.initiate(
          mockCreatePatientEhrRecordPayload
        )
      );
      testApiUpdateErrorResponse(action, errorMessage);
    });
  });

  describe('getAddresses', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: [mockDomainPatientAccountAddress] })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.getAddresses.initiate(
          mockPatientAccount.id
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${buildPatientAccountAddressPath(
          Number(mockCreatePatientAccountAddressPayload.accountId)
        )}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: [mockDomainPatientAccountAddress] })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.getAddresses.initiate(
          mockPatientAccount.id
        )
      );
      testApiUpdateSuccessResponse(action, [mockDomainPatientAccountAddress]);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.getAddresses.initiate(
          mockPatientAccount.id
        )
      );
      testApiUpdateErrorResponse(action, errorMessage);
    });
  });

  describe('updateAccountPatient', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockPatientAccountUnverifiedPatient })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.updateAccountPatient.initiate(
          mockUpdateAccountPatientPayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('PATCH');
      expect(url).toEqual(
        `${serviceURL}${buildAccountPatientPath(
          mockUpdateAccountPatientPayload.accountId,
          mockUpdateAccountPatientPayload.patientId
        )}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockPatientAccountUnverifiedPatient })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.updateAccountPatient.initiate(
          mockUpdateAccountPatientPayload
        )
      );
      testApiUpdateSuccessResponse(action, mockPatientAccountUnverifiedPatient);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.updateAccountPatient.initiate(
          mockUpdateAccountPatientPayload
        )
      );
      testApiUpdateErrorResponse(action, errorMessage);
    });
  });

  describe('getPatient', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockPatient }));
      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.getPatient.initiate(mockGetPatientQuery)
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        serviceURL +
          buildAccountPatientPath(
            mockGetPatientQuery.accountId,
            mockGetPatientQuery.patientId
          )
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockPatient }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.getPatient.initiate(mockGetPatientQuery)
      );
      testApiSuccessResponse(action, mockPatient);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        patientAccountsSlice.endpoints.getPatient.initiate(mockGetPatientQuery)
      );
      testApiErrorResponse(action, errorMessage);
    });
  });
});
