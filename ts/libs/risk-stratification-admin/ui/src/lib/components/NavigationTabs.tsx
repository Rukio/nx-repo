import {
  Box,
  makeSxStyles,
  Tab,
  TabContext,
  TabList,
} from '@*company-data-covered*/design-system';

const makeStyles = () =>
  makeSxStyles({
    wrapper: { paddingX: 4 },
  });

const NavigationTabs = () => {
  const styles = makeStyles();

  return (
    <TabContext value="question_bank">
      <Box sx={styles.wrapper}>
        <TabList aria-label="basic tabs example">
          <Tab label="Question Bank" value="question_bank" />
        </TabList>
      </Box>
    </TabContext>
  );
};

export default NavigationTabs;
