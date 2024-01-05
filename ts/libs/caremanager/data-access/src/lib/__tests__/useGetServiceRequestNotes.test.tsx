import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from 'react-query';
import { useGetServiceRequestNotes } from '../useGetServiceRequestNotes';

const setup = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useGetServiceRequestNotes('1'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

describe('useGetServiceRequestNotes', () => {
  it('should return the fetched service request notes', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data?.notes).toHaveLength(2);
  });
});
