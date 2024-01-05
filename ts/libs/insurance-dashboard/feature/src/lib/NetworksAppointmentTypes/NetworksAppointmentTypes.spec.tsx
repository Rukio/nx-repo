import {
  render,
  screen,
  within,
  waitFor,
  renderForReadOnlyRole,
} from '../../testUtils';
import NetworksAppointmentTypes from './NetworksAppointmentTypes';
import { NETWORKS_APPOINTMENT_TYPES_TEST_IDS } from './testIds';
import {
  NETWORKS_SERVICE_LINE_FORM_TEST_IDS,
  ServiceLineAppointmentOption,
  getModalitiesMock,
  FORM_CONTROLS_TEST_IDS,
} from '@*company-data-covered*/insurance/ui';
import {
  mockedInsuranceNetwork,
  mockedInsurancePayer,
  mockedAppointmentTypesPathList,
  environment,
  buildNetworkAppointmentTypesPath,
  mockedDifferentInsuranceNetworkAppointmentTypes,
  mockedServiceLineAcuteCare,
} from '@*company-data-covered*/insurance/data-access';
import {
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
} from '../constants';
import { rest } from 'msw';
import { mswServer } from '../../testUtils/server';
import { TOAST_NOTIFICATIONS_TEST_IDS } from '../ToastNotifications/testIds';
import { ToastNotifications } from '../ToastNotifications';

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
    useParams: vi.fn(() => ({
      networkId: mockedInsuranceNetwork.id,
      payerId: mockedInsurancePayer.id,
    })),
  };
});

const mockedAvailableModalities = getModalitiesMock();
const mockedTelepresentationModality = mockedAvailableModalities[1];
const mockedAvailableAppointmentType = mockedAppointmentTypesPathList[0];
const mockErrorMessage = 'something went wrong';

const findServiceLineForm = (serviceLineId: number | string) =>
  screen.findByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineFormTestId(serviceLineId)
  );

const findModalityAppointmentTypeSelect = (
  ServiceLineAppointmentOption: ServiceLineAppointmentOption,
  serviceLineId: string | number,
  modalityId: string | number
) =>
  screen.findByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityAppointmentTypeSelectTestId(
      ServiceLineAppointmentOption,
      serviceLineId,
      modalityId
    )
  );

const findModalityAppointmentTypeSelectOption = ({
  ServiceLineAppointmentOption,
  serviceLineId,
  modalityId,
  appointmentTypeId,
}: {
  ServiceLineAppointmentOption: ServiceLineAppointmentOption;
  serviceLineId: string | number;
  modalityId: string | number;
  appointmentTypeId: string | number;
}) =>
  screen.findByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityAppointmentTypeSelectOptionTestId(
      ServiceLineAppointmentOption,
      serviceLineId,
      modalityId,
      appointmentTypeId
    )
  );

const getSubmitButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);

const querySubmitButton = () =>
  screen.queryByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);

const getCancelButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);

const queryCancelButton = () =>
  screen.queryByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);

const findNotificationAlert = () =>
  screen.findByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

const setup = (readOnly = false) => {
  const renderFN = readOnly ? renderForReadOnlyRole : render;

  return renderFN(
    <>
      <NetworksAppointmentTypes />
      <ToastNotifications />
    </>,
    {
      withRouter: true,
    }
  );
};

describe('<NetworksAppointmentTypes />', () => {
  beforeEach(() => {
    mswServer.resetHandlers();
  });

  it('should render properly', async () => {
    setup();

    expect(
      screen.getByTestId(NETWORKS_APPOINTMENT_TYPES_TEST_IDS.ROOT)
    ).toBeVisible();

    const serviceLineComponent = await findServiceLineForm(
      mockedServiceLineAcuteCare.serviceLineId
    );
    expect(serviceLineComponent).toBeVisible();
  });

  it('should change all patients appointment types for serviceLine', async () => {
    const { user } = setup();

    expect(
      screen.getByTestId(NETWORKS_APPOINTMENT_TYPES_TEST_IDS.ROOT)
    ).toBeVisible();

    const serviceLineComponent = await findServiceLineForm(
      mockedServiceLineAcuteCare.serviceLineId
    );
    expect(serviceLineComponent).toBeVisible();

    const modalityAppointmentTypeSelect =
      await findModalityAppointmentTypeSelect(
        ServiceLineAppointmentOption.AllPatients,
        mockedServiceLineAcuteCare.serviceLineId,
        mockedTelepresentationModality.id
      );

    const modalityAppointmentTypeSelectButton = within(
      modalityAppointmentTypeSelect
    ).getByRole('button');

    await user.click(modalityAppointmentTypeSelectButton);

    const appointmentTypeOption = await findModalityAppointmentTypeSelectOption(
      {
        ServiceLineAppointmentOption: ServiceLineAppointmentOption.AllPatients,
        serviceLineId: mockedServiceLineAcuteCare.serviceLineId,
        modalityId: mockedTelepresentationModality.id,
        appointmentTypeId: mockedAvailableAppointmentType.id,
      }
    );
    await user.click(appointmentTypeOption);

    const updatedModalityAppointmentTypeSelect =
      await findModalityAppointmentTypeSelect(
        ServiceLineAppointmentOption.AllPatients,
        mockedServiceLineAcuteCare.serviceLineId,
        mockedTelepresentationModality.id
      );
    const updatedModalityAppointmentTypeSelectButton = within(
      updatedModalityAppointmentTypeSelect
    ).getByRole('button');
    expect(updatedModalityAppointmentTypeSelectButton).toHaveTextContent(
      mockedAvailableAppointmentType.name
    );
  });

  it('should submit appointment type for serviceLine and display success alert', async () => {
    const { user } = setup();

    expect(
      screen.getByTestId(NETWORKS_APPOINTMENT_TYPES_TEST_IDS.ROOT)
    ).toBeVisible();

    const serviceLineComponent = await findServiceLineForm(
      mockedServiceLineAcuteCare.serviceLineId
    );
    expect(serviceLineComponent).toBeVisible();

    const modalityAppointmentTypeSelect =
      await findModalityAppointmentTypeSelect(
        ServiceLineAppointmentOption.AllPatients,
        mockedServiceLineAcuteCare.serviceLineId,
        mockedTelepresentationModality.id
      );

    const modalityAppointmentTypeSelectButton = within(
      modalityAppointmentTypeSelect
    ).getByRole('button');

    await user.click(modalityAppointmentTypeSelectButton);

    const appointmentTypeOption = await findModalityAppointmentTypeSelectOption(
      {
        ServiceLineAppointmentOption: ServiceLineAppointmentOption.AllPatients,
        serviceLineId: mockedServiceLineAcuteCare.serviceLineId,
        modalityId: mockedTelepresentationModality.id,
        appointmentTypeId: mockedAvailableAppointmentType.id,
      }
    );
    await user.click(appointmentTypeOption);

    const updatedModalityAppointmentTypeSelect =
      await findModalityAppointmentTypeSelect(
        ServiceLineAppointmentOption.AllPatients,
        mockedServiceLineAcuteCare.serviceLineId,
        mockedTelepresentationModality.id
      );
    const updatedModalityAppointmentTypeSelectButton = within(
      updatedModalityAppointmentTypeSelect
    ).getByRole('button');
    expect(updatedModalityAppointmentTypeSelectButton).toHaveTextContent(
      mockedAvailableAppointmentType.name
    );

    const submitButton = getSubmitButton();
    await user.click(submitButton);

    const submitedModalityAppointmentTypeSelect =
      await findModalityAppointmentTypeSelect(
        ServiceLineAppointmentOption.AllPatients,
        mockedServiceLineAcuteCare.serviceLineId,
        mockedTelepresentationModality.id
      );
    const submitedModalityAppointmentTypeSelectButton = within(
      submitedModalityAppointmentTypeSelect
    ).getByRole('button');
    expect(submitedModalityAppointmentTypeSelectButton).toHaveTextContent(
      mockedAvailableAppointmentType.name
    );

    const alert = await findNotificationAlert();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      DEFAULT_NOTIFICATION_MESSAGES.NETWORK_APPOINTMENT_TYPES_SUCCESS
    );
  });

  it.each([
    {
      errorResponse: { message: mockErrorMessage },
      expectedAlertMessage: mockErrorMessage,
    },
    {
      errorResponse: {},
      expectedAlertMessage:
        DEFAULT_NOTIFICATION_MESSAGES.NETWORK_APPOINTMENT_TYPES_ERROR,
    },
  ])(
    'should fail to update appointment type for serviceLine and display error message',
    async ({ errorResponse, expectedAlertMessage }) => {
      mswServer.use(
        rest.patch(
          `${environment.serviceURL}${buildNetworkAppointmentTypesPath(
            ':networkId'
          )}`,
          (_req, res, ctx) => {
            return res.once(ctx.status(400), ctx.json(errorResponse));
          }
        )
      );

      const { user } = setup();

      const serviceLineComponent = await findServiceLineForm(
        mockedServiceLineAcuteCare.serviceLineId
      );
      expect(serviceLineComponent).toBeVisible();

      const modalityAppointmentTypeSelect =
        await findModalityAppointmentTypeSelect(
          ServiceLineAppointmentOption.AllPatients,
          mockedServiceLineAcuteCare.serviceLineId,
          mockedTelepresentationModality.id
        );

      const modalityAppointmentTypeSelectButton = within(
        modalityAppointmentTypeSelect
      ).getByRole('button');

      await user.click(modalityAppointmentTypeSelectButton);

      const appointmentTypeOption =
        await findModalityAppointmentTypeSelectOption({
          ServiceLineAppointmentOption:
            ServiceLineAppointmentOption.AllPatients,
          serviceLineId: mockedServiceLineAcuteCare.serviceLineId,
          modalityId: mockedTelepresentationModality.id,
          appointmentTypeId: mockedAvailableAppointmentType.id,
        });

      await user.click(appointmentTypeOption);

      await waitFor(() => {
        expect(modalityAppointmentTypeSelect).toHaveTextContent(
          mockedAvailableAppointmentType.name
        );
      });

      const submitButton = getSubmitButton();
      await user.click(submitButton);

      const alert = await findNotificationAlert();
      expect(alert).toBeVisible();
      expect(alert).toHaveTextContent(expectedAlertMessage);
    }
  );

  it.each([
    { patientType: ServiceLineAppointmentOption.NewPatients },
    { patientType: ServiceLineAppointmentOption.ExistingPatients },
  ])(
    'should change $patientType patient appointment type for serviceLine',
    async ({ patientType }) => {
      mswServer.use(
        rest.get(
          `${environment.serviceURL}${buildNetworkAppointmentTypesPath(
            ':networkId'
          )}`,
          (_req, res, ctx) => {
            return res.once(
              ctx.status(200),
              ctx.json({
                appointmentTypes:
                  mockedDifferentInsuranceNetworkAppointmentTypes,
              })
            );
          }
        )
      );

      const { user } = setup();

      expect(
        screen.getByTestId(NETWORKS_APPOINTMENT_TYPES_TEST_IDS.ROOT)
      ).toBeVisible();

      const serviceLineComponent = await findServiceLineForm(
        mockedServiceLineAcuteCare.serviceLineId
      );
      expect(serviceLineComponent).toBeVisible();

      const modalityAppointmentTypeSelect =
        await findModalityAppointmentTypeSelect(
          patientType,
          mockedServiceLineAcuteCare.serviceLineId,
          mockedTelepresentationModality.id
        );

      const modalityAppointmentTypeSelectButton = within(
        modalityAppointmentTypeSelect
      ).getByRole('button');

      await user.click(modalityAppointmentTypeSelectButton);

      const appointmentTypeOption =
        await findModalityAppointmentTypeSelectOption({
          ServiceLineAppointmentOption: patientType,
          serviceLineId: mockedServiceLineAcuteCare.serviceLineId,
          modalityId: mockedTelepresentationModality.id,
          appointmentTypeId: mockedAvailableAppointmentType.id,
        });
      await user.click(appointmentTypeOption);

      const updatedModalityAppointmentTypeSelect =
        await findModalityAppointmentTypeSelect(
          patientType,
          mockedServiceLineAcuteCare.serviceLineId,
          mockedTelepresentationModality.id
        );
      const updatedModalityAppointmentTypeSelectButton = within(
        updatedModalityAppointmentTypeSelect
      ).getByRole('button');
      expect(updatedModalityAppointmentTypeSelectButton).toHaveTextContent(
        mockedAvailableAppointmentType.name
      );
    }
  );

  it('should navigate to payer networks tab on cancel button click', async () => {
    const { user } = setup();
    expect(
      screen.getByTestId(NETWORKS_APPOINTMENT_TYPES_TEST_IDS.ROOT)
    ).toBeVisible();

    const cancelButton = getCancelButton();

    await user.click(cancelButton);

    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(
        INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(
          mockedInsurancePayer.id
        )
      );
    });
  });

  it('should render properly for read only role', async () => {
    setup(true);

    expect(
      screen.getByTestId(NETWORKS_APPOINTMENT_TYPES_TEST_IDS.ROOT)
    ).toBeVisible();

    const serviceLineComponent = await findServiceLineForm(
      mockedServiceLineAcuteCare.serviceLineId
    );
    expect(serviceLineComponent).toBeVisible();

    const modalityAppointmentTypeSelect =
      await findModalityAppointmentTypeSelect(
        ServiceLineAppointmentOption.AllPatients,
        mockedServiceLineAcuteCare.serviceLineId,
        mockedTelepresentationModality.id
      );

    const modalityAppointmentTypeSelectButton = within(
      modalityAppointmentTypeSelect
    ).getByRole('button');

    expect(modalityAppointmentTypeSelectButton).toBeInTheDocument();
    expect(modalityAppointmentTypeSelectButton).toHaveAttribute(
      'aria-disabled',
      'true'
    );

    expect(querySubmitButton()).not.toBeInTheDocument();
    expect(queryCancelButton()).not.toBeInTheDocument();
  });
});
