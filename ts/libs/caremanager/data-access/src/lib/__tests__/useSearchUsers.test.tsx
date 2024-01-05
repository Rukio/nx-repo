import { SearchUsersResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from 'react-query';
import { useSearchUsers } from '../useSearchUsers';

const setup = (searchTerm: string) => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useSearchUsers(searchTerm), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

describe('useSearchUsers', () => {
  it('should return a valid search result', async () => {
    const { result } = setup('Pab');

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data).toEqual(
      SearchUsersResponseFromJSON({ users: [JSONMocks.users.users[3]] })
    );
  });

  it('should return an empty array if the search term is empty', async () => {
    const { result } = setup('');

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data).toEqual(
      SearchUsersResponseFromJSON({ users: [] })
    );
  });

  it('should return an empty array if the search term is less than 3 characters', async () => {
    const { result } = setup('Pa');

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data).toEqual(
      SearchUsersResponseFromJSON({ users: [] })
    );
  });

  it('should return an empty array if there are no results', async () => {
    const { result } = setup('false');

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data).toEqual(
      SearchUsersResponseFromJSON({ users: [] })
    );
  });
});
