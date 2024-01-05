import { FC, useState } from 'react';
import {
  Box,
  makeSxStyles,
  Typography,
  ArrowCircleLeftIcon,
  ArrowCircleRightIcon,
  IconButton,
} from '@*company-data-covered*/design-system';
import { Metrics } from '../../constants';
import { MarqueeLeader } from '../MarqueeLeader';
import MarqueeLeaderGroupOverview from './MarqueeLeaderGroupOverview';
import { MARQUEE_LEADER_GROUP_TEST_IDS } from './TestIds';

export type Leader = {
  avatarUrl: string;
  name: string;
  position?: string;
  value: number;
  valueChange: number;
};

export type MarqueeLeaderGroupProps = {
  leaders: Leader[];
  type: Metrics;
  rank: number;
};

const makeStyles = () =>
  makeSxStyles({
    arrowsContainer: {
      display: 'flex',
      alignItems: 'center',
    },
  });

const MarqueeLeaderGroup: FC<MarqueeLeaderGroupProps> = ({
  leaders,
  rank,
  type,
}) => {
  const countOfLeaders = leaders.length;
  const [currentProviderSlideIndex, setCurrentProviderIndex] = useState(0);

  // -1 because the first slide is the group overview
  const currentProviderIndex = currentProviderSlideIndex - 1;

  const styles = makeStyles();

  const onClickNext = () => {
    if (currentProviderSlideIndex < countOfLeaders) {
      setCurrentProviderIndex(currentProviderSlideIndex + 1);
    }
  };

  const onClickPrevious = () => {
    if (currentProviderSlideIndex > 0) {
      setCurrentProviderIndex(currentProviderSlideIndex - 1);
    }
  };

  const isPreviousButtonDisabled = currentProviderSlideIndex === 0;

  const isNextButtonDisabled = currentProviderSlideIndex === countOfLeaders;

  const renderArrows = () => (
    <Box sx={styles.arrowsContainer}>
      <IconButton
        onClick={onClickPrevious}
        disabled={isPreviousButtonDisabled}
        data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getPreviousButtonTestId(
          rank
        )}
      >
        <ArrowCircleLeftIcon
          color={isPreviousButtonDisabled ? 'disabled' : 'primary'}
        />
      </IconButton>

      <Typography>
        {currentProviderSlideIndex} of {countOfLeaders}
      </Typography>
      <IconButton
        onClick={onClickNext}
        disabled={isNextButtonDisabled}
        data-testid={MARQUEE_LEADER_GROUP_TEST_IDS.getNextButtonTestId(rank)}
      >
        <ArrowCircleRightIcon
          color={isNextButtonDisabled ? 'disabled' : 'primary'}
        />
      </IconButton>
    </Box>
  );

  if (countOfLeaders === 1) {
    return <MarqueeLeader {...leaders[0]} rank={rank} type={type} />;
  }

  if (currentProviderSlideIndex > 0) {
    return (
      <MarqueeLeader {...leaders[currentProviderIndex]} rank={rank} type={type}>
        {renderArrows()}
      </MarqueeLeader>
    );
  }

  return (
    <MarqueeLeaderGroupOverview rank={rank} leaders={leaders} type={type}>
      {renderArrows()}
    </MarqueeLeaderGroupOverview>
  );
};

export default MarqueeLeaderGroup;
