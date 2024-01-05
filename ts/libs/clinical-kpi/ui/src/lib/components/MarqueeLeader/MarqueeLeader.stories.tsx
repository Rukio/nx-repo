import { StoryFn, Meta } from '@storybook/react';
import { Metrics } from '../../constants';
import { MarqueeLeader } from './';

export default {
  component: MarqueeLeader,
  title: 'MarqueeLeader',
} as Meta<typeof MarqueeLeader>;

const Template: StoryFn<typeof MarqueeLeader> = (args) => (
  <MarqueeLeader {...args} />
);

export const Primary = Template.bind({});

Primary.args = {
  rank: 1,
  name: 'Desirae Bator',
  type: Metrics.OnSceneTime,
  value: 32,
  valueChange: -1,
  avatarUrl:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjLE9Ylr4f4BXaJfXkLC0YGydJDZVQoxK0Dg&usqp=CAU',
};
