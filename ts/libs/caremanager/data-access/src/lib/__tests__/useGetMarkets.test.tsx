import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from 'react-query';
import { useGetMarkets } from '../useGetMarkets';

const setup = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useGetMarkets(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

describe('useGetMarkets', () => {
  it('should return the list of markets', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.result.status).toBe('success'));

    expect(result.current.result.markets).toHaveLength(29);
  });

  it('should return a market by id', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.result.status).toBe('success'));

    expect(result.current.getMarket('159')).toEqual({
      id: '159',
      name: 'Denver',
      shortName: 'DEN',
      tzName: 'America/Denver',
      scheduleDays: [],
    });
  });

  it('should return undefined if the market is not found', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.result.status).toBe('success'));

    expect(result.current.getMarket('999')).toBeUndefined();
  });
});
