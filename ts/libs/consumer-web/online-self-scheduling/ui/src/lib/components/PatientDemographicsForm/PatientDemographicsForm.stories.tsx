import { Meta, StoryFn } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { Grid } from '@*company-data-covered*/design-system';
import PatientDemographicsForm, {
  PatientDemographicsFormFieldValues,
  DEFAULT_FORM_FIELD_VALUES,
} from './PatientDemographicsForm';

export default {
  title: 'PatientDemographicsForm',
  component: PatientDemographicsForm,
  args: {
    formHeaderTitle: 'Tell us more about yourself',
    isReturningPatientSectionVisible: false,
    isRequesterSectionVisible: false,
    isPatientSectionVisible: true,
    relationshipToPatientOptions: [
      { value: 'Myself', label: 'myself' },
      {
        value: 'Add Someone Else',
        label: 'addSomeoneElse',
        'data-testid': 'add-someone-else',
      },
    ],
    legalSexOptions: [{ value: 'value', label: 'label' }],
    assignedSexAtBirthOptions: [{ value: 'value', label: 'label' }],
    genderIdentityOptions: [{ value: 'value', label: 'label' }],
    isSexAndGenderDetailsExpanded: false,
    onClickAddSexAndGenderDetails: () =>
      console.log('onClickAddSexAndGenderDetails'),
    onSubmit: () => console.log('onSubmit'),
  },
} as Meta<typeof PatientDemographicsForm>;

const Template: StoryFn<typeof PatientDemographicsForm> = (args) => {
  const { control } = useForm<PatientDemographicsFormFieldValues>({
    values: DEFAULT_FORM_FIELD_VALUES,
  });

  return (
    <Grid container justifyContent="center">
      <Grid item>
        <PatientDemographicsForm {...args} formControl={control} />
      </Grid>
    </Grid>
  );
};

export const Basic = Template.bind({});

export const WithReturningPatientSection = Template.bind({});
WithReturningPatientSection.args = {
  formHeaderTitle: 'Welcome back, Alexandra',
  formHeaderSubtitle: 'Who are you requesting care for?',
  isReturningPatientSectionVisible: true,
};

export const WithRequesterSection = Template.bind({});
WithRequesterSection.args = {
  formHeaderTitle: 'Tell us more about the person receiving care',
  isRequesterSectionVisible: true,
};
