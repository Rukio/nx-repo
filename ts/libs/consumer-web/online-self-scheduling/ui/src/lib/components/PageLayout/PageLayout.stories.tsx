import { Meta, StoryFn } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import PageLayout from './PageLayout';

export default {
  title: 'PageLayout',
  component: PageLayout,
  args: {
    children: 'Children',
    stepProgress: 10,
    isLoading: false,
  },
} as Meta<typeof PageLayout>;

const Template: StoryFn<typeof PageLayout> = (args) => (
  <MemoryRouter>
    <PageLayout {...args} />
  </MemoryRouter>
);

export const Basic = Template.bind({});

export const WithBackButton = Template.bind({});
WithBackButton.args = {
  backButtonOptions: {
    text: 'Back button text',
    link: '/',
  },
};

export const WithMessageSection = Template.bind({});
WithMessageSection.args = {
  message: <div>Message Section</div>,
};
