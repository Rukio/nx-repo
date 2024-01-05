import { FC, ReactNode } from 'react';
import {
  Container,
  Box,
  makeSxStyles,
  Typography,
  TypographyProps,
} from '@*company-data-covered*/design-system';
import { METRICS_SECTION_TEST_IDS } from './TestIds';

type Props = {
  testIdPrefix?: string;
  title: string;
  icon?: ReactNode;
  select?: ReactNode;
  titleColor?: TypographyProps['color'];
  variant?: TypographyProps['variant'];
  children: ReactNode;
};

const makeStyles = ({ isIconDisplayed }: { isIconDisplayed: boolean }) =>
  makeSxStyles({
    contentContainer: (theme) => ({
      display: 'flex',
      borderBottom: 2,
      borderBottomColor: 'divider',
      borderBottomStyle: 'solid',
      padding: `${theme.spacing(0.5)} 0px`,
      alignItems: 'center',
    }),
    titleWrapper: (theme) => ({
      marginLeft: isIconDisplayed ? theme.spacing(1.5) : 0,
    }),
  });

const MetricsSection: FC<Props> = ({
  title,
  icon,
  select,
  testIdPrefix,
  titleColor = 'primary',
  variant = 'h6',
  children,
}) => {
  const styles = makeStyles({ isIconDisplayed: Boolean(icon) });

  return (
    <Container>
      <Box sx={styles.contentContainer}>
        {icon}
        <Typography
          data-testid={`${testIdPrefix}-${METRICS_SECTION_TEST_IDS.TITLE}`}
          sx={styles.titleWrapper}
          variant={variant}
          color={titleColor}
        >
          {title}
        </Typography>
        {select}
      </Box>
      {children}
    </Container>
  );
};

export default MetricsSection;
