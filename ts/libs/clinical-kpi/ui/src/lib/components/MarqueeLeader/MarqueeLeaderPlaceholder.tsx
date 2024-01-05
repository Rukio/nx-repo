import { FC } from 'react';
import { Card, makeSxStyles, Skeleton } from '@*company-data-covered*/design-system';
import { MARQUEE_LEADER_TEST_IDS } from './TestIds';

type Props = {
  rank: number;
};

const makeStyles = () =>
  makeSxStyles({
    container: {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
      maxWidth: 368,
      p: 2,
      borderRadius: 8,
      my: 1,
    },
    avatarHolder: {
      width: 80,
      height: 80,
    },
    valueHolder: {
      width: 120,
      height: 12,
      m: 1,
    },
  });

const MarqueeLeaderPlaceholder: FC<Props> = ({ rank }) => {
  const styles = makeStyles();

  return (
    <Card
      data-testid={MARQUEE_LEADER_TEST_IDS.getPlaceholderTestId(rank)}
      sx={styles.container}
    >
      <Skeleton variant="circular" sx={styles.avatarHolder} />
      <Skeleton variant="rectangular" sx={styles.valueHolder} />
      <Skeleton variant="rectangular" sx={styles.valueHolder} />
      <Skeleton variant="rectangular" sx={styles.valueHolder} />
    </Card>
  );
};

export default MarqueeLeaderPlaceholder;
