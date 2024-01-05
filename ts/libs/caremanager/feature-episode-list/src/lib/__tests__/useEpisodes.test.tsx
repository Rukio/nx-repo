import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ROWS_PER_PAGE_OPTIONS } from '@*company-data-covered*/caremanager/utils';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  CarePhase,
  CarePhaseFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import useEpisodes, { getCarePhases } from '../useEpisodes';

const allCarePhases: CarePhase[] = [];
JSONMocks.config.care_phases.forEach((carePhase) =>
  allCarePhases.push(CarePhaseFromJSON(carePhase))
);

const setup = () => {
  const queryClient = new QueryClient();

  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <MemoryRouter initialEntries={[{ pathname: '/', hash: '' }]}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );

  const { result } = renderHook(() => useEpisodes(), {
    wrapper: Wrapper,
  });

  return result;
};

describe('useEpisodes', () => {
  it('rowsPerPage', () => {
    const result = setup();

    expect(result.current.rowsPerPage).toStrictEqual(ROWS_PER_PAGE_OPTIONS[0]);
    expect(typeof result.current.setRowsPerPage).toBe('function');

    act(() => {
      result.current.setRowsPerPage(ROWS_PER_PAGE_OPTIONS[1]);
    });
    expect(result.current.rowsPerPage).toStrictEqual(ROWS_PER_PAGE_OPTIONS[1]);
  });

  describe('getCarePhases', () => {
    it('returns default care phases', () => {
      const result = getCarePhases(undefined, allCarePhases);
      const defaultCarePhases = allCarePhases.reduce<string[]>(
        (result, carePhase) => {
          if (!carePhase.name.startsWith('Closed')) {
            result.push(carePhase.id.toString());
          }

          return result;
        },
        []
      );
      expect(result).toEqual(defaultCarePhases);
    });

    it('returns undefined care phases when Closed are selected', () => {
      const result = getCarePhases(['5', '8'], allCarePhases);
      expect(result).toBeUndefined();
    });
  });
});
