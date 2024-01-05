import { render, screen, Screen } from '../../../../test-utils';
import { Box } from '../../..';
import CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS from '../testIds';

import SearchForm, { SearchFormProps } from '../SearchForm';
import {
  ClinicalProviderSearchFormType,
  ClinicalProviderSearchTerms,
} from '../index';

const testZipCode = '12345';
const testRangeInMiles = '10';
const testDefaultSearchTermValues: Partial<ClinicalProviderSearchTerms> = {
  zipCode: testZipCode,
  rangeInMiles: testRangeInMiles,
};

const noop = () => {
  // noop
};

const setup = ({
  type = ClinicalProviderSearchFormType.Name,
  defaultSearchTermValues = testDefaultSearchTermValues,
  onSearch = noop,
}: Partial<SearchFormProps>) => {
  return render(
    <Box sx={{ width: '700px' }}>
      <SearchForm
        type={type}
        defaultSearchTermValues={defaultSearchTermValues}
        onSearch={onSearch}
      />
    </Box>
  );
};

describe('ClinicalProviderSearchForm - Search Form', () => {
  const validateInputPlaceHolder = (
    screen: Screen,
    testId: string,
    placeHolder: string
  ) => {
    expect(screen.getByTestId(testId)).toBeVisible();
    expect(screen.getByPlaceholderText(placeHolder)).toBeVisible();
  };

  describe('Name Search', () => {
    it('should render correctly with test ids', () => {
      const mockOnSearch = jest.fn();
      setup({
        type: ClinicalProviderSearchFormType.Name,
        onSearch: mockOnSearch,
      });
      validateInputPlaceHolder(
        screen,
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.FIRST_NAME_INPUT,
        'First Name'
      );
      validateInputPlaceHolder(
        screen,
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.LAST_NAME_INPUT,
        'Last Name'
      );
      expect(
        screen.getByTestId(
          CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.ZIP_CODE_INPUT
        )
      ).toHaveDisplayValue(testZipCode);
      expect(screen.getByLabelText('Zip Code')).toBeVisible();
      expect(screen.getByLabelText('Within')).toBeVisible();
      expect(
        screen.getByTestId(CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.SEARCH_BUTTON)
      ).toBeDisabled();
    });

    it('should provide search values on search button', async () => {
      const mockOnSearch = jest.fn();
      const { user } = setup({
        type: ClinicalProviderSearchFormType.Name,
        onSearch: mockOnSearch,
      });
      const firstNameEl = screen.getByTestId(
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.FIRST_NAME_INPUT
      );
      const lastNameEl = screen.getByTestId(
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.LAST_NAME_INPUT
      );
      const searchButton = screen.getByTestId(
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.SEARCH_BUTTON
      );
      await user.type(firstNameEl, 'Doctor');
      await user.type(lastNameEl, 'No');
      await user.click(searchButton);
      expect(mockOnSearch).toHaveBeenCalledWith({
        practiceName: '',
        providerFirstName: 'Doctor',
        providerLastName: 'No',
        pharmacyName: '',
        phone: '',
        rangeInMiles: testRangeInMiles,
        zipCode: testZipCode,
      });
    });
  });

  describe('Practice Search', () => {
    it('should render correctly with test ids', () => {
      const mockOnSearch = jest.fn();
      setup({
        type: ClinicalProviderSearchFormType.Practice,
        onSearch: mockOnSearch,
      });
      validateInputPlaceHolder(
        screen,
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.PRACTICE_NAME_INPUT,
        'Practice Name'
      );
      expect(
        screen.getByTestId(
          CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.ZIP_CODE_INPUT
        )
      ).toHaveDisplayValue(testZipCode);
      expect(screen.getByLabelText('Zip Code')).toBeVisible();
      expect(screen.getByLabelText('Within')).toBeVisible();
      expect(
        screen.getByTestId(CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.SEARCH_BUTTON)
      ).toBeDisabled();
    });

    it('should provide search values on search button', async () => {
      const mockOnSearch = jest.fn();
      const { user } = setup({
        type: ClinicalProviderSearchFormType.Practice,
        onSearch: mockOnSearch,
      });
      const practiceNameEl = screen.getByTestId(
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.PRACTICE_NAME_INPUT
      );
      const searchButton = screen.getByTestId(
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.SEARCH_BUTTON
      );
      await user.type(practiceNameEl, 'Feel Good');
      await user.click(searchButton);
      expect(mockOnSearch).toHaveBeenCalledWith({
        practiceName: 'Feel Good',
        providerFirstName: '',
        providerLastName: '',
        pharmacyName: '',
        phone: '',
        rangeInMiles: testRangeInMiles,
        zipCode: testZipCode,
      });
    });
  });

  describe('Phone Search', () => {
    it('should render correctly with test ids', () => {
      const mockOnSearch = jest.fn();
      setup({
        type: ClinicalProviderSearchFormType.Phone,
        defaultSearchTermValues: {},
        onSearch: mockOnSearch,
      });
      validateInputPlaceHolder(
        screen,
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.PHONE_INPUT,
        'Phone Number'
      );
      expect(
        screen.queryByTestId(
          CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.ZIP_CODE_INPUT
        )
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId(CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.SEARCH_BUTTON)
      ).toBeDisabled();
    });

    it('should provide search values on search button', async () => {
      const mockOnSearch = jest.fn();
      const { user } = setup({
        type: ClinicalProviderSearchFormType.Phone,
        defaultSearchTermValues: {},
        onSearch: mockOnSearch,
      });
      const phoneEl = screen.getByTestId(
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.PHONE_INPUT
      );
      const searchButton = screen.getByTestId(
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.SEARCH_BUTTON
      );
      await user.type(phoneEl, '808 123 4567');
      await user.click(searchButton);
      expect(mockOnSearch).toHaveBeenCalledWith({
        practiceName: '',
        providerFirstName: '',
        providerLastName: '',
        pharmacyName: '',
        phone: '8081234567',
        rangeInMiles: '',
        zipCode: '',
      });
    });
  });

  describe('Pharmacy Search', () => {
    it('should render correctly with test ids', () => {
      const mockOnSearch = jest.fn();
      setup({
        type: ClinicalProviderSearchFormType.Pharmacy,
        onSearch: mockOnSearch,
      });
      validateInputPlaceHolder(
        screen,
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.PHARMACY_NAME_INPUT,
        'Pharmacy Name'
      );
      expect(
        screen.getByTestId(
          CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.ZIP_CODE_INPUT
        )
      ).toHaveDisplayValue(testZipCode);
      expect(screen.getByLabelText('Zip Code')).toBeVisible();
      expect(screen.getByLabelText('Within')).toBeVisible();
      expect(
        screen.getByTestId(CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.SEARCH_BUTTON)
      ).toBeDisabled();
    });

    it('should provide search values on search button', async () => {
      const mockOnSearch = jest.fn();
      const { user } = setup({
        type: ClinicalProviderSearchFormType.Pharmacy,
        onSearch: mockOnSearch,
      });
      const pharmacyNameEl = screen.getByTestId(
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.PHARMACY_NAME_INPUT
      );
      const searchButton = screen.getByTestId(
        CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.SEARCH_BUTTON
      );
      await user.type(pharmacyNameEl, 'CVS');
      await user.click(searchButton);
      expect(mockOnSearch).toHaveBeenCalledWith({
        practiceName: '',
        providerFirstName: '',
        providerLastName: '',
        pharmacyName: 'CVS',
        phone: '',
        rangeInMiles: testRangeInMiles,
        zipCode: testZipCode,
      });
    });
  });
});
