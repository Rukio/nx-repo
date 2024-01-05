import { rest } from 'msw';
import statsig, { DynamicConfig, EvaluationReason } from 'statsig-js';
import { mocked } from 'jest-mock';
import {
  CheckMarketFeasibilityPayload,
  MarketFeasibilityStatus,
  mockDomainPatientAccountAddress,
  mockInsurance,
  mockPatient,
  mockPatientAccount,
  mockPatientAccountUnverifiedPatient,
  mockSelfScheduleData,
  RelationToPatient,
  mockCreateCareRequestResponse,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  CONFIRM_DETAILS_FORM_TEST_IDS,
  DetailsSection,
  FORM_FOOTER_TEST_IDS,
  FORM_HEADER_TEST_IDS,
  LOADING_SECTION_TEST_IDS,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  render,
  screen,
  waitFor,
  testSegmentPageView,
  renderHook,
} from '../../testUtils';
import {
  buildAccountPatientApiPath,
  buildCacheApiPath,
  buildCheckMarketFeasibilityApiPath,
  buildPatientAccountGetInsurancesApiPath,
  mswServer,
} from '../../testUtils/server';
import { ONLINE_SELF_SCHEDULING_ROUTES, SEGMENT_EVENTS } from '../constants';
import { ConfirmDetails } from './ConfirmDetails';
import { DetailsItemLabel } from './utils';
import {
  ONBOARDING_ACUITY_SEGMENTATION_MARKETS_CONFIG_NAME,
  RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME,
  StructuredSymptom,
  StructuredSymptomCallTo,
} from '../utils/statsig';

const mockSecondaryInsurance: typeof mockInsurance = {
  ...mockInsurance,
  priority: '2',
};

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  getConfig: jest.fn(),
}));

const mockStructuredSymptoms: StructuredSymptom[] = [
  {
    friendly_name: mockSelfScheduleData.symptoms,
    is_oss_eligible: true,
    legacy_rs_protocol: 'test',
    route_call_to: StructuredSymptomCallTo.NoCall,
    legacy_rs_protocol_id: 1,
  },
];

const mockGetConfig = mocked(statsig.getConfig);

mockGetConfig.mockImplementation((value) => {
  switch (value) {
    case RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME:
      return new DynamicConfig(
        RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME,
        {
          structured_symptoms: mockStructuredSymptoms,
        },
        'ruleId',
        { time: 0, reason: EvaluationReason.Bootstrap }
      );
    default:
      return new DynamicConfig(
        ONBOARDING_ACUITY_SEGMENTATION_MARKETS_CONFIG_NAME,
        {
          acuity_segmentation_launched_markets: {
            markets: [],
            classifications: [],
          },
        },
        'ruleId',
        { time: 0, reason: EvaluationReason.Bootstrap }
      );
  }
});

const findTitle = () => screen.findByTestId(FORM_HEADER_TEST_IDS.TITLE);

const getDetailsSection = (detailsSection: DetailsSection) =>
  screen.getByTestId(
    CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(detailsSection)
  );

const getSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);

const mockExistingInsurancesResponse = () => {
  mswServer.use(
    rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
      return res.once(
        ctx.status(200),
        ctx.json({
          data: [mockInsurance, mockSecondaryInsurance],
        })
      );
    })
  );
};

const setup = () => {
  return render(<ConfirmDetails />, {
    withRouter: true,
  });
};

const setupWithNonSelfRelationship = () => {
  mswServer.use(
    rest.get(buildCacheApiPath(), (_req, res, ctx) => {
      return res.once(
        ctx.status(200),
        ctx.json({
          data: {
            ...mockSelfScheduleData,
            requester: {
              ...mockSelfScheduleData.requester,
              relationToPatient: RelationToPatient.FamilyFriend,
            },
          },
        })
      );
    })
  );

  return render(<ConfirmDetails />, { withRouter: true });
};

const setupWithExistingInsurances = () => {
  mockExistingInsurancesResponse();

  return render(<ConfirmDetails />, { withRouter: true });
};

const setupWithDismissedPatient = () => {
  mswServer.use(
    rest.get(buildAccountPatientApiPath(), (_req, res, ctx) => {
      return res.once(
        ctx.status(200),
        ctx.json({
          data: { ...mockPatient, patientSafetyFlag: { id: 1 } },
        })
      );
    })
  );

  return render(<ConfirmDetails />, { withRouter: true });
};

const setupWithBookedSelectedTimeAndExistingInsurances = () => {
  mswServer.use(
    rest.post(buildCheckMarketFeasibilityApiPath(), async (_req, res, ctx) => {
      const body: CheckMarketFeasibilityPayload = await _req.json();
      if (body.startTimeSec) {
        return res(
          ctx.status(200),
          ctx.json({
            data: { availability: MarketFeasibilityStatus.Unavailable },
          })
        );
      }

      return res(
        ctx.status(200),
        ctx.json({
          data: { availability: MarketFeasibilityStatus.Available },
        })
      );
    })
  );

  mockExistingInsurancesResponse();

  return render(<ConfirmDetails />, { withRouter: true });
};

const mockPatientDateOfBirth = new Date(
  mockPatientAccountUnverifiedPatient.dateOfBirth
);

describe('<ConfirmDetails />', () => {
  it('should render correctly', async () => {
    setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONFIRM_DETAILS);

    const title = await findTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Confirm appointment details');

    const subtitle = screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(
      'One last step! Please review your details below before booking your appointment.'
    );

    const aboutYouDetailsSection = getDetailsSection(DetailsSection.AboutYou);
    expect(aboutYouDetailsSection).toBeVisible();
    expect(aboutYouDetailsSection).toHaveTextContent('About You');

    expect(aboutYouDetailsSection).toHaveTextContent(DetailsItemLabel.Name);

    expect(aboutYouDetailsSection).toHaveTextContent(
      `${mockPatientAccountUnverifiedPatient.givenName} ${mockPatientAccountUnverifiedPatient.familyName}`
    );

    expect(aboutYouDetailsSection).toHaveTextContent(
      DetailsItemLabel.DateOfBirth
    );

    expect(aboutYouDetailsSection).toHaveTextContent(
      `0${
        mockPatientDateOfBirth.getMonth() + 1
      }/${mockPatientDateOfBirth.getDate()}/${mockPatientDateOfBirth.getFullYear()}`
    );

    expect(aboutYouDetailsSection).toHaveTextContent(DetailsItemLabel.LegalSex);

    expect(aboutYouDetailsSection).toHaveTextContent(
      mockPatientAccountUnverifiedPatient.legalSex.toUpperCase()
    );

    expect(aboutYouDetailsSection).toHaveTextContent(DetailsItemLabel.Email);

    expect(aboutYouDetailsSection).toHaveTextContent(mockPatientAccount.email);

    expect(aboutYouDetailsSection).toHaveTextContent(
      DetailsItemLabel.PhoneNumber
    );

    expect(aboutYouDetailsSection).toHaveTextContent(
      mockPatientAccountUnverifiedPatient.phoneNumber
    );

    const appointmentDetailsSection = getDetailsSection(
      DetailsSection.Appointment
    );
    expect(appointmentDetailsSection).toBeVisible();
    expect(appointmentDetailsSection).toHaveTextContent('Appointment Details');

    expect(appointmentDetailsSection).toHaveTextContent(
      DetailsItemLabel.Symptoms
    );

    expect(appointmentDetailsSection).toHaveTextContent(
      mockSelfScheduleData.symptoms
    );

    expect(appointmentDetailsSection).toHaveTextContent(
      DetailsItemLabel.Availability
    );

    expect(appointmentDetailsSection).toHaveTextContent('July 5 10am - 3pm');

    expect(appointmentDetailsSection).toHaveTextContent(
      DetailsItemLabel.Address
    );

    expect(appointmentDetailsSection).toHaveTextContent(
      `${mockDomainPatientAccountAddress.streetAddress1}, ${mockDomainPatientAccountAddress.streetAddress2} ${mockDomainPatientAccountAddress.city}, ${mockDomainPatientAccountAddress.state} ${mockDomainPatientAccountAddress.zip}`
    );

    const checkboxInput = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.CHECKBOX_INPUT
    );
    expect(checkboxInput).toBeVisible();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });

  it('should render correctly for non-self relationship', async () => {
    setupWithNonSelfRelationship();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONFIRM_DETAILS);

    const title = await findTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Confirm appointment details');

    const subtitle = screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(
      'One last step! Please review the details below before booking the appointment.'
    );

    const aboutYouDetailsSection = getDetailsSection(DetailsSection.AboutYou);
    expect(aboutYouDetailsSection).toBeVisible();
    expect(aboutYouDetailsSection).toHaveTextContent('About You');

    expect(aboutYouDetailsSection).toHaveTextContent(DetailsItemLabel.Name);

    expect(aboutYouDetailsSection).toHaveTextContent(
      `${mockPatientAccount.firstName} ${mockPatientAccount.lastName}`
    );

    expect(aboutYouDetailsSection).toHaveTextContent(DetailsItemLabel.Email);

    expect(aboutYouDetailsSection).toHaveTextContent(mockPatientAccount.email);

    expect(aboutYouDetailsSection).toHaveTextContent(
      DetailsItemLabel.PhoneNumber
    );

    expect(aboutYouDetailsSection).toHaveTextContent(mockPatientAccount.phone);

    const checkboxInput = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.CHECKBOX_INPUT
    );
    expect(checkboxInput).toBeVisible();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });

  it('should render correctly with existing insurances', async () => {
    setupWithExistingInsurances();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONFIRM_DETAILS);

    const title = await findTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Confirm appointment details');

    const subtitle = screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(
      'One last step! Please review your details below before booking your appointment.'
    );

    const primaryInsuranceSection = getDetailsSection(
      DetailsSection.PrimaryInsurance
    );
    expect(primaryInsuranceSection).toBeVisible();
    expect(primaryInsuranceSection).toHaveTextContent('Primary Insurance');

    expect(primaryInsuranceSection).toHaveTextContent(
      DetailsItemLabel.Provider
    );

    expect(primaryInsuranceSection).toHaveTextContent(
      `${mockInsurance.insuranceNetwork.insurancePayerName}`
    );

    expect(primaryInsuranceSection).toHaveTextContent(
      DetailsItemLabel.MemberID
    );

    expect(primaryInsuranceSection).toHaveTextContent(
      `${mockInsurance.memberId}`
    );

    const secondaryInsuranceSection = getDetailsSection(
      DetailsSection.SecondaryInsurance
    );
    expect(secondaryInsuranceSection).toBeVisible();
    expect(secondaryInsuranceSection).toHaveTextContent('Secondary Insurance');

    expect(secondaryInsuranceSection).toHaveTextContent(
      DetailsItemLabel.Provider
    );

    expect(secondaryInsuranceSection).toHaveTextContent(
      `${mockSecondaryInsurance.insuranceNetwork.insurancePayerName}`
    );

    expect(secondaryInsuranceSection).toHaveTextContent(
      DetailsItemLabel.MemberID
    );

    expect(secondaryInsuranceSection).toHaveTextContent(
      `${mockSecondaryInsurance.memberId}`
    );

    const checkboxInput = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.CHECKBOX_INPUT
    );
    expect(checkboxInput).toBeVisible();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });

  it.each([
    {
      name: 'without insurance',
      setupFn: setup,
      expectedRoute: ONLINE_SELF_SCHEDULING_ROUTES.CALL_SCREENER,
      expectedLoadingSubtitle:
        'Based on your details, we’re finding the best team to come to you.',
    },
    {
      name: 'with existing insurances',
      setupFn: setupWithExistingInsurances,
      expectedRoute: ONLINE_SELF_SCHEDULING_ROUTES.CONFIRMATION,
      expectedLoadingSubtitle:
        'Based on your details, we’re finding the best team to come to you.',
    },
    {
      name: 'with dismissed patient',
      setupFn: setupWithDismissedPatient,
      expectedRoute: ONLINE_SELF_SCHEDULING_ROUTES.OFFBOARD,
      expectedLoadingSubtitle:
        'Based on your details, we’re finding the best team to come to you.',
    },
    {
      name: 'width booked selected time',
      setupFn: setupWithBookedSelectedTimeAndExistingInsurances,
      expectedRoute: ONLINE_SELF_SCHEDULING_ROUTES.BOOKED_TIME,
      expectedLoadingSubtitle:
        'Based on your details, we’re finding the best team to come to you.',
    },
    {
      name: 'width booked selected time',
      setupFn: setupWithNonSelfRelationship,
      expectedRoute: ONLINE_SELF_SCHEDULING_ROUTES.CALL_SCREENER,
      expectedLoadingSubtitle:
        'Based on the patient’s details, we’re finding the best medical team to come to them.',
    },
  ])(
    'should behave correctly on submit $name',
    async ({ setupFn, expectedRoute, expectedLoadingSubtitle }) => {
      const { user } = setupFn();
      const { result: segmentHook } = renderHook(() => useSegment());

      await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONFIRM_DETAILS);

      const title = await findTitle();
      expect(title).toBeVisible();
      expect(title).toHaveTextContent('Confirm appointment details');

      const submitButton = getSubmitButton();
      expect(submitButton).toBeVisible();
      expect(submitButton).toBeDisabled();

      const checkboxInput = screen.getByTestId(
        CONFIRM_DETAILS_FORM_TEST_IDS.CHECKBOX_INPUT
      );
      expect(checkboxInput).toBeVisible();

      await user.click(checkboxInput);

      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      // not awaiting user interaction as loading section render should be checked
      user.click(submitButton);

      const loadingSectionSubtitle = await screen.findByTestId(
        LOADING_SECTION_TEST_IDS.SUBTITLE
      );
      expect(loadingSectionSubtitle).toHaveTextContent(expectedLoadingSubtitle);

      await waitFor(() => {
        expect(mockNavigate).toBeCalledWith(expectedRoute, { replace: true });
      });

      await waitFor(() => {
        expect(segmentHook.current.track).toBeCalledWith(
          SEGMENT_EVENTS.CONFIRM_CARE_REQUEST_CREATED,
          {
            [SEGMENT_EVENTS.CONFIRM_CARE_REQUEST_CREATED]:
              mockCreateCareRequestResponse.careRequest.id,
          }
        );
      });

      await waitFor(() => {
        expect(segmentHook.current.track).toBeCalledTimes(1);
      });
    }
  );
});
