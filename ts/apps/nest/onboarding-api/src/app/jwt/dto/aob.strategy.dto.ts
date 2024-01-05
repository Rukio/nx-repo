export interface AOBStrategyJwtPayloadDto {
  'https://*company-data-covered*.com/email': string;
  'https://*company-data-covered*.com/type': string;
  'https://*company-data-covered*.com/props': {
    email: string;
    id: number;
    identity_provider_user_id: string;
    market_role: string;
    markets: number[];
    roles: string[];
  };
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  azp: string;
  scope: string;
  permissions: string[];
}
