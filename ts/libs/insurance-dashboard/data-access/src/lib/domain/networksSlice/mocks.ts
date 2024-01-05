import {
  DomainInsuranceNetwork,
  DomainNetworkCreditCardRule,
  NetworkCreditCardRules,
  DomainNetworkAppointmentType,
} from '../../types';
import {
  InsuranceNetworkServiceLineAppointmentType,
  NetworkServiceLineWithAppointmentTypes,
} from '../../feature/manageNetworks/types';

export const mockedInsuranceNetwork: DomainInsuranceNetwork = {
  id: 1,
  name: 'Awesome Network 1',
  active: true,
  packageId: '123',
  notes: 'very cool network',
  insuranceClassificationId: '1',
  insurancePlanId: '1',
  insurancePayerId: '1',
  eligibilityCheck: true,
  providerEnrollment: true,
  address: {
    addressLineOne: 'Address 1',
    city: 'City 1',
    state: 'Pennsylvania',
    zipCode: '80105',
  },
  createdAt: '2023-03-21T14:44:44.432Z',
  updatedAt: '2023-03-21T14:44:44.432Z',
  deletedAt: null,
  stateAbbrs: ['AS1'],
  emcCode: '123Code',
  addresses: [
    {
      addressLineOne: 'Address 1',
      city: 'City 1',
      state: 'Pennsylvania',
      zipCode: '80105',
    },
  ],
};

export const mockedStateAbbrs: string[] = ['OH', 'OR', 'RI'];

export const mockedInsuranceNetworksList: DomainInsuranceNetwork[] = [
  mockedInsuranceNetwork,
  {
    ...mockedInsuranceNetwork,
    id: 2,
    name: 'Awesome Network 2',
    address: {
      ...mockedInsuranceNetwork.address,
      state: 'Colorado',
    },
    stateAbbrs: ['AS2'],
  },
  {
    ...mockedInsuranceNetwork,
    id: 3,
    name: 'Awesome Network 3',
    insuranceClassificationId: '2',
  },
];

export const mockedFilteredByStateInsuranceNetworksList: DomainInsuranceNetwork[] =
  [mockedInsuranceNetworksList[0], mockedInsuranceNetworksList[2]];

export const mockedFilteredByClassificationInsuranceNetworksList: DomainInsuranceNetwork[] =
  [mockedInsuranceNetworksList[2]];

export const mockedInsuranceNetworkCreditCardRules: DomainNetworkCreditCardRule[] =
  [
    {
      id: 1,
      serviceLineId: '1',
      creditCardRule: NetworkCreditCardRules.optional,
    },
    {
      id: 2,
      serviceLineId: '2',
      creditCardRule: NetworkCreditCardRules.disabled,
    },
  ];

export const mockedInsuranceNetworkAppointmentTypes: DomainNetworkAppointmentType[] =
  [
    {
      id: '1',
      modalityType: '1',
      networkId: '1',
      serviceLineId: '1',
      newPatientAppointmentType: '1',
      existingPatientAppointmentType: '1',
    },
    {
      id: '2',
      modalityType: '2',
      networkId: '2',
      serviceLineId: '2',
      newPatientAppointmentType: '2',
      existingPatientAppointmentType: '2',
    },
  ];

export const mockedDifferentInsuranceNetworkAppointmentTypes: DomainNetworkAppointmentType[] =
  [
    {
      id: '1',
      modalityType: '1',
      networkId: '1',
      serviceLineId: '1',
      newPatientAppointmentType: '1',
      existingPatientAppointmentType: '2',
    },
    {
      id: '2',
      modalityType: '2',
      networkId: '2',
      serviceLineId: '2',
      newPatientAppointmentType: '2',
      existingPatientAppointmentType: '1',
    },
  ];

export const mockedServiceLineNetworkAppointmentTypes: InsuranceNetworkServiceLineAppointmentType[] =
  [
    {
      modalityType: '1',
      networkId: '1',
      serviceLineId: '1',
      newPatientAppointmentType: '1',
      existingPatientAppointmentType: '1',
    },
    {
      modalityType: '2',
      networkId: '2',
      serviceLineId: '2',
      newPatientAppointmentType: '2',
      existingPatientAppointmentType: '2',
    },
  ];

export const mockedServiceLineAcuteCare: NetworkServiceLineWithAppointmentTypes =
  {
    serviceLineId: '1',
    serviceLineName: 'Acute Care',
    disabled: false,
    newPatientAppointmentType: '1',
    existingPatientAppointmentType: '1',
  };
