import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  makeSxStyles,
  useMediaQuery,
  useTheme,
} from '@*company-data-covered*/design-system';
import { Action, MoreOptionsButton } from '../MoreOptionsButton';

const styles = makeSxStyles({
  card: {
    marginBottom: 2,
    borderColor: (theme) => theme.palette.grey.A200,
  },
  cardContent: { padding: 3 },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 3,
    height: 40,
    alignItems: 'center',
  },
});

const Title: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Typography variant="h6" flex={1}>
    {children}
  </Typography>
);

type Props = {
  title?: string;
  actions?: Action[];
  horizontal?: boolean;
  testId?: string;
  variant?: 'outlined' | 'elevation';
};

export const DetailsCard: React.FC<React.PropsWithChildren<Props>> = ({
  title,
  actions,
  horizontal,
  children,
  testId,
  variant = 'outlined',
}) => {
  const theme = useTheme();
  const isSM = useMediaQuery(theme.breakpoints.down('sm'));
  const isHorizontalLayoutEnabled = !isSM && horizontal;

  return (
    <Card variant={variant} sx={styles.card} data-testid={testId}>
      <CardContent sx={styles.cardContent}>
        {isHorizontalLayoutEnabled ? (
          <Grid container spacing={2} direction="row">
            {title && (
              <Grid item sm={4} data-testid={`${testId}-title`}>
                <Title>{title}</Title>
              </Grid>
            )}
            <Grid item sm>
              {children}
            </Grid>
            {!!actions?.length && (
              <Grid item>
                <MoreOptionsButton
                  actions={actions}
                  testIdPrefix={`${testId}-options`}
                />
              </Grid>
            )}
          </Grid>
        ) : (
          <>
            {(title || !!actions?.length) && (
              <Box sx={styles.optionsContainer}>
                <Title>{title}</Title>
                <MoreOptionsButton
                  actions={actions}
                  testIdPrefix={`${testId}-options`}
                />
              </Box>
            )}
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
};
