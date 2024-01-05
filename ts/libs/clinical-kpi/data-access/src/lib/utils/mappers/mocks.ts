import { LeaderHubIndividualProviderVisitsParams } from '../../types';

export const mockedLeaderHubIndividualProviderVisitsParams: LeaderHubIndividualProviderVisitsParams =
  {
    providerId: '116600',
    page: 1,
    searchText: 'John',
    isAbxPrescribed: true,
    isEscalated: true,
  };

export const mockedLeaderHubIndividualProviderVisitsParamsFalseFilters: LeaderHubIndividualProviderVisitsParams =
  {
    ...mockedLeaderHubIndividualProviderVisitsParams,
    isAbxPrescribed: false,
    isEscalated: false,
  };
