import { Meta, StoryFn } from '@storybook/react';
import { Grid } from '@*company-data-covered*/design-system';
import { OffboardSection } from './OffboardSection';

export default {
  title: 'OffboardSection',
  component: OffboardSection,
  args: {
    title:
      'We apologize, we don’t have an appropriate team available to care for you today.',
    message:
      'We encourage you to call your primary care provider or seek care at a facility.',
  },
} as Meta<typeof OffboardSection>;

const Template: StoryFn<typeof OffboardSection> = (args) => {
  return (
    <Grid container justifyContent="center">
      <Grid item width={600}>
        <OffboardSection {...args} />
      </Grid>
    </Grid>
  );
};

export const Basic = Template.bind({});
