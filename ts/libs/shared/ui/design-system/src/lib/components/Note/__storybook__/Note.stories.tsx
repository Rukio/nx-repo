import { Meta, StoryFn } from '@storybook/react';
import ReadMore from '../../ReadMore';
import Note from '../index';

export default {
  title: 'Note',
  component: Note,
  argTypes: {
    text: {
      defaultValue:
        'Pariatur in ex enim incididunt ea laboris. Dolore commodo occaecat quis nulla mollit reprehenderit ut do dolore ea velit ullamco. Do officia sint sit culpa duis dolore Lorem nulla nostrud esse tempor. Tempor quis voluptate consequat deserunt exercitation incididunt non proident sit magna dolor. Nostrud in eiusmod Lorem fugiat aute ut eu. Tempor adipisicing adipisicing esse tempor laborum pariatur dolore quis dolor est.',
      control: 'text',
    },
    showInitials: {
      defaultValue: true,
      control: 'boolean',
    },
    displayDate: {
      defaultValue: new Date(),
      control: 'date',
    },
    firstName: {
      defaultValue: 'John',
      control: 'text',
    },
    lastName: {
      defaultValue: 'Dow',
      control: 'text',
    },
    jobTitle: {
      defaultValue: 'RN',
      control: 'text',
    },
    isEditingEnabled: {
      defaultValue: true,
      control: 'boolean',
    },
    featured: {
      defaultValue: true,
      control: 'boolean',
    },
    isFeaturedNoteEnabled: {
      defaultValue: true,
      control: 'boolean',
    },
    onToggleFeatured: {
      table: {
        disable: true,
      },
    },
    isDeletingEnabled: {
      defaultValue: true,
      control: 'boolean',
    },
    onDelete: {
      table: {
        disable: true,
      },
    },
    deletionExpirationMs: {
      defaultValue: 5000,
      control: 'number',
    },
    textWrapper: {
      table: {
        disable: true,
      },
    },
    tag: {
      defaultValue: 'General Note',
      control: 'text',
    },
  },
} as Meta<typeof Note>;

const Template: StoryFn<typeof Note> = (args) => <Note {...args} />;

const ReadMoreTemplate: StoryFn<typeof Note> = (args) => (
  <Note
    {...args}
    text={args.text}
    textWrapper={({ children }) => (
      <ReadMore maxTextLength={30}>{children}</ReadMore>
    )}
  />
);

export const Basic = Template.bind({});

export const WithReadMore = ReadMoreTemplate.bind({});
