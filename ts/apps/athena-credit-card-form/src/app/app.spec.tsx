import { ATHENA_CREDIT_CARD_FORM_ROUTES } from '@*company-data-covered*/athena-credit-card-form/feature';
import { ReactElement } from 'react';
import { render, screen } from '../testUtils';

import App from './app';

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn().mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    loginWithRedirect: jest.fn(),
    getIdTokenClaims: jest.fn(() => Promise.resolve({ __raw: 'test-token' })),
  }),
  Auth0Provider: ({ children }: { children: ReactElement }) => children,
}));

describe('App', () => {
  it('should render Collect Payment page if path is home', async () => {
    render(
      <App />,
      {},
      {
        withRouter: true,
        routerProps: { initialEntries: [ATHENA_CREDIT_CARD_FORM_ROUTES.HOME] },
      }
    );

    const collectPaymentTitle = await screen.findByText('Collect Payment');
    expect(collectPaymentTitle).toBeVisible();
  });

  it('should render Collect Payment page if path is correct', async () => {
    render(
      <App />,
      {},
      {
        withRouter: true,
        routerProps: {
          initialEntries: [ATHENA_CREDIT_CARD_FORM_ROUTES.COLLECT_PAYMENT],
        },
      }
    );

    const collectPaymentTitle = await screen.findByText('Collect Payment');
    expect(collectPaymentTitle).toBeVisible();
  });

  it('should render Save Card on File page if path is correct', async () => {
    render(
      <App />,
      {},
      {
        withRouter: true,
        routerProps: {
          initialEntries: [ATHENA_CREDIT_CARD_FORM_ROUTES.SAVE_CARD_ON_FILE],
        },
      }
    );

    const collectPaymentTitle = await screen.findByText('Save Card on File');
    expect(collectPaymentTitle).toBeVisible();
  });
});
