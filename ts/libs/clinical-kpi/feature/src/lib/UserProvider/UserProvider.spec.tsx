import { screen, waitFor } from '@testing-library/react';
import { setUser } from '@*company-data-covered*/shared/datadog/util';
import UserProvider from './UserProvider';
import { interceptQuery, render } from '../util/testUtils';
import { mockedAuthenticatedUser } from '@*company-data-covered*/clinical-kpi/data-access';
import { USER_INTERCEPT_URL } from '../util/testUtils/server/handlers';

jest.mock('@*company-data-covered*/shared/datadog/util', () => ({
  setUser: jest.fn(),
}));

describe('UserProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('API returns an authenticated user', () => {
    it('should render children', async () => {
      render(
        <UserProvider>
          <p>Test Children</p>
        </UserProvider>
      );
      const childElement = await screen.findByText('Test Children');
      expect(childElement).toBeTruthy();
      expect(setUser).toHaveBeenCalledTimes(1);
      expect(setUser).toHaveBeenCalledWith({
        id: mockedAuthenticatedUser.id,
        email: mockedAuthenticatedUser.email,
        name: mockedAuthenticatedUser.firstName,
      });
    });
  });

  describe('API is fetching a user', () => {
    it('should render loading container', async () => {
      render(
        <UserProvider>
          <p>Test Children</p>
        </UserProvider>
      );
      const loadingView = await screen.findAllByTestId('user-provider-loading');
      expect(loadingView).toBeTruthy();
      expect(setUser).not.toHaveBeenCalled();
    });
  });

  describe('API failed to return an authenticated user', () => {
    beforeEach(() => {
      interceptQuery({ url: USER_INTERCEPT_URL, statusCode: 500 });
    });

    it('should throw the error', () => {
      //if we make it() async the whole test will fail due to throw Error
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      async () => {
        await waitFor(() => {
          expect(() => {
            render(
              <UserProvider>
                <p>Test Children</p>
              </UserProvider>
            );
          }).toThrowError();
        });
      };
      expect(setUser).not.toHaveBeenCalled();
    });
  });
});
