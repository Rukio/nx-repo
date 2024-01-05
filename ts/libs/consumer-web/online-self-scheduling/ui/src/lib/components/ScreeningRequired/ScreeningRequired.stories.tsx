import { Meta, StoryFn } from '@storybook/react';
import { Grid } from '@*company-data-covered*/design-system';
import { ScreeningRequired } from './ScreeningRequired';

export default {
  title: 'ScreeningRequired',
  component: ScreeningRequired,
  args: {
    isRelationshipSelf: true,
    phoneNumber: '833-555-2969',
    onClickCall: () => console.log('onClickCall'),
  },
} as Meta<typeof ScreeningRequired>;

const Template: StoryFn<typeof ScreeningRequired> = (args) => {
  return (
    <Grid container justifyContent="center">
      <Grid item width={600}>
        <ScreeningRequired {...args} />
      </Grid>
    </Grid>
  );
};

export const Basic = Template.bind({});

export const WithNonSelfRelationship = Template.bind({});
WithNonSelfRelationship.args = {
  isRelationshipSelf: false,
  patientFirstName: 'Hunter',
};
