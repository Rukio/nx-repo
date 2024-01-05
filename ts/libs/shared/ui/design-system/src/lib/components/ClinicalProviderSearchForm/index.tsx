import { useState } from 'react';
import { Box } from '../..';
import FormSelector from './FormSelector';
import SearchForm from './SearchForm';
import { makeSxStyles } from '../../utils/makeSxStyles';

export enum ClinicalProviderSearchFormType {
  Name = 'name',
  Practice = 'practice',
  Phone = 'phone',
  Pharmacy = 'pharmacy',
}

export interface ClinicalProviderSearchTerms {
  practiceName: string;
  providerFirstName: string;
  providerLastName: string;
  pharmacyName: string;
  phone: string;
  rangeInMiles: string;
  zipCode: string;
}

export interface ClinicalProviderSearchFormProps {
  searchForms: ClinicalProviderSearchFormType[];
  onSearch: (
    searchForm: ClinicalProviderSearchFormType,
    searchTerms: ClinicalProviderSearchTerms
  ) => void;
  onFormTypeSelect?: (formType: ClinicalProviderSearchFormType) => void;
  defaultSearchTerms: Partial<ClinicalProviderSearchTerms>;
}

const makeStyles = () =>
  makeSxStyles({
    container: {
      width: '100%',
    },
  });

const ClinicalProviderSearchForm: React.FC<ClinicalProviderSearchFormProps> = ({
  searchForms,
  onSearch,
  onFormTypeSelect,
  defaultSearchTerms,
}) => {
  const styles = makeStyles();
  const [selectedForm, setSelectedForm] = useState(searchForms[0]);

  const handleSearch = (searchTerms: ClinicalProviderSearchTerms) =>
    onSearch(selectedForm, searchTerms);

  const handleFormSelection = (formType: ClinicalProviderSearchFormType) => {
    setSelectedForm(formType);
    if (onFormTypeSelect) {
      onFormTypeSelect(formType);
    }
  };

  return (
    <Box sx={styles.container}>
      {searchForms.length > 1 && (
        <FormSelector
          searchForms={searchForms}
          selectedForm={selectedForm}
          onSelect={handleFormSelection}
        />
      )}
      <SearchForm
        type={selectedForm}
        onSearch={handleSearch}
        defaultSearchTermValues={defaultSearchTerms}
      />
    </Box>
  );
};

export default ClinicalProviderSearchForm;
