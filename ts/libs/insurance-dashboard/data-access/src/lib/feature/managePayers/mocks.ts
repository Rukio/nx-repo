import {
  PayersQuery,
  PayersSortFields,
  PayersSortDirection,
} from '../../types';
import { InsurancePayer, InsurancePayerForm } from './types';

export const MOCKED_SEARCH_STRING = 'test string';

export const mockedPayerFormData: InsurancePayerForm = {
  name: 'payer',
  notes: 'my notes',
  active: true,
  payerGroupId: '1',
};

export const mockedPayerData: InsurancePayer = {
  id: 1,
  name: 'Awesome Payer',
  active: true,
  payerGroup: {
    name: 'payer group 1',
    payerGroupId: '1',
  },
  notes: 'very cool payer',
  createdAt: '2023-03-21T14:44:44.432Z',
  updatedAt: '2023-03-21T14:44:44.432Z',
  insuranceNetworks: [{ id: 1, name: 'network 1' }],
  stateAbbrs: ['state 1'],
};

export const mockedPayersFiltersData: PayersQuery = {
  sortField: PayersSortFields.NAME,
  sortDirection: PayersSortDirection.ASC,
  payerName: 'test',
  stateAbbrs: ['QW', 'WE'],
};
