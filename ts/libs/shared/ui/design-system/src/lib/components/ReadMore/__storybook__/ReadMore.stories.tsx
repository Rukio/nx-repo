import { Meta, StoryFn } from '@storybook/react';
import ReadMore from '../index';

export default {
  title: 'ReadMore',
  component: ReadMore,
  argTypes: {
    collapseLabel: {
      defaultValue: 'read less',
      control: 'text',
    },
    expandLabel: {
      defaultValue: 'read more',
      control: 'text',
    },
    maxTextLength: {
      defaultValue: 250,
      control: 'number',
    },
  },
} as Meta<typeof ReadMore>;

const Template: StoryFn<typeof ReadMore> = (args) => (
  <ReadMore {...args}>
    Qui amet aliqua aliquip qui incididunt dolor. Incididunt amet ea id cillum
    consequat voluptate ea fugiat aute eiusmod occaecat ut. Sit elit duis irure
    pariatur minim dolor est voluptate do et tempor dolore voluptate. Est labore
    elit est voluptate est eiusmod exercitation eu.
  </ReadMore>
);

export const Basic = Template.bind({});
