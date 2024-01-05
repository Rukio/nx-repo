import { Provider } from 'react-redux';
import {
  AUTH_FEATURE_KEY,
  setupTestStore,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { MarketRole } from '@*company-data-covered*/auth0/util';

import { MOCK_JWT_TOKEN_APP, MOCK_JWT_TOKEN_MARKET_MANAGER } from '../../mocks';
import { ALLOWED_ROLES } from '../../constants';
import { renderHook } from '../../util/testUtils';
import useUserMarketRolePermission from './useUserMarketRolePermission';

describe('useUserMarketRolePermission', () => {
  it.each([
    {
      accessToken: MOCK_JWT_TOKEN_APP,
      role: MarketRole.APP,
      expected: false,
    },
    {
      accessToken: MOCK_JWT_TOKEN_MARKET_MANAGER,
      role: MarketRole.MarketManager,
      expected: true,
    },
  ])(
    'should return $expected if the market role is $role',
    ({ accessToken, expected }) => {
      const store = setupTestStore({
        [AUTH_FEATURE_KEY]: {
          accessToken,
        },
      });
      const { result } = renderHook(
        () => useUserMarketRolePermission(ALLOWED_ROLES),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        }
      );

      expect(result.current).toBe(expected);
    }
  );
});
