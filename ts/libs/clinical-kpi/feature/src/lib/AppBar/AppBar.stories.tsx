import { StoryFn, Meta } from '@storybook/react';
import { AppBar } from './';

export default {
  component: AppBar,
  title: 'AppBar',
} as Meta<typeof AppBar>;

const Template: StoryFn<typeof AppBar> = (args) => <AppBar {...args} />;

export const Primary = Template.bind({});
Primary.args = { stationURL: 'https://qa.*company-data-covered*.com' };
