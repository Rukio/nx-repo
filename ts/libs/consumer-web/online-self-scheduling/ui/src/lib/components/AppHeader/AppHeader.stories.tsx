import { Meta, StoryFn } from '@storybook/react';
import AppHeader from './AppHeader';

export default {
  title: 'AppHeader',
  component: AppHeader,
  args: {
    homeLink: 'https://www.*company-data-covered*.com/',
  },
} as Meta<typeof AppHeader>;

const Template: StoryFn<typeof AppHeader> = (args) => <AppHeader {...args} />;

export const Basic = Template.bind({});

export const WithExpressLink = Template.bind({});
WithExpressLink.args = {
  homeLink: 'https://www.*company-data-covered*.com/',
  expressLink: 'https://express.*company-data-covered*.com/',
};
