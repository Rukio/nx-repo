import { StationProvider } from '@*company-data-covered*/consumer-web-types';
import ProvidersQueryDto from '../../dto/providers-params.dto';
import ProviderCallSearchParamsDto from '../../dto/providers-call-search.dto';
import ProvidersBodyDto from '../../dto/provider-search.dto';

export const STATION_PROVIDER_MOCK: StationProvider = {
  id: 70613,
  email: 'zachary.acosta@*company-data-covered*.com',
  first_name: 'Zachary',
  last_name: 'Acosta',
  mobile_number: '303-500-1518',
  provider_image_tiny_url:
    'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/1505/tiny_zac.jpg',
  provider_profile: {
    position: 'emt',
    provider_image: {
      url: 'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/1505/zac.jpg',
      thumb: {
        url: 'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/1505/thumb_zac.jpg',
      },
      tiny: {
        url: 'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/1505/tiny_zac.jpg',
      },
    },
    is_public_profile: false,
    web_bio: '',
  },
  provider_profile_credentials: '',
  provider_profile_position: 'emt',
  user_markets: [
    {
      id: 22502,
      user_id: 70613,
      market_id: 193,
      created_at: '2020-11-19T23:36:27.363Z',
      updated_at: '2020-11-19T23:36:27.363Z',
    },
  ],
};

export const PROVIDER_QUERY_MOCK: ProvidersQueryDto = {
  secondaryScreeningLicenseState: 'MA',
  onlyOnline: true,
  notOnShift: true,
};

export const PROVIDER_CALL_SEARCH_PARAMS_MOCK: ProviderCallSearchParamsDto = {
  genesysId: '3323ds-32d2d32-s32d32',
  mobileNumber: '3035001518',
};

export const PROVIDERS_BODY_MOCK: ProvidersBodyDto = {
  secondaryScreeningLicenseState: 'CO',
  name: 'zach',
};
