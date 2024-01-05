import { FC } from 'react';
import { selectAuthenticatedUserMarkets } from '@*company-data-covered*/clinical-kpi/data-access';
import { AlertButton } from '@*company-data-covered*/clinical-kpi/ui';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { useSelector } from 'react-redux';

export interface UserMarketsValidatorProps {
  children: React.ReactNode;
  stationURL: string;
}

const makeStyles = () =>
  makeSxStyles({
    container: {
      maxWidth: '360px',
      textAlign: 'center',
      margin: '0 auto',
    },
  });

const UserMarketsValidator: FC<UserMarketsValidatorProps> = ({
  children,
  stationURL,
}) => {
  const styles = makeStyles();
  const { markets } = useSelector(selectAuthenticatedUserMarkets);

  if (!markets?.length) {
    return (
      <Box sx={styles.container}>
        <AlertButton
          text="You are not listed as an eligible provider. Please contact your manager if you believe this is in error."
          buttonText="Continue to Dashboard"
          buttonLink={stationURL}
        />
      </Box>
    );
  }

  return <>{children}</>;
};

export default UserMarketsValidator;
