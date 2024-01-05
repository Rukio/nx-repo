import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useHash } from '../useHash';

const setup = (initialEntries: Record<string, string>[]) => {
  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
  const { result } = renderHook(
    () =>
      useHash({
        initialState: { first: false, second: false },
        hashPattern: 'test',
      }),
    { wrapper: Wrapper }
  );

  return result;
};

describe('useHash', () => {
  it('with empty hash', () => {
    const result = setup([{ pathname: '/', hash: '' }]);

    expect(result.current.hash).toStrictEqual({
      first: false,
      second: false,
    });
    expect(typeof result.current.handleChange).toBe('function');

    act(() => {
      result.current.handleChange('second')(false, true);
    });
    expect(result.current.hash).toStrictEqual({
      first: false,
      second: true,
    });
  });

  it('with hash present', () => {
    const result = setup([{ pathname: '/', hash: '#first-test' }]);

    expect(result.current.hash).toStrictEqual({
      first: true,
      second: false,
    });

    act(() => {
      result.current.handleChange('second')(false, true);
    });
    expect(result.current.hash).toStrictEqual({
      first: true,
      second: true,
    });
  });
});
