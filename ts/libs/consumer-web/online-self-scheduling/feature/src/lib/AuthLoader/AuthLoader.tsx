import { useAuth0 } from '@auth0/auth0-react';
import { CircularProgress, makeSxStyles } from '@*company-data-covered*/design-system';
import { FC, ReactElement } from 'react';
import { AUTH_LOADER_TEST_IDS } from './testIds';

export type AuthLoaderProps = {
  children: ReactElement;
};

const makeStyles = () =>
  makeSxStyles({
    loaderRoot: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
  });

export const AuthLoader: FC<AuthLoaderProps> = ({ children }) => {
  const { isLoading: isAuthTokenLoading } = useAuth0();

  const styles = makeStyles();

  if (isAuthTokenLoading) {
    return (
      <CircularProgress
        sx={styles.loaderRoot}
        size={80}
        data-testid={AUTH_LOADER_TEST_IDS.LOADER}
      />
    );
  }

  return children;
};
