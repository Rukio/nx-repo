import { Meta } from '@storybook/react';
import { FC } from 'react';

import ClinicalProviderCard, { ClinicalProviderDetails } from '../index';
import { Box } from '../../../index';

export default {
  title: 'Clinical Provider Card',
  component: ClinicalProviderCard,
} as Meta<typeof ClinicalProviderCard>;

const exampleClinicalProvider: ClinicalProviderDetails = {
  id: 42,
  name: 'THEODOR Geisel',
  address: '7301 encelia DRIVE',
  city: 'LA jolla',
  state: 'Ca',
  zipCode: '92037',
  phone: '999 555 1212',
  fax: '999 555 1000',
};

export const Basic: FC = (args) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <Box sx={{ width: '300px' }}>
      <ClinicalProviderCard
        clinicalProviderDetails={exampleClinicalProvider}
        isFaxVisible={true}
        onSelect={(id) => console.log('Selected', id)}
        testIdPrefix="storybook"
        {...args}
      />
    </Box>
    <Box sx={{ width: '348px' }}>
      <ClinicalProviderCard
        clinicalProviderDetails={exampleClinicalProvider}
        isFaxVisible={true}
        onSelect={(id) => console.log('Selected', id)}
        testIdPrefix="storybook"
        {...args}
      />{' '}
    </Box>
    <Box sx={{ width: '600px' }}>
      <ClinicalProviderCard
        clinicalProviderDetails={exampleClinicalProvider}
        isFaxVisible={true}
        onSelect={(id) => console.log('Selected', id)}
        testIdPrefix="storybook"
        {...args}
      />
    </Box>
  </Box>
);
