import { WEB_REQUEST_ROUTES } from '../../constants';
import { UserFlow } from '../../types';

export const getRoutesByUserFlow = ({
  userFlow,
}: { userFlow?: UserFlow } = {}) => {
  const transformedRoutes = {
    ...WEB_REQUEST_ROUTES,
  };

  if (userFlow?.renderHowItWorksPage) {
    transformedRoutes.howItWorks = '/';
  } else {
    transformedRoutes.requestHelp = '/';
  }

  return transformedRoutes;
};
