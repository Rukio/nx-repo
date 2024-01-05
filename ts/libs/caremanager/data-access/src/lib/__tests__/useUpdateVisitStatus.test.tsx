import { rest } from 'msw';
import { SnackbarProvider } from 'notistack';
import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import * as utils from '@*company-data-covered*/caremanager/utils';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useUpdateVisitStatus } from '../useUpdateVisitStatus';
import { server } from '../../test/mockServer';
import {
  UpdateVisitResponseFromJSON,
  UpdateVisitStatusOption,
} from '@*company-data-covered*/caremanager/data-access-types';

const showWarningMock = vi.fn();
const showErrorMock = vi.fn();

describe('useUpdateVisitStatus', () => {
  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () => {
    vi.spyOn(utils, 'useSnackbar').mockImplementation(() => ({
      showWarning: showWarningMock,
      showError: showErrorMock,
      showSuccess: vi.fn(),
    }));

    return renderHook(() => useUpdateVisitStatus(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          <SnackbarProvider>{children}</SnackbarProvider>
        </QueryClientProvider>
      ),
    });
  };

  it('should return the updated visit', async () => {
    const { result } = setupHook();

    act(() => {
      result.current.mutate({
        visitId: JSONMocks.visit.visit.id,
        body: { status: UpdateVisitStatusOption.OnRoute },
      });
    });

    const expectedVisitData = {
      visit: { ...JSONMocks.visit.visit, status: 'on_route' },
    };

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      UpdateVisitResponseFromJSON(expectedVisitData)
    );
  });

  it('should show warning notification when shift team is not available', async () => {
    const { result } = setupHook();

    server.use(
      rest.patch('/v1/visits/:id/status', (_, res, ctx) => {
        return res(ctx.status(503));
      })
    );

    act(() => {
      result.current.mutate({
        visitId: JSONMocks.visit.visit.id,
        body: { status: UpdateVisitStatusOption.Committed },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.error).toBeTruthy();
    expect(showWarningMock).toHaveBeenCalledWith(
      'An available shift team could not be found, try again later.'
    );
    expect(showErrorMock).not.toHaveBeenCalled();
  });

  it('should show server error', async () => {
    const { result } = setupHook();

    server.use(
      rest.patch('/v1/visits/:id/status', (_, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({
          visitId: JSONMocks.visit.visit.id,
          body: { status: UpdateVisitStatusOption.Committed },
        });
      } catch (_) {
        // noop
      }
    });

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.error).toBeTruthy();
    expect(showWarningMock).not.toHaveBeenCalled();
    expect(showErrorMock).toHaveBeenCalled();
  });
});
