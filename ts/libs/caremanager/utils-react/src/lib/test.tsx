import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { QueryClient, QueryClientProvider } from 'react-query';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

export function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();

  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={testQueryClient}>
        <SnackbarProvider
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {ui}
        </SnackbarProvider>
      </QueryClientProvider>
    ),
  };
}

export function getByPlaceholderText(text = '') {
  return screen.getByPlaceholderText(text);
}

export const labelAndValueQueryMatcher =
  (label: string, value?: string) => (_: string, node: Element | null) =>
    node?.textContent === label + value;
