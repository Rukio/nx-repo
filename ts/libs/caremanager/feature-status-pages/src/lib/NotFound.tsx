import { Link as RouterLink } from 'react-router-dom';
import { Link } from '@*company-data-covered*/design-system';
import { FullScreen } from '@*company-data-covered*/caremanager/ui';

export const NotFound = () => (
  <FullScreen
    title="Page not found"
    message={
      <Link
        data-testid="return-home-button"
        to="/episodes"
        component={RouterLink}
      >
        Return to home
      </Link>
    }
    testId="page-not-found"
  />
);
