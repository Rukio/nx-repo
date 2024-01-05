import { FC } from 'react';
import { Box, Typography, makeSxStyles } from '@*company-data-covered*/design-system';
import { OFFBOARD_SECTION_TEST_IDS } from './testIds';

export type OffboardSectionProps = {
  title: string;
  message: string;
};

const makeStyles = () =>
  makeSxStyles({
    message: (theme) => ({
      mt: 3,
      color: theme.palette.text.secondary,
      whiteSpace: 'pre-line',
    }),
  });

export const OffboardSection: FC<OffboardSectionProps> = ({
  title,
  message,
}) => {
  const styles = makeStyles();

  return (
    <Box data-testid={OFFBOARD_SECTION_TEST_IDS.ROOT}>
      <Typography variant="h5" data-testid={OFFBOARD_SECTION_TEST_IDS.TITLE}>
        {title}
      </Typography>
      <Typography
        sx={styles.message}
        data-testid={OFFBOARD_SECTION_TEST_IDS.MESSAGE}
      >
        {message}
      </Typography>
    </Box>
  );
};
