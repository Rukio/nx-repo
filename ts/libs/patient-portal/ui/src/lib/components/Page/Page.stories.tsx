import { Meta, StoryFn } from '@storybook/react';
import Page from './Page';

export default {
  title: 'Page',
  component: Page,
  args: {
    testIdPrefix: 'text-id-prefix',
  },
} as Meta<typeof Page>;

const Template: StoryFn<typeof Page> = (args) => {
  return (
    <Page {...args}>
      <div>children</div>
    </Page>
  );
};

export const Basic = Template.bind({});
