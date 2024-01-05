import { AddressStatus } from '@*company-data-covered*/consumer-web-types';
import { setupTestStore } from '../../../testUtils';
import {
  buildCachePath,
  buildPatientAccountAddressPath,
  mockPatientAccount,
  mockPatientAccountAddressData,
  mockCreatePatientAccountAddressResponse,
  mockMarketsAvailabilityZipCode,
  patientAccountsSlice,
  PATIENT_ACCOUNTS_API_PATH,
  mockDomainPatientAccountAddress,
  mockSelfScheduleData,
  mockMarket,
  mockPatientAddress,
} from '../../domain';
import {
  managePatientAddressSlice,
  managePatientAddressInitialState,
  upsertPatientAddress,
  selectManagePatientAddressLoadingState,
  setExistingPatientAddress,
  selectPatientAddress,
  selectFormattedPatientAddress,
  selectPatientAddressData,
  updateAddressStatus,
  updateEnteredAddress,
} from './managePatientAddress.slice';
import { ManagePatientAddressState } from './types';

const mockedPatientAddressInitialData: Omit<
  ManagePatientAddressState,
  'isLoading' | 'isError' | 'isSuccess'
> = {
  enteredAddress: undefined,
  suggestedAddress: undefined,
  addressStatus: undefined,
  createdAddressId: undefined,
  createdAddressConsistencyToken: undefined,
};

const mockPatientAddressId = 1;

describe('managePatientAddress.slice', () => {
  it('should initialize default reducer state', () => {
    const state = managePatientAddressSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(managePatientAddressInitialState);
  });

  describe('reducers', () => {
    it('should update address status state on updateAddressStatus action', () => {
      const { store } = setupTestStore();

      const patientAddressData = selectPatientAddressData(store.getState());
      expect(patientAddressData).toEqual(mockedPatientAddressInitialData);

      store.dispatch(updateAddressStatus(AddressStatus.VALID));
      const updateAddressStatusData = selectPatientAddressData(
        store.getState()
      );
      expect(updateAddressStatusData).toEqual({
        ...mockedPatientAddressInitialData,
        addressStatus: AddressStatus.VALID,
      });
    });

    it('should update entered address state on updateEnteredAddress action', () => {
      const { store } = setupTestStore();

      const patientAddressData = selectPatientAddressData(store.getState());
      expect(patientAddressData).toEqual(mockedPatientAddressInitialData);

      store.dispatch(updateEnteredAddress(mockPatientAddress));
      const updateAddressStatusData = selectPatientAddressData(
        store.getState()
      );
      expect(updateAddressStatusData).toEqual({
        ...mockedPatientAddressInitialData,
        enteredAddress: mockPatientAddress,
      });
    });

    it('upsertPatientAddress should update the state on pending status', async () => {
      fetchMock.mockOnceIf(
        new RegExp(PATIENT_ACCOUNTS_API_PATH),
        JSON.stringify({
          data: mockPatientAccount,
        })
      );
      fetchMock.mockOnceIf(
        new RegExp(buildPatientAccountAddressPath(mockPatientAccount.id)),
        JSON.stringify({
          data: mockCreatePatientAccountAddressResponse,
        })
      );
      fetchMock.mockOnceIf(
        new RegExp(buildCachePath()),
        JSON.stringify({ success: true })
      );

      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.getAccount.initiate()
      );

      const initialLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePatientAddressInitialState.isLoading,
        isError: managePatientAddressInitialState.isError,
        isSuccess: managePatientAddressInitialState.isSuccess,
      });

      store.dispatch(
        upsertPatientAddress({
          patientAddress: mockPatientAccountAddressData,
          marketId: mockMarketsAvailabilityZipCode.marketId,
        })
      );

      const pendingLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('upsertPatientAddress should update the state on fulfilled status', async () => {
      fetchMock.mockOnceIf(
        new RegExp(PATIENT_ACCOUNTS_API_PATH),
        JSON.stringify({
          data: mockPatientAccount,
        })
      );
      fetchMock.mockOnceIf(
        new RegExp(buildPatientAccountAddressPath(mockPatientAccount.id)),
        JSON.stringify({
          data: mockCreatePatientAccountAddressResponse,
        })
      );
      fetchMock.mockOnceIf(
        new RegExp(buildCachePath()),
        JSON.stringify({ success: true })
      );

      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.getAccount.initiate()
      );

      const initialLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePatientAddressInitialState.isLoading,
        isError: managePatientAddressInitialState.isError,
        isSuccess: managePatientAddressInitialState.isSuccess,
      });

      await store.dispatch(
        upsertPatientAddress({
          patientAddress: mockPatientAccountAddressData,
          marketId: mockMarketsAvailabilityZipCode.marketId,
        })
      );

      const fulfilledLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('getAddresses should update the state on pending status', () => {
      fetchMock.mockResponse(
        JSON.stringify({
          data: [mockDomainPatientAccountAddress],
        })
      );
      const { store } = setupTestStore();

      const initialLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePatientAddressInitialState.isLoading,
        isError: managePatientAddressInitialState.isError,
        isSuccess: managePatientAddressInitialState.isSuccess,
      });

      store.dispatch(
        patientAccountsSlice.endpoints.getAddresses.initiate(
          mockPatientAccount.id
        )
      );

      const pendingLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: managePatientAddressInitialState.isError,
        isSuccess: managePatientAddressInitialState.isSuccess,
      });
    });

    it('getAddresses should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          data: [mockDomainPatientAccountAddress],
        })
      );
      const { store } = setupTestStore();

      const initialLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePatientAddressInitialState.isLoading,
        isError: managePatientAddressInitialState.isError,
        isSuccess: managePatientAddressInitialState.isSuccess,
      });

      await store.dispatch(
        patientAccountsSlice.endpoints.getAddresses.initiate(
          mockPatientAccount.id
        )
      );

      const updatedLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(updatedLoadingState).toEqual({
        isLoading: false,
        isError: managePatientAddressInitialState.isError,
        isSuccess: managePatientAddressInitialState.isSuccess,
      });
    });

    it('setExistingPatientAddress should update the state on pending status', async () => {
      fetchMock.mockResponse(JSON.stringify({ success: true }));

      const { store } = setupTestStore();

      const initialLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePatientAddressInitialState.isLoading,
        isError: managePatientAddressInitialState.isError,
        isSuccess: managePatientAddressInitialState.isSuccess,
      });

      store.dispatch(
        setExistingPatientAddress({
          addressId: mockPatientAddressId,
          marketId: mockMarket.id,
        })
      );

      const pendingLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('setExistingPatientAddress should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(JSON.stringify({ success: true }));

      const { store } = setupTestStore();

      const initialLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePatientAddressInitialState.isLoading,
        isError: managePatientAddressInitialState.isError,
        isSuccess: managePatientAddressInitialState.isSuccess,
      });

      await store.dispatch(
        setExistingPatientAddress({
          addressId: mockPatientAddressId,
          marketId: mockMarket.id,
        })
      );

      const fulfilledLoadingState = selectManagePatientAddressLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });
  });

  describe('thunks', () => {
    describe('upsertPatientAddress', () => {
      it.each([
        {
          name: 'falsy isError if successfully created address and updated cache',
          mockGetPatientAccountResponse: () =>
            JSON.stringify({
              data: mockPatientAccount,
            }),
          mockCreateAddressResponse: () =>
            JSON.stringify({
              data: mockCreatePatientAccountAddressResponse,
            }),
          mockUpdateCacheResponse: () => JSON.stringify({ success: true }),
          expectedData: {
            isError: false,
            isUpsertPatientAddressError: false,
            isUpdateCacheError: false,
            addressStatus: AddressStatus.VALID,
            suggestedAddress:
              mockCreatePatientAccountAddressResponse.suggestedAddress,
            createdAddressId:
              mockCreatePatientAccountAddressResponse.address?.id,
            createdAddressConsistencyToken:
              mockCreatePatientAccountAddressResponse.consistencyToken,
          },
        },
        {
          name: 'truthy isError if an error when getting patient account',
          mockGetPatientAccountResponse: () => {
            throw new Error();
          },
          mockCreateAddressResponse: () =>
            JSON.stringify({
              data: mockCreatePatientAccountAddressResponse,
            }),
          mockUpdateCacheResponse: () => JSON.stringify({ success: true }),
          expectedData: {
            isError: true,
            isUpsertPatientAddressError: false,
            isUpdateCacheError: false,
            addressStatus: undefined,
            suggestedAddress: undefined,
            createdAddressId: undefined,
            createdAddressConsistencyToken: undefined,
          },
        },
        {
          name: 'truthy isError if an error when creating an address',
          mockGetPatientAccountResponse: () =>
            JSON.stringify({
              data: mockPatientAccount,
            }),
          mockCreateAddressResponse: () => {
            throw new Error();
          },
          mockUpdateCacheResponse: () => JSON.stringify({ success: true }),
          expectedData: {
            isError: true,
            isUpsertPatientAddressError: true,
            isUpdateCacheError: false,
            addressStatus: undefined,
            suggestedAddress: undefined,
            createdAddressId: undefined,
            createdAddressConsistencyToken: undefined,
          },
        },
        {
          name: 'truthy isError if an error when updating an cache',
          mockGetPatientAccountResponse: () =>
            JSON.stringify({
              data: mockPatientAccount,
            }),
          mockCreateAddressResponse: () =>
            JSON.stringify({
              data: mockCreatePatientAccountAddressResponse,
            }),
          mockUpdateCacheResponse: () => {
            throw new Error();
          },
          expectedData: {
            isError: true,
            isUpsertPatientAddressError: false,
            isUpdateCacheError: true,
            addressStatus: AddressStatus.VALID,
            suggestedAddress:
              mockCreatePatientAccountAddressResponse.suggestedAddress,
            createdAddressId:
              mockCreatePatientAccountAddressResponse.address?.id,
            createdAddressConsistencyToken:
              mockCreatePatientAccountAddressResponse.consistencyToken,
          },
        },
        {
          name: 'falsy isError if successfully created address and not updated cache, because address status is "needs_confirmation"',
          mockGetPatientAccountResponse: () =>
            JSON.stringify({
              data: mockPatientAccount,
            }),
          mockCreateAddressResponse: () =>
            JSON.stringify({
              data: {
                ...mockCreatePatientAccountAddressResponse,
                status: AddressStatus.CONFIRM,
              },
            }),
          mockUpdateCacheResponse: () => JSON.stringify({ success: true }),
          expectedData: {
            isError: false,
            isUpsertPatientAddressError: false,
            isUpdateCacheError: false,
            addressStatus: AddressStatus.CONFIRM,
            suggestedAddress:
              mockCreatePatientAccountAddressResponse.suggestedAddress,
            createdAddressId:
              mockCreatePatientAccountAddressResponse.address?.id,
            createdAddressConsistencyToken:
              mockCreatePatientAccountAddressResponse.consistencyToken,
          },
        },
      ])(
        'should return $name',
        async ({
          mockGetPatientAccountResponse,
          mockCreateAddressResponse,
          mockUpdateCacheResponse,
          expectedData,
        }) => {
          fetchMock.mockOnceIf(
            new RegExp(PATIENT_ACCOUNTS_API_PATH),
            mockGetPatientAccountResponse
          );
          fetchMock.mockOnceIf(
            new RegExp(buildPatientAccountAddressPath(mockPatientAccount.id)),
            mockCreateAddressResponse
          );
          fetchMock.mockOnceIf(
            new RegExp(buildCachePath()),
            mockUpdateCacheResponse
          );

          const { store } = setupTestStore();

          await store.dispatch(
            patientAccountsSlice.endpoints.getAccount.initiate()
          );

          const data = await store
            .dispatch(
              upsertPatientAddress({
                patientAddress: mockPatientAccountAddressData,
                marketId: mockMarketsAvailabilityZipCode.marketId,
              })
            )
            .unwrap();

          expect(data).toEqual(expectedData);
        }
      );

      it.each([
        {
          name: 'falsy isError if successfully updated address and cache',
          props: {
            createdAddressConsistencyToken:
              mockCreatePatientAccountAddressResponse.consistencyToken,
          },
          expectedData: {
            isError: false,
            isUpsertPatientAddressError: false,
            isUpdateCacheError: false,
            addressStatus: AddressStatus.VALID,
            suggestedAddress:
              mockCreatePatientAccountAddressResponse.suggestedAddress,
            createdAddressId:
              mockCreatePatientAccountAddressResponse.address?.id,
            createdAddressConsistencyToken:
              mockCreatePatientAccountAddressResponse.consistencyToken,
          },
        },
        {
          name: "truthy isError if 'createdAddressConsistencyToken' value is not provided",
          props: {
            createdAddressConsistencyToken: undefined,
          },
          expectedData: {
            isError: true,
            isUpsertPatientAddressError: false,
            isUpdateCacheError: false,
            addressStatus: undefined,
            suggestedAddress: undefined,
            createdAddressId: undefined,
            createdAddressConsistencyToken: undefined,
          },
        },
      ])('should return $name', async ({ props, expectedData }) => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );
        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountAddressPath(mockPatientAccount.id)),
          JSON.stringify({
            data: mockCreatePatientAccountAddressResponse,
          })
        );
        fetchMock.mockOnceIf(
          new RegExp(buildCachePath()),
          JSON.stringify({ success: true })
        );

        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        const data = await store
          .dispatch(
            upsertPatientAddress({
              ...props,
              patientAddress: mockPatientAccountAddressData,
              marketId: mockMarketsAvailabilityZipCode.marketId,
              createdAddressId:
                mockCreatePatientAccountAddressResponse.address?.id,
            })
          )
          .unwrap();

        expect(data).toEqual(expectedData);
      });
    });

    describe('setExistingPatientAddress', () => {
      it.each([
        {
          name: 'false isError if successfully updates cache with existing address',
          mockCacheResponse: () => JSON.stringify({ success: true }),
          expectedData: { isError: false },
        },
        {
          name: 'truthy isError if got an error when updating a cache',
          mockCacheResponse: () => {
            throw new Error();
          },
          expectedData: { isError: true },
        },
      ])('should return $name', async ({ mockCacheResponse, expectedData }) => {
        fetchMock.mockOnceIf(new RegExp(buildCachePath()), mockCacheResponse);
        const { store } = setupTestStore();

        const data = await store
          .dispatch(
            setExistingPatientAddress({
              addressId: mockPatientAddressId,
              marketId: mockMarket.id,
            })
          )
          .unwrap();

        expect(data).toEqual(expectedData);
      });
    });
  });

  describe('selectors', () => {
    describe('selectPatientAddress', () => {
      it('should select correct patient', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockResponse(
          JSON.stringify({ data: [mockDomainPatientAccountAddress] })
        );

        const { store } = setupTestStore({
          manageSelfSchedule: { data: mockSelfScheduleData },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAddresses.initiate(
            mockPatientAccount.id
          )
        );

        const result = selectPatientAddress()(store.getState());
        expect(result).toEqual(mockDomainPatientAccountAddress);
      });

      it('should return null if patientId is not same', async () => {
        fetchMock.mockResponse(
          JSON.stringify({ data: [mockDomainPatientAccountAddress] })
        );

        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getAddresses.initiate(
            mockPatientAccount.id
          )
        );

        const result = selectPatientAddress()(store.getState());
        expect(result).toBeNull();
      });

      it('should return null if account patients list is empty', async () => {
        const { store } = setupTestStore();

        const result = selectPatientAddress()(store.getState());
        expect(result).toBeNull();
      });
    });

    describe('selectFormattedPatientAddress', () => {
      it('should select correct patient', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockResponse(
          JSON.stringify({ data: [mockDomainPatientAccountAddress] })
        );

        const { store } = setupTestStore({
          manageSelfSchedule: { data: mockSelfScheduleData },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAddresses.initiate(
            mockPatientAccount.id
          )
        );

        const result = selectFormattedPatientAddress()(store.getState());
        expect(result).toEqual(
          `${mockDomainPatientAccountAddress.streetAddress1}, ${mockDomainPatientAccountAddress.streetAddress2} ${mockDomainPatientAccountAddress.city}, ${mockDomainPatientAccountAddress.state} ${mockDomainPatientAccountAddress.zip}`
        );
      });

      it('should return null if account patients list is empty', async () => {
        const { store } = setupTestStore();

        const result = selectFormattedPatientAddress()(store.getState());
        expect(result).toBe('');
      });
    });
  });
});
