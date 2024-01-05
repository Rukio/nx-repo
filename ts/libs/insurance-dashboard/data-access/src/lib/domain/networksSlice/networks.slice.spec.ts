import {
  testApiSuccessResponse,
  testApiErrorResponse,
  testApiUpdateSuccessResponse,
  testApiUpdateErrorResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import { setupTestStore } from '../../../testUtils';
import {
  networksSlice,
  NETWORKS_API_PATH,
  NETWORK_API_SEARCH_FRAGMENT,
  InsuranceNetworkRequestDataPayload,
  SearchInsuranceNetworkPayload,
  NETWORK_API_CREDIT_CARD_RULES_FRAGMENT,
  NETWORK_API_SERVICE_LINES_FRAGMENT,
  buildNetworkCreditCardRulesPath,
  buildNetworkServiceLinesPath,
  PatchNetworkStatesDomainPayload,
  NETWORK_STATES_API_FRAGMENT,
  buildNetworkStatesPath,
  buildNetworkPath,
  buildNetworkAppointmentTypesPath,
  NETWORK_API_APPOINTMENT_TYPES_FRAGMENT,
  PathInsuranceNetworkAppointmentTypesPayload,
} from './networks.slice';
import {
  mockedFilteredByStateInsuranceNetworksList,
  mockedInsuranceNetwork,
  mockedInsuranceNetworkCreditCardRules,
  mockedInsuranceNetworksList,
  mockedStateAbbrs,
  mockedInsuranceNetworkAppointmentTypes,
} from './mocks';
import { mockedServiceLinesList } from '../serviceLines/mocks';
import { environment } from '../../../environments/environment';
import { mockedNetworkFormData } from '../../feature';
import { NetworksSortDirection, NetworksSortField } from '../../types';

const { serviceURL } = environment;

const mockedCreateNetworkData: InsuranceNetworkRequestDataPayload = {
  name: 'My New Network',
  active: true,
  packageId: '1',
  notes: 'very cool network',
  insuranceClassificationId: '1',
  insurancePlanId: '1',
  insurancePayerId: '1',
  eligibilityCheck: true,
  providerEnrollment: true,
  address: {},
  emcCode: '123Code',
  addresses: [],
};
const mockedPatchNetworkStatesData: PatchNetworkStatesDomainPayload = {
  network_id: '1',
  state_abbrs: mockedStateAbbrs,
};

const mockedInsurancePayerId = '1';

const mockedSearchAllInsuranceNetworksPayload: SearchInsuranceNetworkPayload = {
  payerIds: [mockedInsurancePayerId],
  sortField: NetworksSortField.NAME,
  sortDirection: NetworksSortDirection.ASC,
  showInactive: true,
};

const mockedSearchFilteredInsuranceNetworksPayload: Required<SearchInsuranceNetworkPayload> =
  {
    payerIds: [mockedInsurancePayerId],
    stateAbbrs: ['AL', 'AK', 'AZ'],
    insuranceClassifications: ['1'],
    sortField: NetworksSortField.NAME,
    sortDirection: NetworksSortDirection.ASC,
    showInactive: true,
  };

const mockedPatchNetworkAppointmentTypesData: PathInsuranceNetworkAppointmentTypesPayload =
  {
    networkId: '1',
    appointmentTypes: mockedInsuranceNetworkAppointmentTypes,
  };

describe('networks.slice', () => {
  describe('build api urls', () => {
    it.each([
      {
        name: buildNetworkPath.name,
        buildFn: () => buildNetworkPath(mockedInsuranceNetwork.id),
        expected: `${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}`,
      },
      {
        name: buildNetworkCreditCardRulesPath.name,
        buildFn: () =>
          buildNetworkCreditCardRulesPath(mockedInsuranceNetwork.id),
        expected: `${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}/${NETWORK_API_CREDIT_CARD_RULES_FRAGMENT}`,
      },
      {
        name: buildNetworkServiceLinesPath.name,
        buildFn: () => buildNetworkServiceLinesPath(mockedInsuranceNetwork.id),
        expected: `${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}/${NETWORK_API_SERVICE_LINES_FRAGMENT}`,
      },
      {
        name: buildNetworkStatesPath.name,
        buildFn: () => buildNetworkStatesPath(mockedInsuranceNetwork.id),
        expected: `${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}/${NETWORK_STATES_API_FRAGMENT}`,
      },
      {
        name: buildNetworkAppointmentTypesPath.name,
        buildFn: () =>
          buildNetworkAppointmentTypesPath(mockedInsuranceNetwork.id),
        expected: `${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}/${NETWORK_API_APPOINTMENT_TYPES_FRAGMENT}`,
      },
    ])('should build correct API url with $name', ({ buildFn, expected }) => {
      const path = buildFn();
      expect(path).toEqual(expected);
    });
  });

  describe('getNetwork', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ network: mockedNetworkFormData })
      );
      const store = setupTestStore();
      await store.dispatch(
        networksSlice.endpoints.getNetwork.initiate(mockedInsuranceNetwork.id)
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ network: mockedNetworkFormData })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.getNetwork.initiate(mockedInsuranceNetwork.id)
      );
      testApiSuccessResponse(action, mockedNetworkFormData);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Network does not exist.';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.getNetwork.initiate(mockedInsuranceNetwork.id)
      );
      testApiErrorResponse(action, errorMessage);
    });
  });

  describe('createNetwork', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(
        networksSlice.endpoints.createNetwork.initiate(mockedCreateNetworkData)
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(`${serviceURL}${NETWORKS_API_PATH}`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ network: mockedInsuranceNetwork })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.createNetwork.initiate(mockedCreateNetworkData)
      );
      testApiUpdateSuccessResponse(action, { network: mockedInsuranceNetwork });
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.createNetwork.initiate(mockedCreateNetworkData)
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('searchNetworksList', () => {
    it('should make correct API call to get all networks', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ networks: mockedInsuranceNetworksList })
      );
      const store = setupTestStore();
      await store.dispatch(
        networksSlice.endpoints.searchNetworksList.initiate(
          mockedSearchAllInsuranceNetworksPayload
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(
        `${serviceURL}${NETWORKS_API_PATH}/${NETWORK_API_SEARCH_FRAGMENT}`
      );
    });

    it('should make correct API call to get filtered networks with search insurance network payload', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ networks: mockedFilteredByStateInsuranceNetworksList })
      );
      const store = setupTestStore();
      await store.dispatch(
        networksSlice.endpoints.searchNetworksList.initiate(
          mockedSearchFilteredInsuranceNetworksPayload
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(
        `${serviceURL}${NETWORKS_API_PATH}/${NETWORK_API_SEARCH_FRAGMENT}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ networks: [mockedInsuranceNetwork] })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.searchNetworksList.initiate(
          mockedSearchAllInsuranceNetworksPayload
        )
      );
      testApiUpdateSuccessResponse(action, [mockedInsuranceNetwork]);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.searchNetworksList.initiate(
          mockedSearchAllInsuranceNetworksPayload
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('patchNetwork', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(
        networksSlice.endpoints.patchNetwork.initiate(mockedInsuranceNetwork)
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('PATCH');
      expect(url).toEqual(
        `${serviceURL}${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ network: mockedInsuranceNetwork })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.patchNetwork.initiate(mockedInsuranceNetwork)
      );
      testApiUpdateSuccessResponse(action, { network: mockedInsuranceNetwork });
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.patchNetwork.initiate(mockedInsuranceNetwork)
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getNetworkCreditCardRules', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          creditCardRules: mockedInsuranceNetworkCreditCardRules,
        })
      );
      const store = setupTestStore();
      await store.dispatch(
        networksSlice.endpoints.getNetworkCreditCardRules.initiate(
          mockedInsuranceNetwork.id
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}/${NETWORK_API_CREDIT_CARD_RULES_FRAGMENT}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          creditCardRules: mockedInsuranceNetworkCreditCardRules,
        })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.getNetworkCreditCardRules.initiate(
          mockedInsuranceNetwork.id
        )
      );
      testApiUpdateSuccessResponse(
        action,
        mockedInsuranceNetworkCreditCardRules
      );
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.getNetworkCreditCardRules.initiate(
          mockedInsuranceNetwork.id
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('patchNetworkCreditCardRules', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(
        networksSlice.endpoints.patchNetworkCreditCardRules.initiate({
          networkId: mockedInsuranceNetwork.id,
          creditCardRules: mockedInsuranceNetworkCreditCardRules,
        })
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('PATCH');
      expect(url).toEqual(
        `${serviceURL}${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}/${NETWORK_API_CREDIT_CARD_RULES_FRAGMENT}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({}));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.patchNetworkCreditCardRules.initiate({
          networkId: mockedInsuranceNetwork.id,
          creditCardRules: mockedInsuranceNetworkCreditCardRules,
        })
      );
      testApiUpdateSuccessResponse(action, {});
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.patchNetworkCreditCardRules.initiate({
          networkId: mockedInsuranceNetwork.id,
          creditCardRules: mockedInsuranceNetworkCreditCardRules,
        })
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getNetworkServiceLines', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          serviceLines: mockedServiceLinesList,
        })
      );
      const store = setupTestStore();
      await store.dispatch(
        networksSlice.endpoints.getNetworkServiceLines.initiate(
          mockedInsuranceNetwork.id
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}/${NETWORK_API_SERVICE_LINES_FRAGMENT}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          serviceLines: mockedServiceLinesList,
        })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.getNetworkServiceLines.initiate(
          mockedInsuranceNetwork.id
        )
      );
      testApiUpdateSuccessResponse(action, mockedServiceLinesList);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.getNetworkServiceLines.initiate(
          mockedInsuranceNetwork.id
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('patchNetworkStates', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          state_abbrs: mockedStateAbbrs,
        })
      );
      const store = setupTestStore();
      const { network_id } = mockedPatchNetworkStatesData;
      await store.dispatch(
        networksSlice.endpoints.patchNetworkStates.initiate(
          mockedPatchNetworkStatesData
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('PATCH');
      expect(url).toEqual(
        `${serviceURL}${NETWORKS_API_PATH}/${network_id}/${NETWORK_STATES_API_FRAGMENT}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          state_abbrs: mockedStateAbbrs,
        })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.patchNetworkStates.initiate(
          mockedPatchNetworkStatesData
        )
      );
      testApiUpdateSuccessResponse(action, mockedStateAbbrs);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.patchNetworkStates.initiate(
          mockedPatchNetworkStatesData
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getNetworkAppointmentTypes', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          appointmentTypes: mockedInsuranceNetworkAppointmentTypes,
        })
      );
      const store = setupTestStore();
      await store.dispatch(
        networksSlice.endpoints.getNetworkAppointmentTypes.initiate(
          mockedInsuranceNetwork.id
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${NETWORKS_API_PATH}/${mockedInsuranceNetwork.id}/${NETWORK_API_APPOINTMENT_TYPES_FRAGMENT}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          appointmentTypes: mockedInsuranceNetworkAppointmentTypes,
        })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.getNetworkAppointmentTypes.initiate(
          mockedInsuranceNetwork.id
        )
      );
      testApiUpdateSuccessResponse(
        action,
        mockedInsuranceNetworkAppointmentTypes
      );
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.getNetworkAppointmentTypes.initiate(
          mockedInsuranceNetwork.id
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('patchNetworkAppointmentTypes', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      const { networkId } = mockedPatchNetworkAppointmentTypesData;
      await store.dispatch(
        networksSlice.endpoints.patchNetworkAppointmentTypes.initiate(
          mockedPatchNetworkAppointmentTypesData
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('PATCH');
      expect(url).toEqual(
        `${serviceURL}${NETWORKS_API_PATH}/${networkId}/${NETWORK_API_APPOINTMENT_TYPES_FRAGMENT}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          appointmentTypes: mockedInsuranceNetworkAppointmentTypes,
        })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.patchNetworkAppointmentTypes.initiate(
          mockedPatchNetworkAppointmentTypesData
        )
      );
      testApiUpdateSuccessResponse(action, {
        appointmentTypes: mockedInsuranceNetworkAppointmentTypes,
      });
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        networksSlice.endpoints.patchNetworkAppointmentTypes.initiate(
          mockedPatchNetworkAppointmentTypesData
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });
});
