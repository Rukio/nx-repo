import { Meta, StoryFn } from '@storybook/react';
import { ConsentForm } from './ConsentForm';

import { useForm } from 'react-hook-form';
import { mockConsentQuestionFormFieldValues } from './constants';

export default {
  title: 'ConsentForm',
  component: ConsentForm,
} as Meta<typeof ConsentForm>;

const Template: StoryFn<typeof ConsentForm> = (args) => {
  const { control } = useForm({
    defaultValues: mockConsentQuestionFormFieldValues,
  });

  return <ConsentForm {...args} formControl={control} />;
};

export const Basic = Template.bind({});
Basic.args = {
  isFirstQuestionDisplayed: true,
  isSecondQuestionDisplayed: true,
  isThirdQuestionDisplayed: true,
  isMedicalDecisionMakerSectionDisplayed: true,
  isSubmitButtonDisabled: false,
  isSubmitButtonDisplayed: true,
  onSubmit: () => console.log('onSubmit'),
};
