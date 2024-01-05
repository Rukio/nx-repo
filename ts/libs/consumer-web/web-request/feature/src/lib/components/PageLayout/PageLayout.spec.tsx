import {
  mockAddress,
  mockCaller,
  mockComplaint,
  mockPatient,
  mockPatientPreferredEta,
  RelationshipToPatient,
  RequestCaller,
  requestInitialState,
  RootState,
  selectCaller,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import { mocked } from 'jest-mock';
import { useLocation, Location, useSearchParams } from 'react-router-dom';
import {
  act,
  CustomRenderOptions,
  render,
  screen,
  waitFor,
} from '../../../testUtils';
import { WEB_REQUEST_ROUTES } from '../../constants';
import PageLayout, { PageLayoutProps } from './PageLayout';
import { PAGE_LAYOUT_TEST_IDS } from './testIds';

const recaptcha: ReCaptchaV2.ReCaptcha = {
  render: jest.fn(),
  reset: jest.fn(),
  getResponse: jest.fn(),
  execute: jest.fn().mockResolvedValue('test'),
  ready: jest.fn((callback) => callback()),
};

window.grecaptcha = { ...recaptcha, enterprise: recaptcha };

const mockSelectRequest = jest.fn().mockReturnValue(requestInitialState);

jest.mock('@*company-data-covered*/consumer-web/web-request/data-access', () => ({
  ...jest.requireActual('@*company-data-covered*/consumer-web/web-request/data-access'),
  selectRequest: () => mockSelectRequest(),
}));

const mockNavigate = jest.fn();

const mockLocation: Location = {
  pathname: '/',
  state: undefined,
  key: '',
  search: '',
  hash: '',
};

const mockUseLocation = mocked(useLocation);

const mockUseSearchParams = mocked(useSearchParams);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn().mockImplementation(() => mockNavigate),
  useLocation: jest.fn().mockImplementation(() => mockLocation),
  useSearchParams: jest
    .fn()
    .mockReturnValue([new URLSearchParams(), jest.fn()]),
}));

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: () => ({
    get: (_name: string, fallback: unknown) => fallback,
  }),
  getConfig: () => ({
    get: (_name: string, fallback: unknown) => fallback,
  }),
}));

const setup = (
  props: PageLayoutProps = {},
  renderOptions: CustomRenderOptions = {}
) => {
  return render(<PageLayout {...props} />, {
    withRouter: true,
    ...renderOptions,
  });
};

describe('<PageLayout />', () => {
  it('PageLayout snapshot without progress', () => {
    const { asFragment } = render(<PageLayout />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('PageLayout snapshot with last page', () => {
    mockUseLocation.mockReturnValue({
      ...mockLocation,
      pathname: WEB_REQUEST_ROUTES.requestPersonalInfo,
    });
    const { asFragment } = setup();

    expect(asFragment()).toMatchSnapshot();
  });

  it('should set caller relationship if value was provided in query', () => {
    const mockRelationshipSearchParam = RelationshipToPatient.myself;
    mockUseSearchParams.mockReturnValueOnce([
      new URLSearchParams({
        relationship: mockRelationshipSearchParam,
      }),
      jest.fn(),
    ]);
    const { store } = setup();

    act(() => {
      const callerState: RequestCaller = selectCaller(
        store.getState() as RootState
      );

      expect(callerState.relationshipToPatient).toBe(
        mockRelationshipSearchParam
      );
    });
  });

  it('should not set caller relationship if value is not in of predefined list', () => {
    const mockRelationshipSearchParam = 'test';
    mockUseSearchParams.mockReturnValueOnce([
      new URLSearchParams({
        relationship: mockRelationshipSearchParam,
      }),
      jest.fn(),
    ]);
    const { store } = setup();

    act(() => {
      const callerState: RequestCaller = selectCaller(
        store.getState() as RootState
      );

      expect(callerState.relationshipToPatient).toBe(
        requestInitialState.caller.relationshipToPatient
      );
    });
  });

  it('should render return home button and not show next step on button click', async () => {
    mockUseLocation.mockReturnValue(mockLocation);
    const { user } = setup({
      continueOptions: {
        showBtn: true,
        disabled: false,
        shouldReturnHome: true,
        dataTestId: PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON,
      },
    });

    const continueButton = await screen.findByTestId(
      PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON
    );
    expect(continueButton).toBeEnabled();
    expect(continueButton).toHaveTextContent('Return Home');

    await user.click(continueButton);

    await waitFor(() => {
      expect(mockNavigate).not.toBeCalled();
    });
  });

  it('should call override continue fn on Continue button click', async () => {
    mockUseLocation.mockReturnValue(mockLocation);
    const mockOnClick = jest.fn();
    const { user } = setup({
      continueOptions: {
        showBtn: true,
        disabled: false,
        dataTestId: PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON,
        shouldOverrideContinue: true,
        onClick: mockOnClick,
      },
    });

    const continueButton = await screen.findByTestId(
      PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON
    );
    expect(continueButton).toBeEnabled();
    expect(continueButton).toHaveTextContent('Continue');

    await user.click(continueButton);

    expect(mockOnClick).toBeCalled();
  });

  it('should navigate to next page on care request submit', async () => {
    mockUseLocation.mockReturnValueOnce({
      ...mockLocation,
      pathname: WEB_REQUEST_ROUTES.requestPersonalInfo,
    });

    mockSelectRequest.mockReturnValueOnce({
      address: mockAddress,
      complaint: mockComplaint,
      patient: mockPatient,
      caller: mockCaller,
      patientPreferredEta: mockPatientPreferredEta,
    });

    const { user } = setup({
      continueOptions: {
        showBtn: true,
        disabled: false,
        dataTestId: PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON,
        shouldOverrideContinue: true,
      },
    });

    const continueButton = await screen.findByTestId(
      PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON
    );
    expect(continueButton).toBeEnabled();
    expect(continueButton).toHaveTextContent('Submit Visit Request');

    await user.click(continueButton);

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(WEB_REQUEST_ROUTES.requestDetails);
    });
  });

  it('should show error messages with missed required fields', async () => {
    mockUseLocation.mockReturnValue({
      ...mockLocation,
      pathname: WEB_REQUEST_ROUTES.requestPersonalInfo,
    });
    const { user } = setup({
      continueOptions: {
        disabled: false,
        showBtn: true,
        dataTestId: PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON,
        onClick: jest.fn(),
      },
    });

    const continueButton = await screen.findByTestId(
      PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON
    );
    expect(continueButton).toBeEnabled();
    await user.click(continueButton);

    expect(
      await screen.findByTestId(
        PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_TITLE
      )
    ).toHaveTextContent(
      'Please go back and confirm the missing details about:'
    );

    const listItems = [
      'patient info',
      'caller info',
      'symptoms',
      'location',
      'preferred time',
    ];
    expect(
      screen.getByTestId(PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_LIST)
    ).toBeVisible();
    screen
      .getAllByTestId(PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_LIST_ITEM)
      .forEach((item, index) => {
        expect(item).toHaveTextContent(listItems[index]);
      });

    await waitFor(() => {
      expect(
        continueButton.getElementsByClassName('MuiTouchRipple-ripple').length
      ).toBe(0);
    });
  });

  describe('missed required fields list', () => {
    const props: PageLayoutProps = {
      continueOptions: {
        disabled: false,
        showBtn: true,
        dataTestId: PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON,
        onClick: jest.fn(),
      },
    };

    describe('address fields', () => {
      it('should display "location" as missing details', async () => {
        mockUseLocation.mockReturnValue({
          ...mockLocation,
          pathname: WEB_REQUEST_ROUTES.requestPersonalInfo,
        });
        const { user } = setup(props);

        const continueButton = await screen.findByTestId(
          PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON
        );
        expect(continueButton).toBeEnabled();
        await user.click(continueButton);

        expect(
          await screen.findByTestId(
            PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_TITLE
          )
        ).toHaveTextContent(
          'Please go back and confirm the missing details about:'
        );
        expect(
          screen.getByTestId(PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_LIST)
        ).toBeVisible();
        expect(
          screen.getByTestId(PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_LIST)
        ).toHaveTextContent('location');
      });

      it('should not display "location" as missing details', async () => {
        mockUseLocation.mockReturnValue({
          ...mockLocation,
          pathname: WEB_REQUEST_ROUTES.requestPersonalInfo,
        });
        mockSelectRequest.mockReturnValue({
          ...requestInitialState,
          address: {
            streetAddress1: '430 South Colorado Boulevard',
            streetAddress2: '',
            city: 'Denver',
            state: 'CO',
            postalCode: '80246',
          },
        });
        const { user } = setup(props);

        const continueButton = await screen.findByTestId(
          PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON
        );
        expect(continueButton).toBeEnabled();
        await user.click(continueButton);

        expect(
          await screen.findByTestId(
            PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_TITLE
          )
        ).toHaveTextContent(
          'Please go back and confirm the missing details about:'
        );
        expect(
          screen.getByTestId(PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_LIST)
        ).toBeVisible();
        expect(
          screen.getByTestId(PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_LIST)
        ).not.toHaveTextContent('location');
      });
    });
  });
});
