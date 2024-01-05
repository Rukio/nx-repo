export const aobStrategyPayloadMock = {
  'https://*company-data-covered*.com/email': 'test@*company-data-covered*.com',
  'https://*company-data-covered*.com/type': 'user',
  'https://*company-data-covered*.com/props': {
    email: 'test@*company-data-covered*.com',
    id: 999999,
    identity_provider_user_id: 'email|test',
    market_role: null,
    markets: [177, 202, 213],
    roles: ['user', 'admin'],
  },
  iss: 'https://staging-auth.*company-data-covered*.com/',
  sub: 'email|test',
  aud: [
    'internal.*company-data-covered*.com',
    'https://dispatch-development.auth0.com/userinfo',
  ],
  iat: 1690543163,
  exp: 1690629563,
  azp: 'ddhsjsjsjs',
  scope: 'openid profile email',
  permissions: [],
};
