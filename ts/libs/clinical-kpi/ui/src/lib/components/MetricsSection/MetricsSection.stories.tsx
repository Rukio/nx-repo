import { PersonIcon } from '@*company-data-covered*/design-system';
import { StoryFn, Meta } from '@storybook/react';
import { MetricsSection } from './';

export default {
  component: MetricsSection,
  title: 'MetricsSection',
} as Meta<typeof MetricsSection>;

const Template: StoryFn<typeof MetricsSection> = (args) => (
  <MetricsSection {...args} />
);

export const Primary = Template.bind({});
Primary.args = { title: 'My Performance', icon: <PersonIcon /> };
