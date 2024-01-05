import {
  LeaderHubIndividualProviderVisitsQueryParams,
  LeaderHubIndividualProviderVisitsParams,
} from '../../types';
import { environment } from '../../../environments/environment';

export const transformProviderVisitsParams = ({
  providerId,
  searchText,
  isAbxPrescribed,
  isEscalated,
  ...params
}: LeaderHubIndividualProviderVisitsParams): LeaderHubIndividualProviderVisitsQueryParams => ({
  ...params,
  id: providerId,
  search_text: searchText,
  is_abx_prescribed: isAbxPrescribed || undefined,
  is_escalated: isEscalated || undefined,
});

export const fullAvatarURL = (avatarURL?: string) => {
  if (!avatarURL) {
    return;
  }
  if (avatarURL.startsWith('http')) {
    return avatarURL;
  }

  return new URL(avatarURL, environment.stationURL).toString();
};
