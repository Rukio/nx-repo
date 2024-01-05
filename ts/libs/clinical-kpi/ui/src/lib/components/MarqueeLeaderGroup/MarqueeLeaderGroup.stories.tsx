import { StoryFn, Meta } from '@storybook/react';
import { Metrics } from '../../constants';
import * as faker from 'faker';
import { MarqueeLeaderGroup } from './';

export default {
  component: MarqueeLeaderGroup,
  title: 'MarqueeLeaderGroup',
} as Meta<typeof MarqueeLeaderGroup>;

const Template: StoryFn<typeof MarqueeLeaderGroup> = (args) => (
  <MarqueeLeaderGroup {...args} />
);

export const Primary = Template.bind({});

Primary.args = {
  rank: 1,
  type: Metrics.OnSceneTime,
  leaders: [
    {
      name: `${faker.name.findName()} ${faker.name.lastName()}`,
      value: 32,
      valueChange: 0,
      avatarUrl: faker.image.imageUrl(80, 80, 'people', true),
    },
    {
      name: `${faker.name.findName()} ${faker.name.lastName()}`,
      value: 32,
      valueChange: 0,
      avatarUrl: faker.image.imageUrl(80, 80, 'people', true),
    },
    {
      name: `${faker.name.findName()} ${faker.name.lastName()}`,
      value: 32,
      valueChange: 0,
      avatarUrl: faker.image.imageUrl(80, 80, 'people', true),
    },
    {
      name: `${faker.name.findName()} ${faker.name.lastName()}`,
      value: 32,
      valueChange: 0,
      avatarUrl: faker.image.imageUrl(80, 80, 'people', true),
    },
    {
      name: `${faker.name.findName()} ${faker.name.lastName()}`,
      value: 32,
      valueChange: 0,
      avatarUrl: faker.image.imageUrl(80, 80, 'people', true),
    },
  ],
};
