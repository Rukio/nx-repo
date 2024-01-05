import { Meta, StoryFn } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import PageSection from './PageSection';

export default {
  title: 'PageSection',
  component: PageSection,
  args: {
    children: 'Children',
    title: 'Title',
    subtitle: 'Subtitle',
    backButtonOptions: {
      text: 'Back',
      link: '/',
    },
  },
} as Meta<typeof PageSection>;

const Template: StoryFn<typeof PageSection> = (args) => (
  <MemoryRouter>
    <PageSection {...args} />
  </MemoryRouter>
);

export const Basic = Template.bind({});
