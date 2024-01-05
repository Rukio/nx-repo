import { render, screen, waitFor, exactRegexMatch } from '../../../testUtils';
import SelectInsuranceProviderModal, {
  SelectInsuranceProviderModalProps,
} from './SelectInsuranceProviderModal';
import { SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS } from './testIds';

const defaultProps: Omit<SelectInsuranceProviderModalProps, 'formControl'> = {
  open: true,
  insuranceNotInListButtonLabel: 'My insurance isn’t on this list',
  insuranceSearch: '',
  searchOptions: [
    {
      id: '1',
      name: 'C Insurance 2',
      classificationId: '1',
      classificationName: 'Awesome Classification 1',
    },
    {
      id: '2',
      name: 'V Insurance 3',
      classificationId: '2',
      classificationName: 'Awesome Classification 2',
    },
  ],
  onClose: jest.fn(),
  onChooseInsurance: jest.fn(),
  onChangeSearch: jest.fn(),
  onNotOnThisListClick: jest.fn(),
};

const getContainer = () =>
  screen.getByTestId(SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.CONTAINER);
const getCloseModalIcon = () =>
  screen.getByTestId(SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.CLOSE_MODAL_ICON);
const getSearchInsuranceInput = () =>
  screen.getByTestId(SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.SEARCH_INSURANCE);
const getSectionCharacter = (value: string) =>
  screen.getByTestId(
    SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getSectionCharacter(value)
  );
const getInsuranceNotInTheListButton = () =>
  screen.getByTestId(
    SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.INSURANCE_NOT_IN_THE_LIST
  );
const getInsuranceOption = (value: string) =>
  screen.getByTestId(
    SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getInsuranceOptionId(
      value.toString()
    )
  );

const setup = (props: Partial<SelectInsuranceProviderModalProps> = {}) =>
  render(<SelectInsuranceProviderModal {...defaultProps} {...props} />);

describe('SelectInsuranceProviderModal', () => {
  it('should render SelectInsuranceProviderModal correctly', () => {
    setup();

    const container = getContainer();
    expect(container).toBeVisible();

    const closeModalIcon = getCloseModalIcon();
    expect(closeModalIcon).toBeVisible();

    const searchInsuranceInput = getSearchInsuranceInput();
    expect(searchInsuranceInput).toBeVisible();
    expect(searchInsuranceInput).toBeEnabled();

    const insuranceNotInTheListButton = getInsuranceNotInTheListButton();
    expect(insuranceNotInTheListButton).toBeVisible();
    expect(insuranceNotInTheListButton).toBeEnabled();
    expect(insuranceNotInTheListButton).toHaveTextContent(
      exactRegexMatch(defaultProps.insuranceNotInListButtonLabel)
    );

    const sectionCharacter = getSectionCharacter(
      Array.from(defaultProps.searchOptions[0].name)[0]
    );
    expect(sectionCharacter).toBeVisible();
    expect(sectionCharacter).toHaveTextContent(
      Array.from(defaultProps.searchOptions[0].name)[0]
    );

    const insuranceOption = getInsuranceOption(
      defaultProps.searchOptions[0].id
    );
    expect(insuranceOption).toBeVisible();
    expect(insuranceOption).toHaveTextContent(
      defaultProps.searchOptions[0].name
    );
  });

  it('should display alternative script if the relationship to the patient is someone else', () => {
    const mockButtonLabel = 'Their insurance isn’t on this list';

    setup({
      insuranceNotInListButtonLabel: mockButtonLabel,
    });

    const insuranceNotInTheListButton = getInsuranceNotInTheListButton();
    expect(insuranceNotInTheListButton).toBeVisible();
    expect(insuranceNotInTheListButton).toBeEnabled();
    expect(insuranceNotInTheListButton).toHaveTextContent(
      exactRegexMatch(mockButtonLabel)
    );
  });

  it('should call onClose once click on Close icon', async () => {
    const { user } = setup();

    const closeModalIcon = getCloseModalIcon();
    expect(closeModalIcon).toBeVisible();

    await user.click(closeModalIcon);

    expect(defaultProps.onClose).toBeCalledTimes(1);
  });

  it('should call onChangeSearch once type in search textfield', async () => {
    const valueToType = 'Test';

    const { user } = setup();

    const searchInsuranceInput = getSearchInsuranceInput();
    expect(searchInsuranceInput).toBeVisible();
    expect(searchInsuranceInput).toBeEnabled();

    await user.type(searchInsuranceInput, valueToType);

    await waitFor(() => {
      expect(defaultProps.onChangeSearch).toBeCalledTimes(1);
    });
  });

  it('should generate display payers filtered by search', () => {
    setup({ insuranceSearch: 'C Insurance' });

    const insuranceOptionFirst = getInsuranceOption(
      defaultProps.searchOptions[0].id
    );
    const insuranceOptionSecond = screen.queryByTestId(
      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getInsuranceOptionId(
        defaultProps.searchOptions[1].id.toString()
      )
    );

    expect(insuranceOptionFirst).toBeVisible();
    expect(insuranceOptionSecond).not.toBeInTheDocument();
  });

  it('should call onChooseInsurance once click on insurance option', async () => {
    const { user } = setup();

    const insuranceOption = getInsuranceOption(
      defaultProps.searchOptions[0].id
    );
    expect(insuranceOption).toBeVisible();
    expect(insuranceOption).toHaveTextContent(
      defaultProps.searchOptions[0].name
    );

    await user.click(insuranceOption);

    expect(defaultProps.onChooseInsurance).toBeCalledWith(
      defaultProps.searchOptions[0].id.toString()
    );
  });

  it('should call onNotOnThisListClick if clicked on the corresponding button', async () => {
    const { user } = setup();

    await user.click(getInsuranceNotInTheListButton());

    expect(defaultProps.onNotOnThisListClick).toBeCalledTimes(1);
  });
});
