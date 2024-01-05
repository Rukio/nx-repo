export interface StationProviderProfile {
  position: string;
  provider_image: {
    url?: string;
    thumb: {
      url?: string;
    };
    tiny: {
      url?: string;
    };
  };
  is_public_profile: boolean;
  web_bio?: string;
}

export interface StationUserMarket {
  id: number;
  user_id: number;
  market_id: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface StationProvider {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  provider_image_tiny_url?: string;
  provider_profile_position: string;
  provider_profile_credentials: string;
  provider_profile: StationProviderProfile;
  user_markets: StationUserMarket[];
}

export interface ProviderProfile {
  position: string;
  providerImage: {
    url?: string;
    thumb: {
      url?: string;
    };
    tiny: {
      url?: string;
    };
  };
  isPublicProfile: boolean;
  webBio?: string;
}

export interface StationProviderProfileLicense {
  id: number;
  license_number: string;
  state: string;
  expiration: string;
}

export interface ProviderProfileLicense {
  id: number;
  licenseNumber: string;
  state: string;
  expiration: string;
}

export interface UserMarket {
  id: number;
  userId: number;
  marketId: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Provider {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  providerImageTinyUrl?: string;
  providerProfilePosition: string;
  providerProfileCredentials: string;
  providerProfile: ProviderProfile;
  userMarkets?: UserMarket[];
}
