import { Meta } from '@storybook/react';
import { FC } from 'react';
import *company-data-covered*Logo from '../index';

export default {
  title: '*company-data-covered* Logo',
  component: *company-data-covered*Logo,
} as Meta<typeof *company-data-covered*Logo>;

export const *company-data-covered*LogoBasic: FC = (args) => (
  <*company-data-covered*Logo {...args} />
);
