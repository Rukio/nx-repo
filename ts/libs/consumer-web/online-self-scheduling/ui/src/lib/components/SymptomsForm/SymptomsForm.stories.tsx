import { Meta, StoryFn } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import SymptomsForm, { SymptomsFormFieldValues } from './SymptomsForm';
import { useForm } from 'react-hook-form';

const makeStyles = () =>
  makeSxStyles({
    bodyWrapper: { display: 'flex', justifyContent: 'center' },
    formWrapper: { width: 600 },
  });

export default {
  title: 'SymptomsForm',
  component: SymptomsForm,
  args: {
    isRelationshipMyself: true,
    onChangeSymptoms: () => console.log('onChangeSymptoms'),
    onResetSymptoms: () => console.log('onResetSymptpoms'),
    symptomsOptions: ['Abdominal Pain', 'Allergic Reaction', 'Animal Bite'],
    unsupportedSymptomsList: [],
    onSubmit: () => console.log('onSubmit'),
  },
} as Meta<typeof SymptomsForm>;

const Template: StoryFn<typeof SymptomsForm> = (args) => {
  const styles = makeStyles();
  const { control } = useForm<SymptomsFormFieldValues>({
    defaultValues: { symptoms: '' },
  });

  return (
    <MemoryRouter>
      <Box sx={styles.bodyWrapper}>
        <Box sx={styles.formWrapper}>
          <SymptomsForm {...args} formControl={control} />
        </Box>
      </Box>
    </MemoryRouter>
  );
};

export const Basic = Template.bind({});

export const CustomSymptomsInput = Template.bind({});
CustomSymptomsInput.args = {
  symptoms: 'Custom symptoms',
};

export const WithAdditionalSymptomsConfirmSection = Template.bind({});
WithAdditionalSymptomsConfirmSection.args = {
  symptoms: 'Abdominal Pain',
  isSymptomsConfirmChecked: true,
  unsupportedSymptomsList: [
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
  onToggleAdditionalSymptomsConfirm: () =>
    console.log('onToggleAdditionalSymptomsConfirm'),
};
