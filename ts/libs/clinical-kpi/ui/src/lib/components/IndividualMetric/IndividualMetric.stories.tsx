import { StoryFn, Meta } from '@storybook/react';
import { IndividualMetric } from './';
import { Metrics } from '../../constants';

export default {
  component: IndividualMetric,
  title: 'IndividualMetric',
} as Meta<typeof IndividualMetric>;

const Template: StoryFn<typeof IndividualMetric> = (args) => (
  <IndividualMetric {...args} />
);

export const Primary = Template.bind({});

Primary.args = {
  type: Metrics.OnSceneTime,
  value: 33,
  valueChange: 12,
  goal: 21,
};
