import { InsuranceNetwork } from '@*company-data-covered*/consumer-web-types';
import {
  InsuranceNetworkPayer,
  SearchNetworkFormProps,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { ImageUploadStatusState } from '@*company-data-covered*/design-system';

// TODO(ON-1149): remove mocked props
export const mockedSearchNetworkFormProps: Pick<
  SearchNetworkFormProps,
  | 'isAddAnotherInsuranceDisabled'
  | 'isInsuranceIneligible'
  | 'insuranceCardFrontUrl'
  | 'insuranceCardBackUrl'
  | 'cardFrontUploadStatus'
  | 'cardBackUploadStatus'
  | 'isUserShouldTakeInsurancePhotos'
  | 'submitButtonLabel'
> = {
  isAddAnotherInsuranceDisabled: false,
  isInsuranceIneligible: false,
  insuranceCardFrontUrl: '',
  insuranceCardBackUrl: '',
  cardFrontUploadStatus: ImageUploadStatusState.Completed,
  cardBackUploadStatus: ImageUploadStatusState.Completed,
  isUserShouldTakeInsurancePhotos: false,
  submitButtonLabel: 'Continue',
};

export const insuranceNetworkMock: InsuranceNetwork = {
  id: '1',
  name: 'Awesome Network 1',
  active: true,
  packageId: '123',
  notes: 'very cool network',
  insuranceClassificationId: '1',
  insurancePlanId: '1',
  insurancePayerId: '1',
  insurancePayerName: 'Medicaid Colorado',
  eligibilityCheck: true,
  providerEnrollment: true,
  claimsAddress: {
    streetAddress1: 'Address1',
    streetAddress2: 'Address2',
    city: 'City',
    state: 'Pennsylvania',
    zip: '80105',
  },
  createdAt: '2023-03-21T14:44:44.432Z',
  updatedAt: '2023-03-21T14:44:44.432Z',
  stateAbbrs: ['CO'],
  addresses: [],
};

export const insuranceNetworksMock: InsuranceNetwork[] = [
  insuranceNetworkMock,
  {
    ...insuranceNetworkMock,
    insurancePayerId: '2',
    insurancePayerName: 'G Insurance 2',
    stateAbbrs: ['DE'],
  },
  {
    ...insuranceNetworkMock,
    insurancePayerId: '3',
    insurancePayerName: 'Medicare Colorado',
    stateAbbrs: ['CO'],
  },
];

export const networkPayersMock: InsuranceNetworkPayer[] = [
  {
    id: '1',
    name: 'Medicaid Colorado',
    stateAbbrs: ['CO'],
    classificationId: '1',
    classificationName: 'Awesome Classification 1',
  },
  {
    id: '2',
    name: 'G Insurance 2',
    stateAbbrs: ['DE'],
    classificationId: '1',
    classificationName: 'Awesome Classification 1',
  },
  {
    id: '3',
    name: 'Medicare Colorado',
    stateAbbrs: ['CO'],
    classificationId: '1',
    classificationName: 'Awesome Classification 1',
  },
];
