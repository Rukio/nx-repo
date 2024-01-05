import { act, renderHook } from '@testing-library/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearchParams } from '../useSearchParams';

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();

  return {
    ...mod,
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
  };
});

const useNavigateMock = vi.mocked(useNavigate);
const useLocationMock = vi.mocked(useLocation);

const setup = () => {
  return renderHook(() => useSearchParams());
};

describe('useSearchParams', () => {
  it('transforms the search parameters into an object', () => {
    useLocationMock.mockReturnValueOnce({
      search: '?name=John&age=30&hobby=reading&hobby=writing&hobby=running',
      pathname: '/some/path',
      key: '',
      hash: '',
      state: {},
    });

    const { result } = setup();

    expect(result.current.searchParamsObject).toEqual({
      name: 'John',
      age: '30',
      hobby: ['reading', 'writing', 'running'],
    });
  });

  it('updates the search parameters', () => {
    const navigateMock = vi.fn();
    useNavigateMock.mockReturnValueOnce(navigateMock);
    useLocationMock.mockReturnValueOnce({
      search: '?name=John',
      pathname: '/some/path',
      state: {},
      key: '',
      hash: '',
    });

    const { result } = setup();

    act(() => {
      result.current.setSearchParams({ name: 'Doe', age: '31' });
    });

    expect(navigateMock.mock.calls[0]).toEqual([
      {
        pathname: '/some/path',
        search: 'name=Doe&age=31',
      },
      { replace: true },
    ]);
  });

  it('appends a value to an existing search parameter', () => {
    const navigateMock = vi.fn();
    useNavigateMock.mockReturnValueOnce(navigateMock);
    useLocationMock.mockReturnValueOnce({
      search: '?hobby=reading',
      pathname: '/some/path',
      key: '',
      hash: '',
      state: {},
    });

    const { result } = setup();

    act(() => {
      result.current.setSearchParams({ hobby: ['reading', 'running'] });
    });

    expect(navigateMock.mock.calls[0]).toEqual([
      {
        pathname: '/some/path',
        search: 'hobby=reading&hobby=running',
      },
      { replace: true },
    ]);
  });

  it('deletes a search parameter', () => {
    const navigateMock = vi.fn();
    useNavigateMock.mockReturnValueOnce(navigateMock);
    useLocationMock.mockReturnValueOnce({
      search: '?name=John&age=30',
      pathname: '/some/path',
      key: '',
      hash: '',
      state: {},
    });

    const { result } = setup();

    act(() => {
      result.current.setSearchParams({ age: undefined });
    });

    expect(navigateMock.mock.calls[0]).toEqual([
      {
        pathname: '/some/path',
        search: 'name=John',
      },
      { replace: true },
    ]);
  });
});
