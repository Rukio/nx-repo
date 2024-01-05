import { render, screen } from '../../../../test-utils';
import { Box } from '../../..';
import CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS from '../testIds';

import FormSelector, { FormSelectorProps } from '../FormSelector';
import { ClinicalProviderSearchFormType } from '../index';

const setup = ({ searchForms, selectedForm, onSelect }: FormSelectorProps) => {
  return render(
    <Box sx={{ width: '700px' }}>
      <FormSelector
        searchForms={searchForms}
        selectedForm={selectedForm}
        onSelect={onSelect}
      />
    </Box>
  );
};

const getButtonTestIdFor = (formName: string) =>
  `${CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.FORM_SELECT_BUTTON}-${formName}`;

describe('ClinicalProviderSearchForm - Form Selector', () => {
  it('should render all form options correctly with test ids', () => {
    const mockOnSelect = jest.fn();
    const { asFragment } = setup({
      searchForms: [
        ClinicalProviderSearchFormType.Name,
        ClinicalProviderSearchFormType.Practice,
        ClinicalProviderSearchFormType.Phone,
      ],
      selectedForm: ClinicalProviderSearchFormType.Practice,
      onSelect: mockOnSelect,
    });
    expect(
      screen.getByTestId(
        getButtonTestIdFor(ClinicalProviderSearchFormType.Name)
      )
    ).toHaveTextContent('By Name');
    expect(
      screen.getByTestId(
        getButtonTestIdFor(ClinicalProviderSearchFormType.Practice)
      )
    ).toHaveTextContent('By Practice');
    expect(
      screen.getByTestId(
        getButtonTestIdFor(ClinicalProviderSearchFormType.Phone)
      )
    ).toHaveTextContent('By Phone');
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render subset of form options', () => {
    const mockOnSelect = jest.fn();
    setup({
      searchForms: [
        ClinicalProviderSearchFormType.Name,
        ClinicalProviderSearchFormType.Practice,
      ],
      selectedForm: ClinicalProviderSearchFormType.Name,
      onSelect: mockOnSelect,
    });
    expect(
      screen.getByTestId(
        getButtonTestIdFor(ClinicalProviderSearchFormType.Name)
      )
    ).toHaveTextContent('By Name');
    expect(
      screen.getByTestId(
        getButtonTestIdFor(ClinicalProviderSearchFormType.Practice)
      )
    ).toHaveTextContent('By Practice');
    expect(
      screen.queryByTestId(
        getButtonTestIdFor(ClinicalProviderSearchFormType.Phone)
      )
    ).not.toBeInTheDocument();
  });

  it('should notify which form selected', async () => {
    const mockOnSelect = jest.fn();
    const { user } = setup({
      searchForms: [
        ClinicalProviderSearchFormType.Name,
        ClinicalProviderSearchFormType.Practice,
        ClinicalProviderSearchFormType.Phone,
      ],
      selectedForm: ClinicalProviderSearchFormType.Phone,
      onSelect: mockOnSelect,
    });

    const practiceFormSelectButton = screen.getByTestId(
      getButtonTestIdFor(ClinicalProviderSearchFormType.Practice)
    );
    await user.click(practiceFormSelectButton);
    expect(mockOnSelect).toHaveBeenCalledWith(
      ClinicalProviderSearchFormType.Practice
    );
  });
});
