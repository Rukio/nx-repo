import { StoryFn, Meta } from '@storybook/react';
import { CareTeamRankTable } from './';
import { Metrics } from '../../constants';
import { careTeamRankingsMock } from './mocks';

export default {
  component: CareTeamRankTable,
  title: 'CareTeamRankTable',
} as Meta<typeof CareTeamRankTable>;

const Template: StoryFn<typeof CareTeamRankTable> = (args) => (
  <CareTeamRankTable {...args} />
);

export const Primary = Template.bind({});

Primary.args = {
  rows: careTeamRankingsMock,
  type: Metrics.OnSceneTime,
};
