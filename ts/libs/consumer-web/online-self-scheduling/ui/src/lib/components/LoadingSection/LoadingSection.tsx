import { FC } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { LOADING_SECTION_TEST_IDS } from './testIds';
import { FormHeader } from '../FormHeader';
import { PageLayout } from '../PageLayout';

export interface LoadingSectionProps {
  title: string;
  subtitle: string;
}

const makeStyles = () =>
  makeSxStyles({
    spinner: { my: 3, textAlign: 'center' },
  });

const LoadingSection: FC<LoadingSectionProps> = ({ title, subtitle }) => {
  const classes = makeStyles();

  return (
    <PageLayout>
      <FormHeader title={title} />
      <Box sx={classes.spinner}>
        <CircularProgress />
      </Box>
      <Typography data-testid={LOADING_SECTION_TEST_IDS.SUBTITLE}>
        {subtitle}
      </Typography>
    </PageLayout>
  );
};

export default LoadingSection;
