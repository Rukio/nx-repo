import { StoryFn, Meta } from '@storybook/react';
import { RankTable } from './';
import { Metrics } from '../../constants';
import { buildRandomMockRows } from './mocks';

export default {
  component: RankTable,
  title: 'RankTable',
} as Meta<typeof RankTable>;

const Template: StoryFn<typeof RankTable> = (args) => <RankTable {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  rows: buildRandomMockRows(20),
  type: Metrics.OnSceneTime,
};
