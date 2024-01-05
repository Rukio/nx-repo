import { StoryFn, Meta } from '@storybook/react';
import { Section } from '.';
import { Typography } from '@*company-data-covered*/design-system';

export default {
  component: Section,
  title: 'Section',
} as Meta<typeof Section>;

const Template: StoryFn<typeof Section> = ({ children, ...args }) => (
  <Section {...args}>
    <Typography variant="h5">
      This title is not part of the Section component
    </Typography>
    {children}
  </Section>
);

export const Basic = Template.bind({});
Basic.args = {
  children: 'just a content example',
};
