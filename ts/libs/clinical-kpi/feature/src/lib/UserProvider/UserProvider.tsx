import { FC, useEffect } from 'react';
import { setUser } from '@*company-data-covered*/shared/datadog/util';
import { useGetAuthenticatedUserQuery } from '@*company-data-covered*/clinical-kpi/data-access';
import { LoadingContainer } from '@*company-data-covered*/clinical-kpi/ui';

export interface UserProviderProps {
  children: React.ReactNode;
}

const UserProvider: FC<UserProviderProps> = ({
  children,
}: UserProviderProps) => {
  const { data: user, isLoading, isError } = useGetAuthenticatedUserQuery();

  useEffect(() => {
    if (user) {
      const { id, email, firstName } = user;
      setUser({
        id,
        email,
        name: firstName,
      });
    }
  }, [user, isError]);

  if (isLoading) {
    return <LoadingContainer testIdPrefix="user-provider" />;
  }

  if (isError || !user) {
    throw new Error('Unable to get an Authenticated User');
  }

  return user && <>{children}</>;
};

export default UserProvider;
