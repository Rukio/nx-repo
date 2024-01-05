import { Meta, StoryFn } from '@storybook/react';
import { useForm } from 'react-hook-form';
import ConsentQuestion from './ConsentQuestion';
import { mockConsentQuestionFormFieldValues } from '../constants';

export default {
  title: 'ConsentQuestion',
  component: ConsentQuestion,
} as Meta<typeof ConsentQuestion>;

const Template: StoryFn<typeof ConsentQuestion> = (args) => {
  const { control } = useForm({
    defaultValues: mockConsentQuestionFormFieldValues,
  });

  return <ConsentQuestion {...args} formControl={control} />;
};

export const Basic = Template.bind({});
Basic.args = {
  consentQuestion: {
    order: 0,
    question: 'Lorem Ipsum has been the industrys standard Question?',
    answerOptions: ['Yes', 'No'],
  },
  fieldName: 'firstConsentQuestion',
};
