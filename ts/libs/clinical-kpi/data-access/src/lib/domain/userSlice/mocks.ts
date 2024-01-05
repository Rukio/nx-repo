import { AuthenticatedUser } from '../../types';

export const mockedAuthenticatedUser: AuthenticatedUser = {
  id: '1',
  firstName: 'Jim',
  email: 'jim.1@test.com',
  markets: [
    {
      id: '198',
      name: 'Columbus',
      shortName: 'COL',
    },
    {
      id: '176',
      name: 'Boise',
      shortName: 'BOI',
    },
  ],
  providerProfile: {
    credentials: 'NP',
    position: 'PM',
  },
};
