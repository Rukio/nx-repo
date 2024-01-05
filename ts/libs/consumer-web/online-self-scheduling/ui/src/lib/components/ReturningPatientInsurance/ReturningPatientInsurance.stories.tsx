import { Meta, StoryFn } from '@storybook/react';
import { Grid } from '@*company-data-covered*/design-system';
import {
  ReturningPatientInsurance,
  ReturningPatientInsuranceProps,
} from './ReturningPatientInsurance';

export default {
  title: 'ReturningPatientInsurance',
  component: ReturningPatientInsurance,
  args: {
    returningPatientInsuranceTitle: 'Do you have the same primary insurance?',
    onClickInsuranceIsSameButton: () =>
      console.log('onClickInsuranceIsSameButton'),
    onClickInsuranceHasChangedButton: () =>
      console.log('onClickInsuranceHasChangedButton'),
  },
} as Meta<typeof ReturningPatientInsurance>;

const Template: StoryFn<typeof ReturningPatientInsurance> = (
  args: ReturningPatientInsuranceProps
) => (
  <Grid container justifyContent="center">
    <Grid item width={600}>
      <ReturningPatientInsurance {...args} />
    </Grid>
  </Grid>
);

export const Basic = Template.bind({});
