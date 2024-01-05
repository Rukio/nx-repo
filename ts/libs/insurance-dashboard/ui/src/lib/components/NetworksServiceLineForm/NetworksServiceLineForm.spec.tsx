import { render, screen, within } from '../../../testUtils';
import {
  getModalitiesMock,
  getAppointmentTypesMock,
  getNetworkAppointmentTypesMock,
} from '../../../testUtils/mocks';
import { ServiceLineAppointmentOption } from './ModalitiesGroup/ModalitiesGroup';
import NetworksServiceLineForm, {
  NetworksServiceLineFormProps,
} from './NetworksServiceLineForm';
import { NETWORKS_SERVICE_LINE_FORM_TEST_IDS } from './testIds';

const mockedNetworksServiceLineFormProps: NetworksServiceLineFormProps = {
  modalities: getModalitiesMock(),
  serviceLine: {
    serviceLineId: '1',
    serviceLineName: 'Acute Care',
    disabled: false,
    newPatientAppointmentType: '1',
    existingPatientAppointmentType: '1',
  },
  appointmentTypes: getAppointmentTypesMock(),
  networkAppointmentTypes: getNetworkAppointmentTypesMock(2, true),
  onSelectAppointmentType: vi.fn(),
  isDisabled: false,
};

const mockedServiceLine = mockedNetworksServiceLineFormProps.serviceLine;

const findServiceLineForm = (serviceLineId: number | string) =>
  screen.findByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineFormTestId(serviceLineId)
  );

const getServiceLineFormHeader = (serviceLineId: number | string) =>
  screen.getByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineFormHeaderTestId(
      serviceLineId
    )
  );

const getServiceLineCheckboxActiveLabel = (serviceLineId: number | string) =>
  screen.getByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineActiveAppointmentTypesRadioLabelTestId(
      serviceLineId
    )
  );

const getServiceLineCheckboxActiveInput = (serviceLineId: number | string) =>
  getServiceLineCheckboxActiveLabel(serviceLineId).getElementsByTagName(
    'input'
  )[0];

const getServiceLineCheckboxInactiveLabel = (serviceLineId: number | string) =>
  screen.getByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineInactiveAppointmentTypesRadioLabelTestId(
      serviceLineId
    )
  );

const getServiceLineCheckboxInactiveInput = (serviceLineId: number | string) =>
  getServiceLineCheckboxInactiveLabel(serviceLineId).getElementsByTagName(
    'input'
  )[0];

const getDisabledServiceLineAlert = (serviceLineId: number | string) =>
  screen.getByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineAlertTestId(serviceLineId)
  );

const getModalitiesGroupRoot = (
  ServiceLineAppointmentOption: ServiceLineAppointmentOption,
  serviceLineId: string | number
) =>
  screen.getByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalitiesGroupRoot(
      ServiceLineAppointmentOption,
      serviceLineId
    )
  );

const getModalityAppointmentTypeSelect = (
  ServiceLineAppointmentOption: ServiceLineAppointmentOption,
  serviceLineId: string | number,
  modalityId: string | number
) =>
  screen.getByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityAppointmentTypeSelectTestId(
      ServiceLineAppointmentOption,
      serviceLineId,
      modalityId
    )
  );

const findModalityAppointmentTypeSelectOption = (
  ServiceLineAppointmentOption: ServiceLineAppointmentOption,
  serviceLineId: string | number,
  modalityId: string | number,
  appointmentTypeId: string | number
) =>
  screen.findByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityAppointmentTypeSelectOptionTestId(
      ServiceLineAppointmentOption,
      serviceLineId,
      modalityId,
      appointmentTypeId
    )
  );

const setup = (overrideProps: Partial<NetworksServiceLineFormProps> = {}) => {
  return render(
    <NetworksServiceLineForm
      {...mockedNetworksServiceLineFormProps}
      {...overrideProps}
    />
  );
};

describe('<NetworksServiceLineForm />', () => {
  it('should render service line form correctly', async () => {
    setup();
    const mockedServiceLine = mockedNetworksServiceLineFormProps.serviceLine;

    const serviceLineComponent = await findServiceLineForm(
      mockedServiceLine.serviceLineId
    );
    expect(serviceLineComponent).toBeVisible();

    const serviceLineFormHeader = getServiceLineFormHeader(
      mockedServiceLine.serviceLineId
    );
    expect(serviceLineFormHeader).toBeVisible();
    expect(serviceLineFormHeader).toHaveTextContent(
      mockedServiceLine.serviceLineName
    );

    const serviceLineCheckboxActive = getServiceLineCheckboxActiveLabel(
      mockedServiceLine.serviceLineId
    );
    expect(serviceLineCheckboxActive).toBeVisible();

    const serviceLineCheckboxInactive = getServiceLineCheckboxInactiveLabel(
      mockedServiceLine.serviceLineId
    );
    expect(serviceLineCheckboxInactive).toBeVisible();
  });

  it('should render alert if service line disabled', () => {
    const mockedDisabledServiceLine = {
      serviceLineId: '2',
      serviceLineName: 'Advanced Care',
      disabled: true,
      existingPatientAppointmentType: '1',
      newPatientAppointmentType: '2',
    };

    setup({
      serviceLine: mockedDisabledServiceLine,
    });

    const serviceLineFormHeader = getServiceLineFormHeader(
      mockedDisabledServiceLine.serviceLineId
    );
    expect(serviceLineFormHeader).toBeVisible();
    expect(serviceLineFormHeader).toHaveTextContent(
      mockedDisabledServiceLine.serviceLineName
    );

    const disabledServiceLineAlert = getDisabledServiceLineAlert(
      mockedDisabledServiceLine.serviceLineId
    );
    expect(disabledServiceLineAlert).toBeVisible();
    expect(disabledServiceLineAlert).toHaveTextContent(
      `There are currently no billing cities configured for ${mockedDisabledServiceLine.serviceLineName}`
    );
  });

  it('should render modalities for serviceLine correctly: appointment types different for new and existing patients', () => {
    setup({
      networkAppointmentTypes: getNetworkAppointmentTypesMock(2),
    });

    const existingPatientsModalitiesGroupRoot = getModalitiesGroupRoot(
      ServiceLineAppointmentOption.ExistingPatients,
      mockedServiceLine.serviceLineId
    );
    expect(existingPatientsModalitiesGroupRoot).toBeVisible();

    const newPatientsModalitiesGroupRoot = getModalitiesGroupRoot(
      ServiceLineAppointmentOption.NewPatients,
      mockedServiceLine.serviceLineId
    );
    expect(newPatientsModalitiesGroupRoot).toBeVisible();
  });

  it('should render modalities for serviceLine correctly: appointment types same for new and existing patients', () => {
    setup();

    const allPatientsModalitiesGroupRoot = getModalitiesGroupRoot(
      ServiceLineAppointmentOption.AllPatients,
      mockedServiceLine.serviceLineId
    );
    expect(allPatientsModalitiesGroupRoot).toBeVisible();
  });

  it('should call onSelectAppointmentType fn on appointment types menu item click', async () => {
    const { user } = setup();

    const mockedServiceLine = mockedNetworksServiceLineFormProps.serviceLine;

    const mockedModality = mockedNetworksServiceLineFormProps.modalities[0];
    const mockedAppointmentType =
      mockedNetworksServiceLineFormProps.appointmentTypes[0];

    const newPatientsModalityAppointmentTypeSelect =
      getModalityAppointmentTypeSelect(
        ServiceLineAppointmentOption.AllPatients,
        mockedServiceLine.serviceLineId,
        mockedModality.id
      );

    const newPatientsModalityAppointmentTypeSelectButton = within(
      newPatientsModalityAppointmentTypeSelect
    ).getByRole('button');

    await user.click(newPatientsModalityAppointmentTypeSelectButton);

    const appointmentTypeOption = await findModalityAppointmentTypeSelectOption(
      ServiceLineAppointmentOption.AllPatients,
      mockedServiceLine.serviceLineId,
      mockedModality.id,
      mockedAppointmentType.id
    );
    await user.click(appointmentTypeOption);
    expect(
      mockedNetworksServiceLineFormProps.onSelectAppointmentType
    ).toHaveBeenLastCalledWith({
      appointmentTypeName: mockedAppointmentType.name,
      modalityType: mockedModality.type,
      serviceLineAppointmentOption: ServiceLineAppointmentOption.AllPatients,
      serviceLineId: mockedServiceLine.serviceLineId,
    });
  });

  it('should call onSelectAppointmentType fn when service line appointment option is checked', async () => {
    const { user } = setup({
      networkAppointmentTypes: getNetworkAppointmentTypesMock(2),
    });

    const mockedModality = mockedNetworksServiceLineFormProps.modalities[0];
    const mockedAppointmentType =
      mockedNetworksServiceLineFormProps.appointmentTypes[0];

    const existingPatientsModalitiesGroupRoot = getModalitiesGroupRoot(
      ServiceLineAppointmentOption.ExistingPatients,
      mockedServiceLine.serviceLineId
    );
    expect(existingPatientsModalitiesGroupRoot).toBeVisible();

    const newPatientsModalitiesGroupRoot = getModalitiesGroupRoot(
      ServiceLineAppointmentOption.NewPatients,
      mockedServiceLine.serviceLineId
    );
    expect(newPatientsModalitiesGroupRoot).toBeVisible();

    const serviceLineSameSappointmentTypesStatus =
      getServiceLineCheckboxActiveLabel(mockedServiceLine.serviceLineId);

    expect(serviceLineSameSappointmentTypesStatus).toBeVisible();

    await user.click(serviceLineSameSappointmentTypesStatus);

    expect(
      mockedNetworksServiceLineFormProps.onSelectAppointmentType
    ).toHaveBeenCalledTimes(3);
    expect(
      mockedNetworksServiceLineFormProps.onSelectAppointmentType
    ).toHaveBeenCalledWith({
      appointmentTypeName: mockedAppointmentType.name,
      modalityType: mockedModality.type,
      serviceLineAppointmentOption: ServiceLineAppointmentOption.AllPatients,
      serviceLineId: mockedServiceLine.serviceLineId,
    });
  });

  it('should render disabled service line form correctly', async () => {
    setup({ isDisabled: true });
    const mockedServiceLine = mockedNetworksServiceLineFormProps.serviceLine;

    const serviceLineComponent = await findServiceLineForm(
      mockedServiceLine.serviceLineId
    );
    expect(serviceLineComponent).toBeVisible();

    const serviceLineFormHeader = getServiceLineFormHeader(
      mockedServiceLine.serviceLineId
    );
    expect(serviceLineFormHeader).toBeVisible();
    expect(serviceLineFormHeader).toHaveTextContent(
      mockedServiceLine.serviceLineName
    );

    const serviceLineCheckboxActiveLabel = getServiceLineCheckboxActiveLabel(
      mockedServiceLine.serviceLineId
    );
    expect(serviceLineCheckboxActiveLabel).toBeVisible();

    const serviceLineCheckboxActiveInput = getServiceLineCheckboxActiveInput(
      mockedServiceLine.serviceLineId
    );
    expect(serviceLineCheckboxActiveInput).toBeInTheDocument();
    expect(serviceLineCheckboxActiveInput).toBeDisabled();

    const serviceLineCheckboxInactiveLabel =
      getServiceLineCheckboxInactiveLabel(mockedServiceLine.serviceLineId);
    expect(serviceLineCheckboxInactiveLabel).toBeVisible();

    const serviceLineCheckboxInactiveInput =
      getServiceLineCheckboxInactiveInput(mockedServiceLine.serviceLineId);
    expect(serviceLineCheckboxInactiveInput).toBeInTheDocument();
    expect(serviceLineCheckboxInactiveInput).toBeDisabled();
  });
});
