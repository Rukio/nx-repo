import { FC, PropsWithChildren, useMemo } from 'react';
import {
  Card,
  Avatar,
  Badge,
  Box,
  makeSxStyles,
  Typography,
} from '@*company-data-covered*/design-system';
import { formatMetricValue } from '../../utils/metricsUtils';
import { MARQUEE_LEADER_GROUP_TEST_IDS } from './TestIds';
import { getRankBackgroundColor } from '../MarqueeLeader/MarqueeLeader';
import { MarqueeLeaderGroupProps } from './MarqueeLeaderGroup';

const MAX_LEADER_RANK = 3;

const makeStyles = ({ rank }: Pick<MarqueeLeaderGroupProps, 'rank'>) =>
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
    avatarsWrapper: (theme) => ({
      display: 'flex',
      my: theme.spacing(3.5),
    }),
    avatar: (theme) => ({
      '& .MuiAvatar-fallback': {
        fill: theme.palette.action.active,
      },
    }),
    avatarBase: (theme) => ({
      width: '56px',
      height: '56px',
      my: theme.spacing(2),
      border: `2px solid ${theme.palette.common.white}`,
      margin: '0px -8px',
    }),
    titleContainer: {
      display: 'flex',
      alignItems: 'center',
    },
    boxName: {
      fontFamily: 'Open Sans',
    },
    valueWrapper: (theme) => ({
      my: theme.spacing(0.5),
    }),
  });

const MAX_COUNT_OF_AVATARS_TO_DISPLAY = 3;

//TODO: PT-1426 Cleanup MarqueeLeader and MarqueeLeaderGroup to reuse the same components
const MarqueeLeaderGroupOverview: FC<
  PropsWithChildren<MarqueeLeaderGroupProps>
> = ({ rank, leaders, type, children }) => {
  const styles = makeStyles({ rank });
  const { value = 0 } = leaders[0] || {};

  const { displayValue } = useMemo(
    () => formatMetricValue({ type, value }),
    [type, value]
  );

  return (
    <Card
      sx={styles.container}
      data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getContainerTestId(rank)}
    >
      <Box sx={styles.badgeWrapper}>
        {rank <= MAX_LEADER_RANK ? (
          <Badge
            data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getBadgeTestId(rank)}
            sx={styles.badgeRank}
            color="success"
            badgeContent={rank}
          />
        ) : (
          <Typography
            data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getBadgeTestId(rank)}
            variant="body2"
            sx={styles.badgeRankLabel}
          >
            #{rank}
          </Typography>
        )}
      </Box>
      <Box
        sx={styles.avatarsWrapper}
        data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getAvatarsContainerTestId(
          rank
        )}
      >
        {leaders
          .slice(0, MAX_COUNT_OF_AVATARS_TO_DISPLAY)
          .map(({ avatarUrl }, index) => (
            <Avatar
              key={avatarUrl}
              sx={[styles.avatarBase, styles.avatar]}
              src={avatarUrl}
              data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getAvatarTestId(
                index,
                rank
              )}
            />
          ))}
        {leaders.length > MAX_COUNT_OF_AVATARS_TO_DISPLAY && (
          <Avatar
            sx={[styles.avatarBase, styles.avatar]}
            data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getAvatarPlaceholderTestId(
              rank
            )}
          >
            {`+${leaders.length - MAX_COUNT_OF_AVATARS_TO_DISPLAY}`}
          </Avatar>
        )}
      </Box>
      <Box sx={styles.titleContainer}>
        <Typography
          data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getTitleTestId(rank)}
          sx={styles.boxName}
          variant="h7"
        >
          {`${leaders.length} Providers`}
        </Typography>
      </Box>
      <Typography
        data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getValueTestId(rank)}
        sx={styles.valueWrapper}
        variant="body2"
      >
        {displayValue}
      </Typography>
      <Typography
        data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getValueChangeTestId(rank)}
        variant="body2"
      >
        no change
      </Typography>
      {children}
    </Card>
  );
};

export default MarqueeLeaderGroupOverview;
