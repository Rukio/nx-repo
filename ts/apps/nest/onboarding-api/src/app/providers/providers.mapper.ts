import {
  Provider,
  StationProvider,
  ProviderSearchParam,
  StationProviderSearchParam,
  ProviderSearchBody,
  StationProviderSearchBody,
} from '@*company-data-covered*/consumer-web-types';

const StationProviderToProvider = (input: StationProvider): Provider => {
  const output: Provider = {
    id: input.id,
    email: input.email,
    firstName: input.first_name,
    lastName: input.last_name,
    mobileNumber: input.mobile_number,
    providerImageTinyUrl: input.provider_image_tiny_url,
    providerProfile: input.provider_profile && {
      position: input.provider_profile.position,
      providerImage: input.provider_profile.provider_image,
      isPublicProfile: input.provider_profile.is_public_profile,
      webBio: input.provider_profile.web_bio,
    },
    providerProfileCredentials: input.provider_profile_credentials,
    providerProfilePosition: input.provider_profile_position,
    userMarkets:
      input.user_markets && input.user_markets.length
        ? input.user_markets.map((um) => ({
            id: um.id,
            userId: um.user_id,
            marketId: um.market_id,
            createdAt: um.created_at,
            updatedAt: um.updated_at,
          }))
        : [],
  };

  return output;
};

const ProviderQueryToStationProviderQuery = (
  input: ProviderSearchParam
): StationProviderSearchParam => {
  const output: StationProviderSearchParam = {
    secondary_screening_license_state: input.secondaryScreeningLicenseState,
    only_online: input.onlyOnline,
    not_on_shift: input.notOnShift,
  };

  return output;
};

const ProviderBodyToStationProviderBody = (
  input: ProviderSearchBody
): StationProviderSearchBody => {
  const output: StationProviderSearchBody = {
    secondary_screening_license_state: input.secondaryScreeningLicenseState,
    name: input.name,
  };

  return output;
};

export default {
  StationProviderToProvider,
  ProviderQueryToStationProviderQuery,
  ProviderBodyToStationProviderBody,
};
