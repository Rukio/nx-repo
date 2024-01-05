import { Meta, StoryFn } from '@storybook/react';
import { Children, useState } from 'react';
import Note from '../../Note';
import { DEFAULT_TAGS } from '../components/ComposeSection';
import Notes from '../index';
import { Box } from '../../..';

export default {
  title: 'Notes',
  component: Notes,
  argTypes: {
    maxRows: {
      defaultValue: 5,
      control: 'number',
    },
    multiline: {
      defaultValue: true,
      control: { type: 'boolean' },
    },
    withPadding: {
      defaultValue: false,
      control: { type: 'boolean' },
    },
    onSubmit: {
      table: {
        disable: true,
      },
    },
    children: {
      table: {
        disable: true,
      },
    },
    listLabel: {
      defaultValue: 'Notes',
      control: 'text',
    },
    withTags: {
      defaultValue: true,
      control: 'boolean',
    },
    tags: {
      control: { type: 'multi-select' },
      options: DEFAULT_TAGS,
    },
    filterOptions: {
      defaultValue: [
        { label: 'All notes', value: 'all' },
        { label: 'General notes', value: 'General Note' },
        { label: 'Clinical notes', value: 'Clinical Note' },
        { label: 'Disabled option', value: 'disabled', disabled: true },
      ],
    },
    defaultFilterValue: {
      defaultValue: 'all',
    },
  },
} as Meta<typeof Notes>;

const Template: StoryFn<typeof Notes> = (args) => {
  return (
    <Box height="500px">
      <Notes {...args}>
        {Children.map(args.children, (note) => (
          <>{note}</>
        ))}
      </Notes>
    </Box>
  );
};

export const Basic = Template.bind({});
Basic.args = {
  children: [],
};

const WithoutNotesTemplate: StoryFn<typeof Notes> = (args) => {
  const [notes, setNotes] = useState<
    {
      id: number;
      text: string;
      createdAt: Date;
      updatedAt?: Date;
      featured?: boolean;
      tag?: string;
    }[]
  >([]);
  const [selectedFilter, setSelectedFilter] = useState(args.defaultFilterValue);

  const onSubmit = ({ text, tag }: { text: string; tag?: string }) => {
    setNotes((prev) => [
      ...prev,
      {
        id: Math.floor(Math.random() * 100),
        text,
        createdAt: new Date(),
        tag,
      },
    ]);
  };

  const onToggleFeatured = (id: number, newValue: boolean) => {
    setNotes((prev) => {
      const newArray = [...prev];
      const noteIdx = newArray.findIndex((note) => note.id === id);
      newArray[noteIdx].featured = newValue;

      return newArray;
    });
  };

  const onDelete = (id: number) => {
    setNotes((prev) => prev.filter((item) => item.id !== id));
  };

  const onEdit = (id: number, newValue: string) => {
    setNotes((prev) => {
      const newArray = [...prev];
      const noteIdx = newArray.findIndex((note) => note.id === id);
      newArray[noteIdx].text = newValue;
      newArray[noteIdx].updatedAt = new Date();

      return newArray;
    });
  };

  const onFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const filteredItems =
    selectedFilter === 'all'
      ? notes
      : notes.filter((note) => note.tag === selectedFilter);

  return (
    <Box height="500px">
      <Notes {...args} onSubmit={onSubmit} onFilterChange={onFilterChange}>
        {filteredItems.map((note) => (
          <Note
            key={note.id}
            id={note.id}
            text={note.text}
            displayDate={note.updatedAt ?? note.createdAt}
            firstName="John"
            lastName="Dow"
            jobTitle="User"
            featured={note.featured}
            isEdited={!!note.updatedAt}
            tag={note.tag}
            onToggleFeatured={onToggleFeatured}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </Notes>
    </Box>
  );
};

export const WithoutNotes = WithoutNotesTemplate.bind({});

export const WithNotes = Basic.bind({});
WithNotes.args = {
  children: [
    <Note
      id={1}
      displayDate={new Date()}
      firstName="John"
      lastName="Dow"
      jobTitle="RN"
      text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel mauris eleifend, cursus metus sit amet, tincidunt diam. Donec et orci ex."
    />,
    <Note
      id={1}
      displayDate={new Date()}
      firstName="John"
      lastName="Dow"
      jobTitle="RN"
      text="WITHOUT_any_Space_LoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLoremLorem"
    />,
    <Note
      id={2}
      displayDate={new Date()}
      firstName="Jared"
      lastName="Dow"
      jobTitle="RN"
      text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel mauris eleifend, cursus metus sit amet, tincidunt diam. Donec et orci ex."
    />,
    <Note
      id={3}
      displayDate={new Date()}
      firstName="Jacob"
      lastName="Dow"
      jobTitle="RN"
      text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel mauris eleifend, cursus metus sit amet, tincidunt diam. Donec et orci ex."
    />,
  ],
};
