import {
  AccountAddress,
  AddressStatus,
} from '@*company-data-covered*/consumer-web-types';
import {
  PatientAccount,
  PatientAccountAddressData,
  PatientAccountPatient,
  DomainPatient,
  PatientAccountPatientLink,
  DomainPatientInsurance,
  DomainPatientAccountAddress,
  DomainUnverifiedPatient,
} from '../../types';
import {
  onlineSelfSchedulingApiSlice,
  OnlineSelfSchedulingApiSliceTag,
} from '../apiSlice';
import {
  UpdatePatientAccountPayload,
  CreatePatientAccountAddressPayload,
  UpdatePatientAccountAddressPayload,
  GetAccountPatientsQuery,
  CreatePatientAccountUnverifiedPatientPayload,
  AddPatientAccountUnverifiedPatientLinkPayload,
  CreatePatientAccountInsurancePayload,
  PatientAccountCheckEligibilityQuery,
  CreatePatientEhrRecordPayload,
  GetPatientInsurancesQuery,
  UpdatePatientAccountInsurancePayload,
  UpdateAccountPatientPayload,
  GetPatientQuery,
  DeletePatientInsuranceResult,
  DeletePatientInsuranceQuery,
} from './types';
import { preparePatientAccountAddressRequestData } from '../../utils/mappers';

export const PATIENT_ACCOUNTS_API_PATH = 'accounts';

export const ADDRESSES_SEGMENT = '/addresses';

export const PATIENTS_SEGMENT = '/patients';

export const ASSOCIATE_PATIENT_SEGMENT = '/associate-patient';

export const INSURANCES_SEGMENT = '/insurances';

export const CHECK_ELIGIBILITY_SEGMENT = '/check-eligibility';

export const EHR_RECORD_SEGMENT = '/ehr-record';

export const buildPatientAccountPath = (id: number | string) =>
  `${PATIENT_ACCOUNTS_API_PATH}/${id}`;

export const buildPatientAccountAddressPath = (id: string | number) =>
  `${PATIENT_ACCOUNTS_API_PATH}/${id}${ADDRESSES_SEGMENT}`;

export const buildUpdatePatientAccountAddressPath = (
  accountId: string | number,
  addressId: string | number
) => `${buildPatientAccountAddressPath(accountId)}/${addressId}`;

export const buildPatientAccountPatientsPath = (id: string | number) =>
  `${PATIENT_ACCOUNTS_API_PATH}/${id}${PATIENTS_SEGMENT}`;

export const buildAddUnverifiedAccountPatientLinkPath = (id: string | number) =>
  `${PATIENT_ACCOUNTS_API_PATH}/${id}${ASSOCIATE_PATIENT_SEGMENT}`;

export const buildPatientAccountInsurancesPath = (accountId: string | number) =>
  `${PATIENT_ACCOUNTS_API_PATH}/${accountId}${INSURANCES_SEGMENT}`;

export const buildPatientAccountCheckEligibilityPath = (
  accountId: string | number,
  insuranceId: string
) =>
  `${buildPatientAccountInsurancesPath(
    accountId
  )}/${insuranceId}${CHECK_ELIGIBILITY_SEGMENT}`;

export const buildCreatePatientEhrRecordPath = (accountId: string | number) =>
  `${buildPatientAccountPath(accountId)}${EHR_RECORD_SEGMENT}`;

export const buildPatientAccountInsurancePath = (
  accountId: string | number,
  insuranceId: string | number
) => `${buildPatientAccountInsurancesPath(accountId)}/${insuranceId}`;

export const buildAccountPatientPath = (
  accountId: string | number,
  patientId: string | number
) => `${buildPatientAccountPatientsPath(accountId)}/${patientId}`;

export const patientAccountsSlice =
  onlineSelfSchedulingApiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getAccount: builder.query<PatientAccount, void>({
        query: () => PATIENT_ACCOUNTS_API_PATH,
        transformResponse: ({ data }: { data: PatientAccount }) => data,
        providesTags: [OnlineSelfSchedulingApiSliceTag.PatientAccount],
      }),
      updateAccount: builder.mutation<
        PatientAccount,
        UpdatePatientAccountPayload
      >({
        query: ({ id, ...account }) => ({
          url: buildPatientAccountPath(id),
          method: 'PATCH',
          body: account,
        }),
        transformResponse: ({ data }: { data: PatientAccount }) => data,
        invalidatesTags: [OnlineSelfSchedulingApiSliceTag.PatientAccount],
      }),
      getAddresses: builder.query<DomainPatientAccountAddress[], number>({
        query: (accountId) => ({
          url: buildPatientAccountAddressPath(accountId),
          method: 'GET',
        }),
        transformResponse: ({
          data,
        }: {
          data: DomainPatientAccountAddress[];
        }) => data,
        providesTags: [OnlineSelfSchedulingApiSliceTag.PatientAccountAddresses],
      }),
      createAddress: builder.mutation<
        AccountAddress,
        CreatePatientAccountAddressPayload
      >({
        query: ({ accountId, ...accountAddress }) => ({
          url: buildPatientAccountAddressPath(accountId),
          method: 'POST',
          body: accountAddress,
        }),
        transformResponse: ({ data }: { data: AccountAddress }) => data,
        invalidatesTags: (res) =>
          res?.status === AddressStatus.VALID
            ? [OnlineSelfSchedulingApiSliceTag.PatientAccountAddresses]
            : [],
      }),
      updateAddress: builder.mutation<
        AccountAddress,
        UpdatePatientAccountAddressPayload
      >({
        query: ({ accountId, id: addressId, ...accountAddress }) => ({
          url: buildUpdatePatientAccountAddressPath(accountId, addressId),
          method: 'PATCH',
          body: accountAddress,
        }),
        transformResponse: ({ data }: { data: AccountAddress }) => data,
        invalidatesTags: (res) =>
          res?.status === AddressStatus.VALID
            ? [OnlineSelfSchedulingApiSliceTag.PatientAccountAddresses]
            : [],
      }),
      getAccountPatients: builder.query<
        PatientAccountPatient[],
        GetAccountPatientsQuery
      >({
        query: ({ id }) => buildPatientAccountPatientsPath(id),
        transformResponse: ({ data }: { data: PatientAccountPatient[] }) =>
          data,
        providesTags: [OnlineSelfSchedulingApiSliceTag.PatientAccountPatients],
      }),
      createUnverifiedPatient: builder.mutation<
        DomainUnverifiedPatient,
        CreatePatientAccountUnverifiedPatientPayload
      >({
        query: ({ accountId, unverifiedPatient }) => ({
          url: buildPatientAccountPatientsPath(accountId),
          method: 'POST',
          body: unverifiedPatient,
        }),
        transformResponse: ({ data }: { data: DomainUnverifiedPatient }) =>
          data,
      }),
      addUnverifiedAccountPatientLink: builder.mutation<
        PatientAccountPatientLink,
        AddPatientAccountUnverifiedPatientLinkPayload
      >({
        query: ({ accountId, ...data }) => ({
          url: buildAddUnverifiedAccountPatientLinkPath(accountId),
          method: 'PATCH',
          body: data,
        }),
        transformResponse: ({ data }: { data: PatientAccountPatientLink }) =>
          data,
        invalidatesTags: [
          OnlineSelfSchedulingApiSliceTag.PatientAccountPatients,
        ],
      }),
      createInsurance: builder.mutation<
        DomainPatientInsurance,
        CreatePatientAccountInsurancePayload
      >({
        query: ({ accountId, patientId, insuranceParams }) => ({
          url: buildPatientAccountInsurancesPath(accountId),
          params: { patientId },
          method: 'POST',
          body: insuranceParams,
        }),
        transformResponse: ({ data }: { data: DomainPatientInsurance }) => data,
        invalidatesTags: [OnlineSelfSchedulingApiSliceTag.PatientInsurances],
      }),
      checkEligibility: builder.mutation<
        DomainPatientInsurance,
        PatientAccountCheckEligibilityQuery
      >({
        query: ({ accountId, insuranceId, patientId }) => ({
          url: buildPatientAccountCheckEligibilityPath(accountId, insuranceId),
          params: { patientId },
          method: 'POST',
        }),
        transformResponse: ({ data }: { data: DomainPatientInsurance }) => data,
      }),
      createPatientEhrRecord: builder.mutation<
        DomainPatient,
        CreatePatientEhrRecordPayload
      >({
        query: ({ accountId, ...body }) => ({
          url: buildCreatePatientEhrRecordPath(accountId),
          method: 'POST',
          body,
        }),
        transformResponse: ({ data }: { data: DomainPatient }) => data,
        invalidatesTags: [
          OnlineSelfSchedulingApiSliceTag.PatientAccountPatients,
        ],
      }),
      getPatientInsurances: builder.query<
        DomainPatientInsurance[],
        GetPatientInsurancesQuery
      >({
        query: ({ accountId, patientId }) => ({
          url: buildPatientAccountInsurancesPath(accountId),
          params: { patientId },
        }),
        transformResponse: ({ data }: { data: DomainPatientInsurance[] }) =>
          data,
        providesTags: [OnlineSelfSchedulingApiSliceTag.PatientInsurances],
      }),
      updatePatientInsurance: builder.mutation<
        DomainPatientInsurance,
        UpdatePatientAccountInsurancePayload
      >({
        query: ({ accountId, patientId, insuranceId, insuranceParams }) => ({
          url: buildPatientAccountInsurancePath(accountId, insuranceId),
          params: { patientId },
          method: 'PUT',
          body: insuranceParams,
        }),
        transformResponse: ({ data }: { data: DomainPatientInsurance }) => data,
        invalidatesTags: [OnlineSelfSchedulingApiSliceTag.PatientInsurances],
      }),
      updateAccountPatient: builder.mutation<
        DomainPatient,
        UpdateAccountPatientPayload
      >({
        query: ({ accountId, patientId, patient }) => ({
          url: buildAccountPatientPath(accountId, patientId),
          method: 'PATCH',
          body: patient,
        }),
        transformResponse: ({ data }: { data: DomainPatient }) => data,
        invalidatesTags: [OnlineSelfSchedulingApiSliceTag.Patient],
      }),
      getPatient: builder.query<DomainPatient, GetPatientQuery>({
        query: ({ accountId, patientId }) => ({
          url: buildAccountPatientPath(accountId, patientId),
        }),
        transformResponse: ({ data }: { data: DomainPatient }) => data,
        providesTags: [OnlineSelfSchedulingApiSliceTag.Patient],
      }),
      deletePatientInsurance: builder.mutation<
        DeletePatientInsuranceResult,
        DeletePatientInsuranceQuery
      >({
        query: ({ accountId, patientId, insuranceId }) => ({
          url: buildPatientAccountInsurancePath(accountId, insuranceId),
          params: { patientId },
          method: 'DELETE',
        }),
        invalidatesTags: [OnlineSelfSchedulingApiSliceTag.PatientInsurances],
      }),
    }),
  });

export const selectDomainPatientAccount =
  patientAccountsSlice.endpoints.getAccount.select();

export const selectDomainPatientAccountPatients =
  patientAccountsSlice.endpoints.getAccountPatients.select;

export const selectDomainPatientAddresses =
  patientAccountsSlice.endpoints.getAddresses.select;

export const createPatientAccountAddress = (
  accountId: number,
  address: PatientAccountAddressData
) =>
  patientAccountsSlice.endpoints.createAddress.initiate(
    preparePatientAccountAddressRequestData(accountId, address)
  );

export const selectPatientInsurances =
  patientAccountsSlice.endpoints.getPatientInsurances.select;

export const selectPatient = patientAccountsSlice.endpoints.getPatient.select;

export const {
  useGetAccountQuery,
  useUpdateAccountMutation,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useGetAccountPatientsQuery,
  useCreateUnverifiedPatientMutation,
  useAddUnverifiedAccountPatientLinkMutation,
  useCreatePatientEhrRecordMutation,
  useGetAddressesQuery,
  useGetPatientInsurancesQuery,
  useUpdateAccountPatientMutation,
  useGetPatientQuery,
  useDeletePatientInsuranceMutation,
} = patientAccountsSlice;
