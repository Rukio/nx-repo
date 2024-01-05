import { ReactNode } from 'react';
import { Container } from '@*company-data-covered*/design-system';
import { HEADER_HEIGHT } from '@*company-data-covered*/caremanager/utils';
import { Header } from '@*company-data-covered*/caremanager/ui';

type AppContainerProps = {
  children: ReactNode;
};

const AppContainer: React.FC<React.PropsWithChildren<AppContainerProps>> = ({
  children,
}) => {
  const HEADER_HEIGHT_MOBILE = '56px';

  return (
    <Container
      sx={{
        minWidth: '100%',
        marginTop: { xs: HEADER_HEIGHT_MOBILE, sm: HEADER_HEIGHT },
      }}
      disableGutters
    >
      <Header />
      {children}
    </Container>
  );
};

export default AppContainer;
