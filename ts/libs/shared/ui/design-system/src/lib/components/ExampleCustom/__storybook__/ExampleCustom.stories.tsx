import { Meta } from '@storybook/react';
import { ExampleCustom as Example } from '..';

export const ExampleCustom = () => (
  <Example
    title="Example Custom"
    subtitle="Custom component example setup"
    subtitle2="What it looks like"
    href="https://www.*company-data-covered*.com/"
  />
);

export default {
  component: Example,
  title: 'ExampleCustom',
} as Meta<typeof ExampleCustom>;
