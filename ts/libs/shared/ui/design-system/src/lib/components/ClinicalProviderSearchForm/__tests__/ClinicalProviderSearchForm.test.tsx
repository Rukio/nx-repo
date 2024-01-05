import { render, screen } from '../../../../test-utils';
import { Box } from '../../..';

import ClinicalProviderSearchForm, {
  ClinicalProviderSearchFormType,
  ClinicalProviderSearchFormProps,
} from '../index';
import CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS from '../testIds';

const setup = ({
  searchForms,
  onSearch,
  defaultSearchTerms,
  onFormTypeSelect = undefined,
}: ClinicalProviderSearchFormProps) => {
  return render(
    <Box sx={{ width: '600px' }}>
      <ClinicalProviderSearchForm
        searchForms={searchForms}
        onSearch={onSearch}
        defaultSearchTerms={defaultSearchTerms}
        onFormTypeSelect={onFormTypeSelect}
      />
    </Box>
  );
};

describe('ClinicalProviderSearchForm', () => {
  it('should render correctly for Name, Practice and Phone Forms', () => {
    const mockOnSearch = jest.fn();
    const { asFragment } = setup({
      searchForms: [
        ClinicalProviderSearchFormType.Name,
        ClinicalProviderSearchFormType.Practice,
        ClinicalProviderSearchFormType.Phone,
      ],
      onSearch: mockOnSearch,
      defaultSearchTerms: { zipCode: '96789', rangeInMiles: '10' },
    });
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render correctly for Name and Practice Forms', () => {
    const mockOnSearch = jest.fn();
    const { asFragment } = setup({
      searchForms: [
        ClinicalProviderSearchFormType.Name,
        ClinicalProviderSearchFormType.Practice,
      ],
      onSearch: mockOnSearch,
      defaultSearchTerms: { zipCode: '96789', rangeInMiles: '10' },
    });
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render correctly for single Pharmacy Form', () => {
    const mockOnSearch = jest.fn();
    const { asFragment } = setup({
      searchForms: [ClinicalProviderSearchFormType.Pharmacy],
      onSearch: mockOnSearch,
      defaultSearchTerms: { zipCode: '96789', rangeInMiles: '10' },
    });
    expect(asFragment()).toMatchSnapshot();
  });

  it('should provide form type and search terms on search', async () => {
    const mockOnSearch = jest.fn();
    const { user } = setup({
      searchForms: [
        ClinicalProviderSearchFormType.Name,
        ClinicalProviderSearchFormType.Practice,
      ],
      onSearch: mockOnSearch,
      defaultSearchTerms: { zipCode: '12345', rangeInMiles: '10' },
    });

    const practiceFormSelectButton = screen.getByTestId(
      `${CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.FORM_SELECT_BUTTON}-${ClinicalProviderSearchFormType.Practice}`
    );
    await user.click(practiceFormSelectButton);

    const practiceNameInputEl = screen.getByTestId(
      CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.PRACTICE_NAME_INPUT
    );
    const zipCodeInputEl = screen.getByTestId(
      CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.ZIP_CODE_INPUT
    );
    const searchButton = screen.getByTestId(
      CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.SEARCH_BUTTON
    );
    await user.type(practiceNameInputEl, 'Feel Good');
    await user.clear(zipCodeInputEl);
    await user.type(zipCodeInputEl, '96825');
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith(
      ClinicalProviderSearchFormType.Practice,
      {
        practiceName: 'Feel Good',
        providerFirstName: '',
        providerLastName: '',
        pharmacyName: '',
        phone: '',
        rangeInMiles: '10',
        zipCode: '96825',
      }
    );
  });

  it('should render form with any default values', () => {
    const mockOnSearch = jest.fn();
    setup({
      searchForms: [
        ClinicalProviderSearchFormType.Name,
        ClinicalProviderSearchFormType.Practice,
      ],
      onSearch: mockOnSearch,
      defaultSearchTerms: {
        providerFirstName: 'theodore',
        providerLastName: 'Geisel',
      },
    });
    const firstNameInputEl = screen.getByTestId(
      CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.FIRST_NAME_INPUT
    );
    const lastNameInputEl = screen.getByTestId(
      CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.LAST_NAME_INPUT
    );
    expect(firstNameInputEl).toHaveValue('theodore');
    expect(lastNameInputEl).toHaveValue('Geisel');
  });

  it('should notify on form selections', async () => {
    const mockOnSearch = jest.fn();
    const mockOnFormTypeSelected = jest.fn();
    const { user } = setup({
      searchForms: [
        ClinicalProviderSearchFormType.Name,
        ClinicalProviderSearchFormType.Practice,
      ],
      onSearch: mockOnSearch,
      onFormTypeSelect: mockOnFormTypeSelected,
      defaultSearchTerms: {
        providerFirstName: 'theodore',
        providerLastName: 'Geisel',
      },
    });
    const practiceFormSelectButton = screen.getByTestId(
      `${CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.FORM_SELECT_BUTTON}-${ClinicalProviderSearchFormType.Practice}`
    );
    await user.click(practiceFormSelectButton);
    expect(mockOnFormTypeSelected).toBeCalledWith(
      ClinicalProviderSearchFormType.Practice
    );
  });
});
