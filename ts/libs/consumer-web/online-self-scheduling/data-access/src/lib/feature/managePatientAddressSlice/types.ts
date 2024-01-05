import {
  AccountAddress,
  AddressStatus,
  SuggestedAddress,
} from '@*company-data-covered*/consumer-web-types';
import { DomainPatientAccountAddress, PatientAddress } from '../../types';

export type ManagePatientAddressState = {
  enteredAddress?: PatientAddress;
  suggestedAddress?: SuggestedAddress;
  addressStatus?: AddressStatus;
  createdAddressId?: DomainPatientAccountAddress['id'];
  createdAddressConsistencyToken?: AccountAddress['consistencyToken'];
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
};

export type PatientAddressOption = {
  value: string;
  label: string;
  zip: string;
};
