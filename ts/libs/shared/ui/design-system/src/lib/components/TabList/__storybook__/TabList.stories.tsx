import { Meta } from '@storybook/react';
import { FC, SyntheticEvent, useState } from 'react';

import TabList, { TabListProps } from '..';
import { Box, Tab, Typography } from '../../../index';
import TabPanel from '../../TabPanel';
import TabContext from '../../TabContext';

export default {
  title: 'TabList',
  component: TabList,
} as Meta<typeof TabList>;

export const Basic: FC<TabListProps> = (args) => {
  const [value, setValue] = useState<string>('1');

  const handleChange = (
    _: SyntheticEvent<Element, Event>,
    newValue: string
  ) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList
            onChange={handleChange}
            aria-label="basic tabs example"
            {...args}
          >
            <Tab label="Item One" value="1" />
            <Tab label="Item Two" value="2" />
            <Tab label="Item Three" value="3" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <Typography>Item One</Typography>
        </TabPanel>
        <TabPanel value="2">
          <Typography>Item Two</Typography>
        </TabPanel>
        <TabPanel value="3">
          <Typography>Item Three</Typography>
        </TabPanel>
      </TabContext>
    </Box>
  );
};
