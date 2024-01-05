import { renderHook } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import useCreditCardQueryParams from './useCreditCardQueryParams';

const RouterProvider = ({
  children,
  routerProps,
}: {
  children: React.ReactNode;
  routerProps: MemoryRouterProps;
}) => {
  return <MemoryRouter {...routerProps}>{children}</MemoryRouter>;
};

const setup = (routerProps: MemoryRouterProps = {}) => {
  return renderHook(() => useCreditCardQueryParams(), {
    wrapper: ({ children }: { children: React.ReactElement }) => (
      <RouterProvider children={children} routerProps={routerProps} />
    ),
  });
};

describe('useCreditCardQueryParams', () => {
  it('should return null params if no query is provided', () => {
    const { result } = setup();
    expect(result.current).toStrictEqual({
      amount: null,
      departmentId: null,
      patientId: null,
    });
  });

  it('should return correct params if query is provided', () => {
    const mockParams = {
      amount: '10.50',
      departmentId: '232',
      patientId: '12',
    };
    const mockQueryString = new URLSearchParams(mockParams);
    const { result } = setup({
      initialEntries: [`/?${mockQueryString}`],
    });
    expect(result.current).toStrictEqual(mockParams);
  });
});
