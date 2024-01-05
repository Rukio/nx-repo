import { Meta } from '@storybook/react';
import { FC } from 'react';

import Alert from '../index';

export default {
  title: 'Alert',
  component: Alert,
} as Meta<typeof Alert>;

export const Basic: FC = (args) => (
  <Alert
    severity="error"
    message="This is an error alert — check it out!"
    {...args}
  ></Alert>
);

export const Severity = () => (
  <>
    <Alert
      severity="error"
      message="This is an error alert — check it out!"
    ></Alert>
    <Alert
      severity="warning"
      message="This is a warning alert — check it out!"
    ></Alert>
    <Alert
      severity="info"
      message="This is an info alert — check it out!"
    ></Alert>
    <Alert
      severity="success"
      message="This is a success alert — check it out!"
    ></Alert>
  </>
);

export const Outlined = () => (
  <>
    <Alert
      variant="outlined"
      severity="error"
      message="This is an error alert — check it out!"
    ></Alert>
    <Alert
      variant="outlined"
      severity="warning"
      message="This is a warning alert — check it out!"
    ></Alert>
    <Alert
      variant="outlined"
      severity="info"
      message="This is an info alert — check it out!"
    ></Alert>
    <Alert
      variant="outlined"
      severity="success"
      message="This is a success alert — check it out!"
    ></Alert>
  </>
);

export const Filled = () => (
  <>
    <Alert
      variant="filled"
      severity="error"
      message="This is an error alert — check it out!"
    ></Alert>
    <Alert
      variant="filled"
      severity="warning"
      message="This is a warning alert — check it out!"
    ></Alert>
    <Alert
      variant="filled"
      severity="info"
      message="This is an info alert — check it out!"
    ></Alert>
    <Alert
      variant="filled"
      severity="success"
      message="This is a success alert — check it out!"
    ></Alert>
  </>
);

export const BasicWithComponentMessage: FC = (args) => (
  <Alert
    severity="error"
    message={
      <b>This is an error alert with component message — check it out!</b>
    }
    {...args}
  ></Alert>
);
