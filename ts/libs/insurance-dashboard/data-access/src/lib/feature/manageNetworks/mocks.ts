import {
  InsuranceNetworkForm,
  InsuranceNetwork,
  InsuranceNetworkServiceLineCreditCardRule,
  InsuranceAddress,
} from './types';
import { DomainServiceLine, NetworkCreditCardRules } from '../../types';
import { PatchNetworkStatesPayload, mockedServiceLine } from '../../domain';

export const mockedNetworkAddress: Required<InsuranceAddress> = {
  addressLineOne: 'Address 1',
  city: 'City 1',
  stateName: 'Pennsylvania',
  zipCode: '80105',
};

export const mockedNetworkFormData: Required<InsuranceNetworkForm> = {
  name: 'Awesome Network 1',
  insuranceClassificationId: '1',
  packageId: '123',
  notes: 'very cool network',
  active: true,
  eligibilityCheck: true,
  providerEnrollment: true,
  address: mockedNetworkAddress,
  insurancePayerId: '1',
  insurancePlanId: '1',
  emcCode: '123Code',
  addresses: [mockedNetworkAddress],
};

export const mockedMultipleNetworkAddresses: InsuranceAddress[] = Array(3)
  .fill(mockedNetworkAddress)
  .map((address, index) => ({
    ...address,
    addressLineOne: `${address.addressLineOne} ${index + 1}`,
    city: `${address.city} ${index + 1}`,
  }));

export const mockedCreditCardRules: InsuranceNetworkServiceLineCreditCardRule[] =
  [
    { serviceLineId: '1', creditCardRule: NetworkCreditCardRules.optional },
    { serviceLineId: '2', creditCardRule: NetworkCreditCardRules.required },
    { serviceLineId: '3', creditCardRule: NetworkCreditCardRules.disabled },
  ];

export const mockedNetworkServiceLines: DomainServiceLine[] = [
  { ...mockedServiceLine, id: '1', name: 'Service Line 1' },
  { ...mockedServiceLine, id: '2', name: 'Service Line 2' },
  { ...mockedServiceLine, id: '3', name: 'Service Line 3' },
];

export const mockedNetworkRowData: InsuranceNetwork = {
  id: 1,
  name: 'Awesome Network 1',
  classification: 'Awesome Classification 1',
  packageId: '123',
  updatedAt: '2023-03-21T14:44:44.432Z',
  stateAbbrs: ['AS1'],
};

export const mockedPatchNetworkStatesInitialData: PatchNetworkStatesPayload = {
  networkId: '1',
  stateAbbrs: ['OH', 'OR', 'RI'],
};
