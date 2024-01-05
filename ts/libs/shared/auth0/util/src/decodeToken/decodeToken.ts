import jwtDecode, { JwtPayload } from 'jwt-decode';
import { MarketRole, UserRoles } from '../constants';

type TokenProps = {
  email: string;
  id: number;
  identity_provider_user_id: string;
  market_role: MarketRole;
  markets: number[];
  roles: UserRoles[];
};

interface TokenPayload extends JwtPayload {
  'https://*company-data-covered*.com/email': string;
  'https://*company-data-covered*.com/type': string;
  'https://*company-data-covered*.com/props': TokenProps;
  azp: string;
  scope: string;
  permissions: string[];
}

export const getTokenProps = (token: string): TokenProps | null => {
  try {
    const tokenDecoded = jwtDecode<TokenPayload>(token);

    return tokenDecoded?.['https://*company-data-covered*.com/props'];
  } catch {
    return null;
  }
};
