import { FC, PropsWithChildren, ReactNode } from 'react';
import {
  Box,
  Grid,
  ListItem,
  ListItemProps,
  Typography,
  makeSxStyles,
  SystemCssProperties,
} from '@*company-data-covered*/design-system';
import { FORMATTED_LIST_TEST_IDS } from './testIds';

type MakeStylesProps = {
  childrenContainerOverflowWrap?: SystemCssProperties['overflowWrap'];
};

const makeStyles = ({ childrenContainerOverflowWrap }: MakeStylesProps) =>
  makeSxStyles({
    childrenContainer: (theme) => ({
      ...theme.typography.body1,
      color: theme.palette.text.secondary,
      overflowWrap: childrenContainerOverflowWrap,
    }),
    leftContainer: (theme) => ({
      rowGap: theme.spacing(0.625),
    }),
  });

export type FormattedListItemProps = PropsWithChildren<
  Omit<ListItemProps, 'children'> &
    MakeStylesProps & {
      action?: ReactNode;
      testIdPrefix: string;
      title?: string;
    }
>;

const FormattedListItem: FC<FormattedListItemProps> = ({
  action,
  children,
  childrenContainerOverflowWrap = 'anywhere',
  testIdPrefix,
  title,
  ...props
}) => {
  const styles = makeStyles({ childrenContainerOverflowWrap });

  return (
    <ListItem
      data-testid={FORMATTED_LIST_TEST_IDS.getListItemTestId(testIdPrefix)}
      disablePadding
      {...props}
    >
      <Grid container justifyContent="space-between" spacing={1}>
        <Grid item>
          <Grid
            container
            direction="column"
            sx={styles.leftContainer}
            wrap="wrap"
          >
            {!!title && (
              <Grid item>
                <Typography
                  data-testid={FORMATTED_LIST_TEST_IDS.getListItemTitleTestId(
                    testIdPrefix
                  )}
                  variant="h6"
                >
                  {title}
                </Typography>
              </Grid>
            )}
            <Grid item>
              <Box
                data-testid={FORMATTED_LIST_TEST_IDS.getListItemChildrenContainerTestId(
                  testIdPrefix
                )}
                sx={styles.childrenContainer}
              >
                {children}
              </Box>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>{action}</Grid>
      </Grid>
    </ListItem>
  );
};

export default FormattedListItem;
