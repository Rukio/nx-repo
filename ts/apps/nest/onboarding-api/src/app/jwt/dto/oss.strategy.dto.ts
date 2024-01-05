export interface OssStrategyJwtPayloadDto {
  'https://*company-data-covered*.com/type': string;
  'https://*company-data-covered*.com/props': {
    email: string;
    identity_provider_user_id: string;
  };
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  azp: string;
  scope: string;
}
