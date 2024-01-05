import { Box } from '@*company-data-covered*/design-system';
import { Meta, StoryFn } from '@storybook/react';
import { useForm } from 'react-hook-form';
import AdditionalSymptomsConfirmation from './AdditionalSymptomsConfirmation';

export default {
  title: 'AdditionalSymptomsConfirmation',
  component: AdditionalSymptomsConfirmation,
  args: {
    symptomsList: [
      'Severe headaches',
      'Difficulty breathing',
      'Chest pain',
      'Fainting',
      'Seizures',
      'Uncontrolled or unexplained bleeding',
      'Stroke symptoms',
      'Pregnancy concerns',
      'Problems after surgery',
      'Rapidly worsening symptoms',
    ],
    alertMessage:
      'If the patient is experiencing any of the following symptoms, please call 911 or a doctor.',
    checkboxLabel:
      'The patient is not experiencing any of these additional symptoms.',
    onToggle: () => console.log('onToggle'),
  },
} as Meta<typeof AdditionalSymptomsConfirmation>;

const Template: StoryFn<typeof AdditionalSymptomsConfirmation> = (args) => {
  const { control } = useForm();

  return (
    <Box maxWidth={600}>
      <AdditionalSymptomsConfirmation
        {...args}
        formControl={control}
        formFieldName="test"
      />
    </Box>
  );
};

export const Basic = Template.bind({});
