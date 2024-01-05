import { MarketRole } from '../constants';
import { getTokenProps } from './decodeToken';

export const MOCK_JWT_TOKEN_APP =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2Rpc3BhdGNoaGVhbHRoLmNvbS9wcm9wcyI6eyJlbWFpbCI6InVzZXJAZGlzcGF0Y2hoZWFsdGguY29tIiwiaWQiOjEyMzQ1NiwiaWRlbnRpdHlfcHJvdmlkZXJfdXNlcl9pZCI6IlBIV2ZROW05c0s2QmdLbmZOS3hwdzJrZ21LM1hXYlBjbXVUZmJWRjJ1c3U3SHprRCIsIm1hcmtldF9yb2xlIjoiQVBQIiwibWFya2V0cyI6WzE3NywxOThdLCJyb2xlcyI6WyJhZG1pbiIsInByb3ZpZGVyIl19fQ.Vhdfu3v9XADAjD5yB4EFYo3SnTCaTEmDjYqOfRcoHCA';

const expectedProps = {
  email: 'user@*company-data-covered*.com',
  id: 123456,
  identity_provider_user_id: 'PHWfQ9m9sK6BgKnfNKxpw2kgmK3XWbPcmuTfbVF2usu7HzkD',
  market_role: MarketRole.APP,
  markets: [177, 198],
  roles: ['admin', 'provider'],
};

describe('getTokenProps', () => {
  it('should have market_role', () => {
    const tokenDecoded = getTokenProps(MOCK_JWT_TOKEN_APP);

    expect(tokenDecoded).toStrictEqual(expectedProps);
  });
});
