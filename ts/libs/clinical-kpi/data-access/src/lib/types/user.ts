import { ProviderProfile, Market } from './common';

export interface AuthenticatedUser {
  id: string;
  firstName: string;
  email: string;
  markets: Market[];
  providerProfile: ProviderProfile;
}
