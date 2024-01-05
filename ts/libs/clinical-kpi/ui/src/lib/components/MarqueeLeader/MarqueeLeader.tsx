import { FC, PropsWithChildren, useMemo } from 'react';
import {
  Card,
  Avatar,
  Badge,
  Box,
  makeSxStyles,
  Typography,
} from '@*company-data-covered*/design-system';
import { MARQUEE_LEADER_TEST_IDS } from './TestIds';
import {
  formatMetricValueChange,
  formatMetricValue,
} from '../../utils/metricsUtils';
import { Metrics } from '../../constants';

export type MarqueeLeaderProps = {
  rank: number;
  type: Metrics;
  avatarUrl: string;
  name: string;
  position?: string;
  value: number;
  valueChange: number;
};

const MAX_LEADER_RANK = 3;

export const getRankBackgroundColor = (rank: number) => {
  switch (rank) {
    case 1:
      return '#FFD700'; // gold
    case 2:
      return '#899297'; // silver
    case 3:
    default:
      return '#8E6C59'; // bronze
  }
};

const makeStyles = ({ rank }: Pick<MarqueeLeaderProps, 'rank'>) =>
  makeSxStyles({
    container: (theme) => ({
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: theme.spacing(2),
      borderRadius: '8px',
    }),
    badgeWrapper: {
      minHeight: '22px',
    },
    badgeRank: {
      '& .MuiBadge-badge': {
        backgroundColor: getRankBackgroundColor(rank),
      },
    },
    badgeRankLabel: {
      fontWeight: 600,
    },
    avatar: (theme) => ({
      width: '80px',
      height: '80px',
      my: theme.spacing(2),
      '& .MuiAvatar-fallback': {
        fill: theme.palette.action.active,
      },
    }),
    nameContainer: {
      display: 'flex',
      alignItems: 'center',
    },
    providerPositionContainer: {
      ml: 1,
    },
    boxName: {
      fontFamily: 'Open Sans',
    },
    valueWrapper: (theme) => ({
      my: theme.spacing(0.5),
    }),
  });

const MarqueeLeader: FC<PropsWithChildren<MarqueeLeaderProps>> = ({
  rank,
  position,
  type,
  avatarUrl,
  name,
  value,
  valueChange,
  children,
}) => {
  const styles = makeStyles({ rank });

  const { displayValue } = useMemo(
    () => formatMetricValue({ type, value }),
    [type, value]
  );
  const { displayValue: displayValueChange, styles: valueChangeStyles } =
    useMemo(
      () => formatMetricValueChange({ type, value: valueChange }),
      [type, valueChange]
    );

  return (
    <Card sx={styles.container}>
      <Box sx={styles.badgeWrapper}>
        {rank <= MAX_LEADER_RANK ? (
          <Badge
            data-testid={MARQUEE_LEADER_TEST_IDS.getBadgeTestId(rank)}
            sx={styles.badgeRank}
            color="success"
            badgeContent={rank}
          />
        ) : (
          <Typography
            data-testid={MARQUEE_LEADER_TEST_IDS.getBadgeTestId(rank)}
            variant="body2"
            sx={styles.badgeRankLabel}
          >
            #{rank}
          </Typography>
        )}
      </Box>
      <Avatar
        data-testid={MARQUEE_LEADER_TEST_IDS.getAvatarTestId(rank)}
        sx={styles.avatar}
        src={avatarUrl}
      />
      <Box sx={styles.nameContainer}>
        <Typography
          data-testid={MARQUEE_LEADER_TEST_IDS.getNameTestId(rank)}
          sx={styles.boxName}
          variant="h7"
        >
          {name} {!!position && '•'}
        </Typography>
        {Boolean(position) && (
          <Typography
            data-testid={MARQUEE_LEADER_TEST_IDS.getPositionTestId(rank)}
            variant="body2"
            sx={styles.providerPositionContainer}
          >
            {position}
          </Typography>
        )}
      </Box>
      <Typography
        data-testid={MARQUEE_LEADER_TEST_IDS.getValueTestId(rank)}
        sx={styles.valueWrapper}
        variant="body2"
      >
        {displayValue}
      </Typography>
      <Typography
        data-testid={MARQUEE_LEADER_TEST_IDS.getValueChangeTestId(rank)}
        sx={valueChangeStyles}
        variant="body2"
      >
        {displayValueChange}
      </Typography>
      {children}
    </Card>
  );
};

export default MarqueeLeader;
