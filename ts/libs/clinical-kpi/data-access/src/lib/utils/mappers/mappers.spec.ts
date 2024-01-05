import { transformProviderVisitsParams } from './mappers';
import {
  mockedLeaderHubIndividualProviderVisitsParams,
  mockedLeaderHubIndividualProviderVisitsParamsFalseFilters,
} from './mocks';

describe('utils mappers', () => {
  describe('transformProviderVisitsParams', () => {
    it('should transform provider visits params', () => {
      const result = transformProviderVisitsParams(
        mockedLeaderHubIndividualProviderVisitsParams
      );
      expect(result).toEqual({
        id: mockedLeaderHubIndividualProviderVisitsParams.providerId,
        page: mockedLeaderHubIndividualProviderVisitsParams.page,
        search_text: mockedLeaderHubIndividualProviderVisitsParams.searchText,
        is_abx_prescribed:
          mockedLeaderHubIndividualProviderVisitsParams.isAbxPrescribed,
        is_escalated: mockedLeaderHubIndividualProviderVisitsParams.isEscalated,
      });
    });

    it('should transform provider visits params when abx and escalated is false', () => {
      const result = transformProviderVisitsParams(
        mockedLeaderHubIndividualProviderVisitsParamsFalseFilters
      );
      expect(result).toEqual({
        id: mockedLeaderHubIndividualProviderVisitsParamsFalseFilters.providerId,
        page: mockedLeaderHubIndividualProviderVisitsParamsFalseFilters.page,
        search_text:
          mockedLeaderHubIndividualProviderVisitsParamsFalseFilters.searchText,
        is_abx_prescribed: undefined,
        is_escalated: undefined,
      });
    });
  });
});
