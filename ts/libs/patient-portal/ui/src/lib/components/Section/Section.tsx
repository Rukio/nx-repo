import { FC, PropsWithChildren } from 'react';
import { makeSxStyles, Paper } from '@*company-data-covered*/design-system';
import { SECTION_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    section: (theme) => ({
      borderColor: theme.palette.grey[200],
      borderStyle: 'solid',
      borderWidth: 1,
      boxShadow: 'none',
      p: theme.spacing(3, 2),
      width: '100%',
    }),
  });

type SectionProps = PropsWithChildren<{
  testIdPrefix: string;
}>;

const Section: FC<SectionProps> = ({ children, testIdPrefix }) => {
  const styles = makeStyles();

  return (
    <Paper
      children={children}
      data-testid={SECTION_TEST_IDS.getSectionTestId(testIdPrefix)}
      sx={styles.section}
    />
  );
};

export default Section;
