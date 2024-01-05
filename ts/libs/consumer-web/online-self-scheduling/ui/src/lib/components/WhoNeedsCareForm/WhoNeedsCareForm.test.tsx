import { useForm } from 'react-hook-form';
import {
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '../../../testUtils';
import { FORM_FOOTER_TEST_IDS } from '../FormFooter';
import { FORM_HEADER_TEST_IDS } from '../FormHeader';
import {
  WhoNeedsCareForm,
  DESKTOP_IMAGE_WIDTH_PX,
  getImageSizes,
  MOBILE_IMAGE_WIDTH_PX,
  WhoNeedsCareFormProps,
  WhoNeedsCareFormFieldValues,
} from './WhoNeedsCareForm';
import { REQUEST_CARE_FORM_TEST_IDS } from './testIds';

const defaultProps: Omit<WhoNeedsCareFormProps, 'formControl'> = {
  relationshipToPatientOptions: [
    { value: 'myself', label: 'Myself' },
    { value: 'friend', label: 'Friend' },
  ],
  isSubmitButtonDisabled: false,
  onSubmit: jest.fn(),
};

const mockWhoNeedsCareFormFieldValues: WhoNeedsCareFormFieldValues = {
  relationToPatient: 'myself',
};

const getRelationshipSelect = () =>
  screen.getByTestId(REQUEST_CARE_FORM_TEST_IDS.RELATIONSHIP_SELECT);

const getSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);

const getHelperText = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.HELPER_TEXT);

const findAllRelationshipMenuItems = () =>
  screen.findAllByTestId(
    new RegExp(REQUEST_CARE_FORM_TEST_IDS.RELATIONSHIP_SELECT_ITEM_PREFIX)
  );

const setup = (props: Partial<WhoNeedsCareFormProps> = {}) => {
  const { result } = renderHook(() =>
    useForm<WhoNeedsCareFormFieldValues>({
      values: mockWhoNeedsCareFormFieldValues,
    })
  );

  return render(
    <WhoNeedsCareForm
      formControl={result.current.control}
      {...defaultProps}
      {...props}
    />
  );
};

describe('<WhoNeedsCareForm />', () => {
  it('should render form correctly', () => {
    setup();

    const title = screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Get an appointment in just a few steps');

    const subtitle = screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(
      'Schedule an appointment and our fully-equipped medical team will come right to your door. It’s fast, easy, and secure.'
    );

    const relationshipSelectTitle = screen.getByTestId(
      REQUEST_CARE_FORM_TEST_IDS.RELATIONSHIP_SELECT_TITLE
    );
    expect(relationshipSelectTitle).toBeVisible();
    expect(relationshipSelectTitle).toHaveTextContent(
      'Who are you requesting care for?'
    );

    const relationshipSelect = getRelationshipSelect();
    expect(relationshipSelect).toBeVisible();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();
    expect(submitButton).toHaveTextContent('Continue');

    const helperText = getHelperText();
    expect(helperText).toBeVisible();
    expect(helperText).toHaveTextContent(
      '*company-data-covered* can’t replace calling 911 during an emergency.'
    );
  });

  it('should render menu items correctly', async () => {
    const { user } = setup();

    const relationshipSelect = getRelationshipSelect();
    expect(relationshipSelect).toBeVisible();

    const relationshipSelectButton =
      within(relationshipSelect).getByRole('button');
    expect(relationshipSelectButton).toBeVisible();

    await user.click(relationshipSelectButton);

    const relationshipMenuItems = await findAllRelationshipMenuItems();
    relationshipMenuItems.forEach((relationshipMenuItem, idx) => {
      expect(relationshipMenuItem).toHaveTextContent(
        defaultProps.relationshipToPatientOptions[idx].label
      );
    });
  });

  it('should render disabled submit button if isSubmitButtonDisabled is truthy', () => {
    setup({ isSubmitButtonDisabled: true });

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Continue');
  });

  it('should call onSubmit on on submit button click', async () => {
    const { user } = setup();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();
    expect(submitButton).toHaveTextContent('Continue');

    await user.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toBeCalled();
    });
  });
});

describe('getImageSizes', () => {
  it('should return correctly generated sizes', () => {
    const mockDevicePixelRatio = 1;
    window.devicePixelRatio = mockDevicePixelRatio;

    const mockSmBreakpointPx = 600;
    const imageSizes = getImageSizes(mockSmBreakpointPx);

    const expectedDesktopImageSize =
      DESKTOP_IMAGE_WIDTH_PX / mockDevicePixelRatio;
    const expectedMobileImageSize =
      MOBILE_IMAGE_WIDTH_PX / mockDevicePixelRatio;

    expect(imageSizes).toBe(
      `(min-width: ${mockSmBreakpointPx}px) ${expectedDesktopImageSize}px, ${expectedMobileImageSize}px`
    );
  });
});
