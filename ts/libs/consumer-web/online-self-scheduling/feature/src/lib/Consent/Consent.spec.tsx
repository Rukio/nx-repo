import {
  manageSelfScheduleInitialState,
  MANAGE_SELF_SCHEDULE_SLICE_KEY,
  RelationToPatient,
  mockPatientPOA,
  mockPatient,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  ConsentQuestionsOrder,
  CONSENT_FORM_TEST_IDS,
  CONSENT_QUESTION_TEST_IDS,
  DefaultConsentQuestionAnswer,
  MedicalDecisionMakerQuestionAnswer,
  FORM_FOOTER_TEST_IDS,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  render,
  screen,
  renderHook,
  testSegmentPageView,
  waitFor,
} from '../../testUtils';
import { Consent, getAlertOptions } from './Consent';
import { ONLINE_SELF_SCHEDULING_ROUTES, SEGMENT_EVENTS } from '../constants';
import { buildAccountPatientApiPath, mswServer } from '../../testUtils/server';
import { rest } from 'msw';

const getConsentQuestionTitle = (order: ConsentQuestionsOrder) =>
  screen.getByTestId(CONSENT_QUESTION_TEST_IDS.getTitle(order));

const findConsentQuestionTitle = (order: ConsentQuestionsOrder) =>
  screen.findByTestId(CONSENT_QUESTION_TEST_IDS.getTitle(order));

const getConsentQuestionAnswer = (
  order: ConsentQuestionsOrder,
  value: string
) => screen.getByTestId(CONSENT_QUESTION_TEST_IDS.getAnswer(order, value));

const findConsentQuestionAnswer = (
  order: ConsentQuestionsOrder,
  value: string
) => screen.findByTestId(CONSENT_QUESTION_TEST_IDS.getAnswer(order, value));

const findConsentFormAlert = () =>
  screen.findByTestId(CONSENT_FORM_TEST_IDS.ALERT);

const getSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const setup = () => {
  return render(<Consent />, {
    withRouter: true,
    preloadedState: {
      [MANAGE_SELF_SCHEDULE_SLICE_KEY]: {
        ...manageSelfScheduleInitialState,
        data: {
          ...manageSelfScheduleInitialState.data,
          patientId: 1,
          requester: {
            relationToPatient: RelationToPatient.Patient,
          },
        },
      },
    },
  });
};

const setupWithNonSelfRelationship = () => {
  mswServer.use(
    rest.get(buildAccountPatientApiPath(), (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ data: null }));
    })
  );

  return render(<Consent />, {
    withRouter: true,
    preloadedState: {
      [MANAGE_SELF_SCHEDULE_SLICE_KEY]: {
        ...manageSelfScheduleInitialState,
        data: {
          ...manageSelfScheduleInitialState.data,
          patientId: 1,
          requester: {
            relationToPatient: RelationToPatient.FamilyFriend,
          },
        },
      },
    },
  });
};

describe('getAlertOptions', () => {
  it.each([
    {
      isRelationshipSelf: true,
      expected: {
        message:
          'Sorry, we can only book an appointment if your medical decision maker will be present.',
      },
    },
    {
      isRelationshipSelf: false,
      expected: {
        title:
          'Sorry, we can only book an appointment if the patient’s medical decision maker will be present.',
        message:
          'Our recommendation is that you go to your nearest urgent care or contact your primary care provider.',
      },
    },
  ])(
    'should return correct alert options if isRelationshipSelf is $isRelationshipSelf',
    ({ isRelationshipSelf, expected }) => {
      const result = getAlertOptions(isRelationshipSelf);
      expect(result).toStrictEqual(expected);
    }
  );
});

describe('<Consent />', () => {
  it('should render correctly', async () => {
    const { user } = setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONSENT);

    const firstConsentQuestionTitle = getConsentQuestionTitle(
      ConsentQuestionsOrder.First
    );

    expect(firstConsentQuestionTitle).toBeVisible();
    expect(firstConsentQuestionTitle).toHaveTextContent(
      'Do you make your own medical decisions?'
    );

    const firstConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.First,
      DefaultConsentQuestionAnswer.No
    );

    expect(firstConsentQuestionAnswer).toBeVisible();

    await user.click(firstConsentQuestionAnswer);

    const secondConsentQuestionTitle = await findConsentQuestionTitle(
      ConsentQuestionsOrder.Second
    );
    expect(secondConsentQuestionTitle).toBeVisible();
    expect(secondConsentQuestionTitle).toHaveTextContent(
      'Will the individual who makes your medical decisions be on-scene during our visit?'
    );

    const secondConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.Second,
      DefaultConsentQuestionAnswer.Yes
    );
    expect(secondConsentQuestionAnswer).toBeVisible();

    await user.click(secondConsentQuestionAnswer);

    const firstNameField = await screen.findByTestId(
      CONSENT_FORM_TEST_IDS.FIRST_NAME_FIELD
    );
    expect(firstNameField).toBeVisible();

    const lastNameField = screen.getByTestId(
      CONSENT_FORM_TEST_IDS.FIRST_NAME_FIELD
    );
    expect(lastNameField).toBeVisible();

    const phoneField = await screen.findByTestId(
      CONSENT_FORM_TEST_IDS.PHONE_FIELD
    );
    expect(phoneField).toBeVisible();
  });

  it('should predefine values correctly', async () => {
    mswServer.use(
      rest.get(buildAccountPatientApiPath(), (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            data: { ...mockPatient, powerOfAttorney: mockPatientPOA },
          })
        );
      })
    );
    setup();

    const MOCKED_PATIENT_POA_NAME = mockPatientPOA?.name?.split(' ');

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONSENT);

    const firstConsentQuestionTitle = getConsentQuestionTitle(
      ConsentQuestionsOrder.First
    );

    expect(firstConsentQuestionTitle).toBeVisible();
    expect(firstConsentQuestionTitle).toHaveTextContent(
      'Do you make your own medical decisions?'
    );

    const firstConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.First,
      DefaultConsentQuestionAnswer.No
    );

    expect(firstConsentQuestionAnswer).toBeVisible();

    const secondConsentQuestionTitle = await findConsentQuestionTitle(
      ConsentQuestionsOrder.Second
    );
    expect(secondConsentQuestionTitle).toBeVisible();
    expect(secondConsentQuestionTitle).toHaveTextContent(
      'Will the individual who makes your medical decisions be on-scene during our visit?'
    );

    const secondConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.Second,
      DefaultConsentQuestionAnswer.Yes
    );
    expect(secondConsentQuestionAnswer).toBeVisible();

    const firstNameInput = await screen.findByTestId(
      CONSENT_FORM_TEST_IDS.FIRST_NAME_INPUT
    );
    expect(firstNameInput).toBeVisible();
    expect(firstNameInput).toHaveDisplayValue(MOCKED_PATIENT_POA_NAME[0]);

    const lastNameInput = screen.getByTestId(
      CONSENT_FORM_TEST_IDS.LAST_NAME_INPUT
    );
    expect(lastNameInput).toBeVisible();
    expect(lastNameInput).toHaveDisplayValue(MOCKED_PATIENT_POA_NAME[1]);

    const phoneInput = await screen.findByTestId(
      CONSENT_FORM_TEST_IDS.PHONE_INPUT
    );
    expect(phoneInput).toBeVisible();
  });

  it('should render correctly with negative path', async () => {
    const { user } = setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONSENT);

    const firstConsentQuestionTitle = getConsentQuestionTitle(
      ConsentQuestionsOrder.First
    );
    expect(firstConsentQuestionTitle).toBeVisible();
    expect(firstConsentQuestionTitle).toHaveTextContent(
      'Do you make your own medical decisions?'
    );

    const firstConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.First,
      DefaultConsentQuestionAnswer.No
    );
    expect(firstConsentQuestionAnswer).toBeVisible();

    await user.click(firstConsentQuestionAnswer);

    const secondConsentQuestionTitle = await findConsentQuestionTitle(
      ConsentQuestionsOrder.Second
    );
    expect(secondConsentQuestionTitle).toBeVisible();
    expect(secondConsentQuestionTitle).toHaveTextContent(
      'Will the individual who makes your medical decisions be on-scene during our visit?'
    );

    const secondConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.Second,
      DefaultConsentQuestionAnswer.No
    );
    expect(secondConsentQuestionAnswer).toBeVisible();

    await user.click(secondConsentQuestionAnswer);

    const alert = await findConsentFormAlert();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      'Sorry, we can only book an appointment if your medical decision maker will be present.'
    );
  });

  it('should render correctly for non-self relationship', async () => {
    const { user } = setupWithNonSelfRelationship();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONSENT);

    const firstConsentQuestionTitle = getConsentQuestionTitle(
      ConsentQuestionsOrder.First
    );

    expect(firstConsentQuestionTitle).toBeVisible();
    expect(firstConsentQuestionTitle).toHaveTextContent(
      'Does the patient make their own medical decisions?'
    );

    const firstConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.First,
      DefaultConsentQuestionAnswer.No
    );
    expect(firstConsentQuestionAnswer).toBeVisible();

    await user.click(firstConsentQuestionAnswer);

    const secondConsentQuestionTitle = await findConsentQuestionTitle(
      ConsentQuestionsOrder.Second
    );
    expect(secondConsentQuestionTitle).toBeVisible();
    expect(secondConsentQuestionTitle).toHaveTextContent(
      'Will the individual who makes their medical decisions be on-scene during our visit?'
    );

    const secondConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.Second,
      DefaultConsentQuestionAnswer.Yes
    );
    expect(secondConsentQuestionAnswer).toBeVisible();

    await user.click(secondConsentQuestionAnswer);

    const thirdConsentQuestionTitle = await findConsentQuestionTitle(
      ConsentQuestionsOrder.Third
    );
    expect(thirdConsentQuestionTitle).toBeVisible();
    expect(thirdConsentQuestionTitle).toHaveTextContent(
      'Who makes their medical decisions?'
    );

    const thirdConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.Third,
      MedicalDecisionMakerQuestionAnswer.SomeoneElse
    );
    expect(thirdConsentQuestionAnswer).toBeVisible();

    await user.click(thirdConsentQuestionAnswer);

    const firstNameField = await screen.findByTestId(
      CONSENT_FORM_TEST_IDS.FIRST_NAME_FIELD
    );
    expect(firstNameField).toBeVisible();

    const lastNameField = screen.getByTestId(
      CONSENT_FORM_TEST_IDS.FIRST_NAME_FIELD
    );
    expect(lastNameField).toBeVisible();

    const phoneField = await screen.findByTestId(
      CONSENT_FORM_TEST_IDS.PHONE_FIELD
    );
    expect(phoneField).toBeVisible();
  });

  it('should render correctly for non-self relationship with negative path', async () => {
    const { user } = setupWithNonSelfRelationship();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONSENT);

    const firstConsentQuestionTitle = getConsentQuestionTitle(
      ConsentQuestionsOrder.First
    );
    expect(firstConsentQuestionTitle).toBeVisible();
    expect(firstConsentQuestionTitle).toHaveTextContent(
      'Does the patient make their own medical decisions?'
    );

    const firstConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.First,
      DefaultConsentQuestionAnswer.No
    );
    expect(firstConsentQuestionAnswer).toBeVisible();

    await user.click(firstConsentQuestionAnswer);

    const secondConsentQuestionTitle = await findConsentQuestionTitle(
      ConsentQuestionsOrder.Second
    );
    expect(secondConsentQuestionTitle).toBeVisible();
    expect(secondConsentQuestionTitle).toHaveTextContent(
      'Will the individual who makes their medical decisions be on-scene during our visit?'
    );

    const secondConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.Second,
      DefaultConsentQuestionAnswer.No
    );
    expect(secondConsentQuestionAnswer).toBeVisible();

    await user.click(secondConsentQuestionAnswer);

    const alert = await findConsentFormAlert();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      'Sorry, we can only book an appointment if the patient’s medical decision maker will be present.'
    );
    expect(alert).toHaveTextContent(
      'Our recommendation is that you go to your nearest urgent care or contact your primary care provider.'
    );
  });

  it('should submit form if patient makes own medical decisions', async () => {
    const { user } = setupWithNonSelfRelationship();
    const { result: segmentHook } = renderHook(() => useSegment());

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONSENT);

    const submitButton = getSubmitButton();

    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();

    const firstConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.First,
      DefaultConsentQuestionAnswer.Yes
    );

    await user.click(firstConsentQuestionAnswer);

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);
    expect(mockNavigate).toBeCalledWith(ONLINE_SELF_SCHEDULING_ROUTES.ADDRESS);

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.CONSENT_MAKER_SELECTION,
        {
          [SEGMENT_EVENTS.CONSENT_MAKER_SELECTION]:
            MedicalDecisionMakerQuestionAnswer.Me,
        }
      );
    });
  });

  it('should submit form with decision maker on-scene', async () => {
    const { user } = setupWithNonSelfRelationship();
    const { result: segmentHook } = renderHook(() => useSegment());

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_CONSENT);

    const submitButton = getSubmitButton();

    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();

    const firstConsentQuestionAnswer = getConsentQuestionAnswer(
      ConsentQuestionsOrder.First,
      DefaultConsentQuestionAnswer.No
    );

    await user.click(firstConsentQuestionAnswer);

    const secondConsentQuestionAnswer = await findConsentQuestionAnswer(
      ConsentQuestionsOrder.Second,
      DefaultConsentQuestionAnswer.Yes
    );

    await user.click(secondConsentQuestionAnswer);

    const thirdConsentQuestionAnswer = await findConsentQuestionAnswer(
      ConsentQuestionsOrder.Third,
      MedicalDecisionMakerQuestionAnswer.Me
    );

    await user.click(thirdConsentQuestionAnswer);

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.CONSENT_MAKER_SELECTION,
        {
          [SEGMENT_EVENTS.CONSENT_MAKER_SELECTION]:
            MedicalDecisionMakerQuestionAnswer.Me,
        }
      );
    });

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.CONSENT_ON_SCENE_SELECTION,
        {
          [SEGMENT_EVENTS.CONSENT_ON_SCENE_SELECTION]:
            DefaultConsentQuestionAnswer.Yes,
        }
      );
    });
  });
});
