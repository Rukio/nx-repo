import { DomainInsurancePayer } from '../../types';

export const mockedInsurancePayer: DomainInsurancePayer = {
  id: 1,
  name: 'Awesome Payer',
  active: true,
  payerGroupId: '1',
  notes: 'very cool payer',
  createdAt: '2023-03-21T14:44:44.432Z',
  updatedAt: '2023-03-21T14:44:44.432Z',
  insuranceNetworks: [{ id: 1, name: 'network 1' }],
  stateAbbrs: ['state 1'],
};
