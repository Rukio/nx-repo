import { Meta } from '@storybook/react';
import { FC } from 'react';

import ClinicalProviderSearchForm, {
  ClinicalProviderSearchFormType,
  ClinicalProviderSearchTerms,
} from '../index';
import { Box } from '../../../index';

export default {
  title: 'Clinical Provider Search Form',
  component: ClinicalProviderSearchForm,
} as Meta<typeof ClinicalProviderSearchForm>;

export const NamePracticePhoneSearch: FC = (args) => (
  <Box sx={{ maxWidth: '390px', display: 'flex', justifyContent: 'center' }}>
    <ClinicalProviderSearchForm
      searchForms={[
        ClinicalProviderSearchFormType.Name,
        ClinicalProviderSearchFormType.Practice,
        ClinicalProviderSearchFormType.Phone,
      ]}
      onSearch={(
        formType: ClinicalProviderSearchFormType,
        searchTerms: ClinicalProviderSearchTerms
      ) => {
        console.log('Search', formType);
        console.log('Search Terms', searchTerms);
      }}
      onFormTypeSelect={(formType: ClinicalProviderSearchFormType) =>
        console.log('Form type change', formType)
      }
      defaultSearchTerms={{}}
      {...args}
    />
  </Box>
);

export const NamePracticeSearch: FC = (args) => (
  <Box sx={{ maxWidth: '390px', display: 'flex', justifyContent: 'center' }}>
    <ClinicalProviderSearchForm
      searchForms={[
        ClinicalProviderSearchFormType.Name,
        ClinicalProviderSearchFormType.Practice,
      ]}
      onSearch={(
        formType: ClinicalProviderSearchFormType,
        searchTerms: ClinicalProviderSearchTerms
      ) => {
        console.log('Search by', formType);
        console.log('Search Terms', searchTerms);
      }}
      onFormTypeSelect={(formType: ClinicalProviderSearchFormType) =>
        console.log('Form type change', formType)
      }
      defaultSearchTerms={{
        rangeInMiles: '50',
        zipCode: '92037',
      }}
      {...args}
    />
  </Box>
);

export const PharmacySearch: FC = (args) => (
  <Box sx={{ maxWidth: '390px', display: 'flex', justifyContent: 'center' }}>
    <ClinicalProviderSearchForm
      searchForms={[ClinicalProviderSearchFormType.Pharmacy]}
      onSearch={(
        formType: ClinicalProviderSearchFormType,
        searchTerms: ClinicalProviderSearchTerms
      ) => {
        console.log('Search', formType);
        console.log('Search Terms', searchTerms);
      }}
      defaultSearchTerms={{
        rangeInMiles: '10',
        zipCode: '92037',
      }}
      {...args}
    />
  </Box>
);
