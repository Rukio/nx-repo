import { PropsWithChildren, FC } from 'react';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { PAGE_TEST_IDS } from './testIds';

export type PageProps = PropsWithChildren<{
  testIdPrefix: string;
}>;

const makeStyles = () =>
  makeSxStyles({
    root: (theme) => ({
      backgroundColor: theme.palette.background.default,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      p: 2,
    }),
    bodyWrapper: {
      maxWidth: '600px',
      width: '100%',
    },
  });

const Page: FC<PageProps> = ({ testIdPrefix, children }) => {
  const styles = makeStyles();

  return (
    <Box
      data-testid={PAGE_TEST_IDS.getPageTestId(testIdPrefix)}
      sx={styles.root}
    >
      <Box sx={styles.bodyWrapper}>{children}</Box>
    </Box>
  );
};

export default Page;
