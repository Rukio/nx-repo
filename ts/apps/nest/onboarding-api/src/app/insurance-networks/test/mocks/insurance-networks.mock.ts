import {
  InsuranceNetworkRequest,
  InsuranceServiceNetworkCreditCardRule,
  ServicesInsuranceNetworkRequest,
  InsurancePayer,
  InsuranceServicePayer,
  ServicesInsuranceNetwork,
  InsuranceNetwork,
} from '@*company-data-covered*/consumer-web-types';
import GetInsurancePayerDto from '../../../self-schedule/dto/insurance-payer.dto';

export const MOCK_INSURANCE_NETWORK_ID = 10;

export const MOCK_INSURANCE_NETWORK: InsuranceNetwork = {
  id: MOCK_INSURANCE_NETWORK_ID.toString(),
  name: 'testName_1680012840004218108_1',
  notes: 'InsuranceNetworks',
  packageId: '0',
  insuranceClassificationId: '4',
  insurancePlanId: '214',
  insurancePayerId: '2',
  eligibilityCheck: true,
  providerEnrollment: true,
  active: true,
  createdAt: '2023-03-28T14:14:00.015590Z',
  updatedAt: '2023-03-28T14:14:00.015590Z',
  deletedAt: null,
  stateAbbrs: ['DE'],
  insurancePayerName: '',
  claimsAddress: {
    state: 'DEN',
    city: 'Denver',
    zip: '20805',
    streetAddress1: 'Northfolk street 100',
    streetAddress2: '',
  },
  addresses: [
    {
      state: 'DEN',
      city: 'Denver',
      zip: '20805',
      streetAddress1: 'Northfolk street 100',
      streetAddress2: '',
    },
  ],
};

export const MOCK_SERVICES_INSURANCE_NETWORKS: ServicesInsuranceNetwork = {
  id: MOCK_INSURANCE_NETWORK.id,
  name: MOCK_INSURANCE_NETWORK.name,
  notes: MOCK_INSURANCE_NETWORK.notes,
  packageId: MOCK_INSURANCE_NETWORK.packageId,
  insuranceClassificationId: MOCK_INSURANCE_NETWORK.insuranceClassificationId,
  insurancePlanId: MOCK_INSURANCE_NETWORK.insurancePlanId,
  insurancePayerId: MOCK_INSURANCE_NETWORK.insurancePayerId,
  address: {
    addressLineOne: MOCK_INSURANCE_NETWORK.claimsAddress.streetAddress1,
    city: MOCK_INSURANCE_NETWORK.claimsAddress.city,
    zipCode: MOCK_INSURANCE_NETWORK.claimsAddress.zip,
    state: MOCK_INSURANCE_NETWORK.claimsAddress.state,
  },
  eligibilityCheck: MOCK_INSURANCE_NETWORK.eligibilityCheck,
  providerEnrollment: MOCK_INSURANCE_NETWORK.providerEnrollment,
  active: MOCK_INSURANCE_NETWORK.active,
  createdAt: MOCK_INSURANCE_NETWORK.createdAt,
  updatedAt: MOCK_INSURANCE_NETWORK.updatedAt,
  deletedAt: MOCK_INSURANCE_NETWORK.deletedAt,
  stateAbbrs: MOCK_INSURANCE_NETWORK.stateAbbrs,
  insurancePayerName: MOCK_INSURANCE_NETWORK.insurancePayerName,
  addresses: [
    {
      addressLineOne: 'Northfolk street 100',
      city: 'Denver',
      zipCode: '20805',
      state: 'DEN',
    },
  ],
};

export const MOCK_INSURANCE_NETWORKS_SERVICE_RESULT: InsuranceNetwork[] = [
  {
    id: '4',
    name: 'testName_1680012840004218108_1',
    ...MOCK_INSURANCE_NETWORK,
  },
  {
    id: '5',
    name: 'testName_1680012840004218108_2',
    ...MOCK_INSURANCE_NETWORK,
  },
  {
    id: '6',
    name: 'testName_1680012840004218108_3',
    ...MOCK_INSURANCE_NETWORK,
  },
];

export const MOCK_SERVICES_INSURANCE_NETWORKS_RESPONSE = {
  networks: [
    {
      id: '0',
      name: 'nameOne',
      ...MOCK_SERVICES_INSURANCE_NETWORKS,
    },
    {
      id: '2',
      name: 'nameTwo',
      ...MOCK_SERVICES_INSURANCE_NETWORKS,
    },
    {
      id: '3',
      name: 'name three',
      ...MOCK_SERVICES_INSURANCE_NETWORKS,
    },
  ],
};

export const MOCK_SERVICES_INSURANCE_NETWORK_RESPONSE = {
  network: {
    ...MOCK_SERVICES_INSURANCE_NETWORKS,
  },
};

export const MOCK_INSURANCE_NETWORKS_CREDIT_CARD_RULES: InsuranceServiceNetworkCreditCardRule[] =
  [
    {
      id: MOCK_INSURANCE_NETWORK_ID.toString(),
      serviceLineId: '11',
      creditCardRule: 'REQUIRED',
    },
  ];

export const MOCK_FETCH_INSURANCE_NETWORK_RESULT = {
  success: true,
  data: MOCK_INSURANCE_NETWORK,
};

export const MOCK_SEARCH_INSURANCE_NETWORKS_RESULT = {
  success: true,
  data: MOCK_INSURANCE_NETWORKS_SERVICE_RESULT,
};

export const MOCK_LIST_INSURANCE_NETWORKS_CREDIT_CARD_RULES_RESULT = {
  success: true,
  data: MOCK_INSURANCE_NETWORKS_CREDIT_CARD_RULES,
};

export const MOCK_INSURANCE_NETWORKS_CREDIT_CARD_RULES_RESPONSE = {
  creditCardRules: MOCK_INSURANCE_NETWORKS_CREDIT_CARD_RULES,
};

export const MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS: InsuranceNetworkRequest = {
  payerIds: ['2'],
  insuranceClassifications: ['4', '0'],
  packageIds: ['1'],
  sortField: 'update',
  sortDirection: 'asc',
};

export const MOCK_SEARCH_INSURANCE_NETWORKS_ALL_PARAMS: InsuranceNetworkRequest =
  {
    payerIds: ['2'],
    insuranceClassifications: ['4', '0'],
    search: 'test',
    sortField: 'update',
    sortDirection: 'asc',
    billingCityId: 59,
    packageIds: ['3', '4'],
  };

export const MOCK_SEARCH_SERVICES_INSURANCE_NETWORKS_ALL_PARAMS: ServicesInsuranceNetworkRequest =
  {
    payer_ids: ['2'],
    insurance_classifications: ['4', '0'],
    search: 'test',
    sort_field: 2,
    sort_direction: 1,
    billing_city_id: 59,
    package_ids: ['3', '4'],
  };

export const MOCK_SEARCH_INSURANCE_NETWORKS_SORT_PARAMS: InsuranceNetworkRequest =
  {
    sortField: 'name',
    sortDirection: 'desc',
  };

export const MOCKS_SEARCH_INSURANCE_NETWORKS_NULL_SORT_PARAMS: InsuranceNetworkRequest =
  {
    sortField: null,
    sortDirection: null,
  };

export const MOCK_SEARCH_SERVICES_INSURANCE_NETWORKS_SORT_PARAMS: ServicesInsuranceNetworkRequest =
  {
    sort_field: 1,
    sort_direction: 2,
  };

export const MOCK_SEARCH_SERVICES_INSURANCE_NETWORKS_NULL_SORT_PARAMS: ServicesInsuranceNetworkRequest =
  {
    sort_field: 0,
    sort_direction: 0,
  };

export const MOCK_INSURANCE_PAYER_REQUEST_ALL_PARAMS: GetInsurancePayerDto = {
  stateAbbrs: ['TX'],
  payerName: 'John',
  sortField: 1,
  sortDirection: 1,
};

export const MOCK_INSURANCE_PAYER_ALL_PARAMS: InsurancePayer = {
  id: 1,
  name: 'John',
  notes: 'notes',
  active: true,
  payerGroupId: 1,
  createdAt: '2023-03-28T14:14:00.015590Z',
  updatedAt: '2023-03-28T14:14:00.015590Z',
  deletedAt: '2023-03-28T14:14:00.015590Z',
  stateAbbrs: ['TX'],
};

export const MOCK_INSURANCE_SERVICES_PAYER_ALL_PARAMS: InsuranceServicePayer = {
  ...MOCK_INSURANCE_PAYER_ALL_PARAMS,
  insuranceNetworks: [
    {
      id: 3,
      name: 'Insurance Network',
      packageId: 4,
      insuranceClassificationId: 5,
      insurancePlanId: 6,
    },
  ],
};
