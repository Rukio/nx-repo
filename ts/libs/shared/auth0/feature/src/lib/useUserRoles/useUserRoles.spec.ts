import { renderHook } from '@*company-data-covered*/shared/testing/react';
import { UserRoles } from '@*company-data-covered*/auth0/util';
import { useUserRoles } from './useUserRoles';

const mockedSelector = vi.fn();

vi.mock('react-redux', () => ({
  useSelector: () => mockedSelector(),
}));

describe('userUserRoles', () => {
  it.each([
    {
      input: [UserRoles.ADMIN, UserRoles.PROTOCOL_AUTHOR],
      currentRoles: [UserRoles.ADMIN],
      expected: [true, false],
    },
    {
      input: [UserRoles.ADMIN, UserRoles.PROTOCOL_AUTHOR],
      currentRoles: [UserRoles.ADMIN, UserRoles.PROTOCOL_AUTHOR],
      expected: [true, true],
    },
    {
      input: [UserRoles.ADMIN, UserRoles.PROTOCOL_AUTHOR],
      currentRoles: [],
      expected: [false, false],
    },
    {
      input: [],
      expected: [],
    },
  ])('should return proper result', ({ currentRoles, input, expected }) => {
    mockedSelector.mockReturnValueOnce(currentRoles);
    const { result } = renderHook(() => useUserRoles(input));

    expect(result.current).toEqual(expected);
  });
});
