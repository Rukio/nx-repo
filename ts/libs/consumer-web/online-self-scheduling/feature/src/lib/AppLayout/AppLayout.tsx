import {
  AppHeader,
  AppHeaderProps,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { AuthProvider, AuthProviderProps } from '../AuthProvider';
import { Outlet } from 'react-router-dom';

export type AppLayoutProps = AppHeaderProps & AuthProviderProps;

export const AppLayout = ({
  homeLink,
  expressLink,
  ...authProps
}: AppLayoutProps) => {
  return (
    <AuthProvider {...authProps}>
      <AppHeader homeLink={homeLink} expressLink={expressLink} />
      <Outlet />
    </AuthProvider>
  );
};
