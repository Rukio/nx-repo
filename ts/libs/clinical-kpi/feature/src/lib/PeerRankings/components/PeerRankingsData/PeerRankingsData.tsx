import { FC } from 'react';
import {
  MarqueeLeader,
  MarqueeLeaderGroup,
  MarqueeLeaderPlaceholder,
  Metrics,
  PeerRankingsSection,
  RankTable,
} from '@*company-data-covered*/clinical-kpi/ui';
import { Grid, makeSxStyles, Box } from '@*company-data-covered*/design-system';
import { MarqueeLeaderProvidersData, Provider } from '../../types';
import {
  MARQUEE_LEADER_CURRENT_PROVIDER_PLACEHOLDER_RANK,
  MARQUEE_LEADER_PLACEHOLDER_RANKS,
} from '../../TestIds';
export const AUTHENTICATED_USER_RANKING_SECTION_TITLE = 'Your Ranking';
export const MARQUEE_LEADERS_SECTION_TITLE = 'Leaders';

interface PeerRankingsProps {
  marqueeLeaderProvidersData: MarqueeLeaderProvidersData;
  rankingProvidersData: Provider[];
  currentProviderData?: Provider;
  isLoading: boolean;
  type: Metrics;
}

const makeStyles = () =>
  makeSxStyles({
    itemsContainer: {
      width: '100%',
      py: 2,
    },
    itemContainer: {
      width: '100%',
    },
    currentProviderWrapper: (theme) => ({
      height: '100%',
      paddingRight: 2,
      borderRight: '2px',
      borderColor: 'action.focus',
      borderRightStyle: 'solid',
      [theme.breakpoints.down('sm')]: {
        borderRight: 0,
        paddingRight: 0,
      },
    }),
  });

const PeerRankingsData: FC<PeerRankingsProps> = ({
  marqueeLeaderProvidersData,
  rankingProvidersData,
  currentProviderData,
  isLoading,
  type,
}) => {
  const styles = makeStyles();

  return (
    <>
      <Grid
        container
        rowSpacing={{ xs: 2, sm: 0 }}
        spacing={{ xs: 0, sm: 2 }}
        sx={styles.itemsContainer}
      >
        {!isLoading ? (
          <>
            {currentProviderData && (
              <Grid
                container
                direction="column"
                item
                sm={3}
                sx={styles.itemContainer}
              >
                <PeerRankingsSection
                  title={AUTHENTICATED_USER_RANKING_SECTION_TITLE}
                >
                  <Box sx={styles.currentProviderWrapper}>
                    <MarqueeLeader
                      name={currentProviderData.name}
                      value={currentProviderData.value}
                      valueChange={currentProviderData.valueChange}
                      avatarUrl={currentProviderData.avatarUrl}
                      position={currentProviderData.position}
                      rank={currentProviderData.rank}
                      type={type}
                    />
                  </Box>
                </PeerRankingsSection>
              </Grid>
            )}
            <Grid
              item
              sm={currentProviderData ? 9 : 12}
              sx={styles.itemContainer}
            >
              <PeerRankingsSection title="Leaders">
                <Grid
                  container
                  rowSpacing={{ xs: 2, sm: 0 }}
                  spacing={{ xs: 0, sm: 2 }}
                >
                  {Object.entries(marqueeLeaderProvidersData).map(
                    ([key, leaders]) => (
                      <Grid key={key} item sm={4} sx={styles.itemContainer}>
                        <MarqueeLeaderGroup
                          leaders={leaders}
                          rank={leaders?.[0]?.rank}
                          type={type}
                        />
                      </Grid>
                    )
                  )}
                </Grid>
              </PeerRankingsSection>
            </Grid>
          </>
        ) : (
          <>
            <Grid sm={3} item>
              <PeerRankingsSection title="Your Ranking">
                <Grid container sx={styles.currentProviderWrapper}>
                  <Grid item sm={12} sx={styles.itemContainer}>
                    <MarqueeLeaderPlaceholder
                      rank={MARQUEE_LEADER_CURRENT_PROVIDER_PLACEHOLDER_RANK}
                    />
                  </Grid>
                </Grid>
              </PeerRankingsSection>
            </Grid>
            <Grid sm={9} item>
              <PeerRankingsSection title={MARQUEE_LEADERS_SECTION_TITLE}>
                <Grid
                  container
                  rowSpacing={{ xs: 2, sm: 0 }}
                  spacing={{ xs: 0, sm: 2 }}
                >
                  {MARQUEE_LEADER_PLACEHOLDER_RANKS.map((rank) => (
                    <Grid item sm={4} key={rank} sx={styles.itemContainer}>
                      <MarqueeLeaderPlaceholder rank={rank} />
                    </Grid>
                  ))}
                </Grid>
              </PeerRankingsSection>
            </Grid>
          </>
        )}
      </Grid>
      <RankTable
        rows={rankingProvidersData || []}
        type={type}
        startRank={4}
        isLoading={isLoading}
      />
    </>
  );
};

export default PeerRankingsData;
