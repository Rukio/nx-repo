import { authSlice } from '@*company-data-covered*/auth0/data-access';
import { UserRoles } from '@*company-data-covered*/auth0/util';
import {
  insuranceDashboardApiSlice,
  manageNetworkModalitiesSlice,
  manageNetworksSlice,
  managePayersSlice,
  notificationsSlice,
} from '@*company-data-covered*/insurance/data-access';
import { createRenderFunction } from '@*company-data-covered*/shared/testing/react';

const customRender = createRenderFunction(
  {
    [authSlice.name]: authSlice.reducer,
    [insuranceDashboardApiSlice.reducerPath]:
      insuranceDashboardApiSlice.reducer,
    [managePayersSlice.name]: managePayersSlice.reducer,
    [notificationsSlice.name]: notificationsSlice.reducer,
    [manageNetworksSlice.name]: manageNetworksSlice.reducer,
    [manageNetworkModalitiesSlice.name]: manageNetworkModalitiesSlice.reducer,
  },
  [insuranceDashboardApiSlice.middleware]
);

export const renderWithManagePermissions: typeof customRender = (
  ui,
  options = {
    withRouter: true,
  }
) => {
  const { preloadedState, ...restOptions } = options;

  return customRender(ui, {
    preloadedState: {
      [authSlice.name]: {
        // set default role as insurance admin for all tests.
        userRoles: [UserRoles.INSURANCE_ADMIN],
      },
      ...preloadedState,
    },
    ...restOptions,
  });
};

export const renderForReadOnlyRole: typeof customRender = (
  ui,
  options = {
    withRouter: true,
  }
) => {
  const { preloadedState, ...restOptions } = options;

  return customRender(ui, {
    preloadedState: {
      [authSlice.name]: {
        // set default role as insurance reader for all tests.
        userRoles: [UserRoles.INSURANCE_READER],
      },
      ...preloadedState,
    },
    ...restOptions,
  });
};

export * from '@testing-library/react';
export { renderWithManagePermissions as render };
