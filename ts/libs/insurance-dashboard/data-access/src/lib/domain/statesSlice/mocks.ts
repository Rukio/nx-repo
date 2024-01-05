import { DomainState } from '../../types';

export const mockedStatePA: DomainState = {
  id: '1',
  name: 'Pennsylvania',
  abbreviation: 'PA',
  billingCities: [
    {
      id: '1',
      name: 'Awesome City',
      enabled: false,
      marketId: '1',
      shortName: 'AWC',
      state: 'PA',
    },
  ],
};

export const mockedStateCO: DomainState = {
  id: '2',
  name: 'Colorado',
  abbreviation: 'CO',
  billingCities: [
    {
      id: '2',
      name: 'Awesome City',
      enabled: false,
      marketId: '2',
      shortName: 'AWC',
      state: 'CO',
    },
  ],
};

export const mockedStates: DomainState[] = [mockedStatePA, mockedStateCO];
