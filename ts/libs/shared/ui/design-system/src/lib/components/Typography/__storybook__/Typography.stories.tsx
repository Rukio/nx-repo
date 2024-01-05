import { Meta } from '@storybook/react';
import { FC } from 'react';
import { Box, Typography } from '../../..';

export default {
  title: 'Typography',
  component: Typography,
} as Meta<typeof Typography>;

export const Default: FC = (args) => {
  return (
    <Typography variant="body1" {...args}>
      This is an example of using the Typography component
    </Typography>
  );
};
export const Variants: FC = (args) => (
  <Box>
    <Typography variant="h1" {...args}>
      Heading 1
    </Typography>
    <Typography variant="h2" {...args}>
      Heading 2
    </Typography>
    <Typography variant="h3" {...args}>
      Heading 3
    </Typography>
    <Typography variant="h4" {...args}>
      Heading 4
    </Typography>
    <Typography variant="h5" {...args}>
      Heading 5
    </Typography>
    <Typography variant="h6" {...args}>
      Heading 6
    </Typography>
    <Typography variant="h7" {...args}>
      Heading 7
    </Typography>

    <Typography variant="subtitle1" {...args}>
      subtitle1
    </Typography>
    <Typography variant="body1" {...args}>
      body1
    </Typography>
    <Typography variant="body2" {...args}>
      body2
    </Typography>
    <Typography variant="button" {...args}>
      button
    </Typography>
    <Typography variant="label" {...args}>
      label
    </Typography>
    <Typography variant="caption" {...args}>
      caption
    </Typography>
    <Typography variant="overline" {...args}>
      overline
    </Typography>
  </Box>
);
