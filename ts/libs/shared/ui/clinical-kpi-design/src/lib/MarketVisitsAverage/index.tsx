import {
  Typography,
  Box,
  makeSxStyles,
  useTheme,
} from '@*company-data-covered*/design-system';
import ProgressBar from '../ProgressBar';
import { FC } from 'react';
import MARKET_VISITS_AVERAGE_TEST_IDS from './testIds';

interface MarketVisitsAverageProps {
  /** The number of hours used to calculate market averages. */
  hoursWorked: number;
  userPatientCountAverage: number;
  marketPatientCountAverage: number;
}

const makeStyles = () =>
  makeSxStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'left',
      gap: 0.5,
    },
    hoursCalculatedText: (theme) => ({
      marginBottom: 1,
      color: theme.palette.text.secondary,
    }),
  });

const MarketVisitsAverage: FC<MarketVisitsAverageProps> = ({
  hoursWorked,
  userPatientCountAverage,
  marketPatientCountAverage,
}) => {
  const theme = useTheme();
  const styles = makeStyles();
  const yourProgressBarText = `You cared for ${userPatientCountAverage} patients`;
  const marketProgressBarText = `The Market average was ${marketPatientCountAverage} patients`;

  return (
    <Box
      sx={styles.root}
      data-testid={MARKET_VISITS_AVERAGE_TEST_IDS.MARKET_VISITS_AVERAGE_SECTION}
    >
      <Typography variant="subtitle2">
        Your Visits vs. Market Average
      </Typography>
      <Typography variant="body2" sx={styles.hoursCalculatedText}>
        The Market Average was calculated using {hoursWorked} hours worked.
      </Typography>
      <ProgressBar
        color={theme.palette.info.light}
        count={userPatientCountAverage}
        text={yourProgressBarText}
      />
      <ProgressBar
        color={theme.palette.secondary.dark}
        count={marketPatientCountAverage}
        text={marketProgressBarText}
      />
    </Box>
  );
};

export default MarketVisitsAverage;
