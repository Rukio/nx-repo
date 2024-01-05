import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Header } from '@*company-data-covered*/insurance/ui';
import { INSURANCE_DASHBOARD_ROUTES } from '../constants';

const AppBarHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();
  const onLogout = () => {
    logout();
    navigate(INSURANCE_DASHBOARD_ROUTES.HOME);
  };

  return (
    <Header
      userName={user?.name || ''}
      logoUrl={INSURANCE_DASHBOARD_ROUTES.HOME}
      onLogout={onLogout}
    />
  );
};

export default AppBarHeader;
