import { FC, PropsWithChildren } from 'react';
import { Typography, makeSxStyles, Box } from '@*company-data-covered*/design-system';
import { PEER_RANKINGS_SECTION_TEST_IDS } from './TestIds';

export type PeerRankingsSectionProps = PropsWithChildren<{
  title: string;
}>;

const makeStyles = () =>
  makeSxStyles({
    sectionHeader: {
      fontWeight: 600,
    },
    childrenSection: {
      flexGrow: 1,
      mt: 2,
    },
  });

const PeerRankingsSection: FC<PeerRankingsSectionProps> = ({
  title,
  children,
}) => {
  const styles = makeStyles();

  return (
    <>
      <Typography
        variant="body2"
        data-testid={PEER_RANKINGS_SECTION_TEST_IDS.TITLE}
        sx={styles.sectionHeader}
      >
        {title}
      </Typography>
      <Box sx={styles.childrenSection}>{children}</Box>
    </>
  );
};

export default PeerRankingsSection;
