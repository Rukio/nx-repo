import { NETWORKS_SERVICE_LINE_FORM_TEST_IDS } from '..';
import { render, screen, within } from '../../../../testUtils';
import {
  getModalitiesMock,
  getAppointmentTypesMock,
  getNetworkAppointmentTypesMock,
} from '../../../../testUtils/mocks';
import ModalitiesGroup, {
  ModalitiesGroupProps,
  ServiceLineAppointmentOption,
} from './ModalitiesGroup';

const mockedModalitiesGroupProps: ModalitiesGroupProps = {
  header: 'New Patient',
  modalities: getModalitiesMock(),
  serviceLine: {
    serviceLineId: '1',
    serviceLineName: 'Acute Care',
    disabled: false,
    newPatientAppointmentType: '1',
    existingPatientAppointmentType: '2',
  },
  serviceLineAppointmentOption: ServiceLineAppointmentOption.ExistingPatients,
  appointmentTypes: getAppointmentTypesMock(),
  networkAppointmentTypes: getNetworkAppointmentTypesMock(2, true),
  handleSelectAppointmentType: vi.fn(),
};
const getModalityHeader = (
  ServiceLineAppointmentOption: ServiceLineAppointmentOption,
  serviceLineId: string | number,
  modalityId: string | number
) =>
  screen.getByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityHeaderTestId(
      ServiceLineAppointmentOption,
      serviceLineId,
      modalityId
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

const getModalityAppointmentTypeSelectLabel = (
  ServiceLineAppointmentOption: ServiceLineAppointmentOption,
  serviceLineId: string | number,
  modalityId: string | number
) =>
  screen.getByTestId(
    NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityAppointmentTypeSelectLabelTestId(
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

const setup = (overrideProps: Partial<ModalitiesGroupProps> = {}) => {
  return render(
    <ModalitiesGroup {...mockedModalitiesGroupProps} {...overrideProps} />
  );
};

const mockedModalities = mockedModalitiesGroupProps.modalities;
const mockedModality = mockedModalitiesGroupProps.modalities[0];
const mockedServiceLine = mockedModalitiesGroupProps.serviceLine;
const mockedAppointmentTypeOption =
  mockedModalitiesGroupProps.serviceLineAppointmentOption;
const mockedAppointmentType = mockedModalitiesGroupProps.appointmentTypes[0];
const mockedSelectAppointmentTypeFn =
  mockedModalitiesGroupProps.handleSelectAppointmentType;

describe('<ModalitiesGroup />', () => {
  it('should render modalities correctly', () => {
    setup();

    for (const modality of mockedModalities) {
      const modalityHeader = getModalityHeader(
        mockedAppointmentTypeOption,
        mockedServiceLine.serviceLineId,
        modality.id
      );
      expect(modalityHeader).toBeVisible();
      expect(modalityHeader).toHaveTextContent(modality.displayName);

      const modalityAppointmentTypeSelect = getModalityAppointmentTypeSelect(
        mockedAppointmentTypeOption,
        mockedServiceLine.serviceLineId,
        modality.id
      );
      expect(modalityAppointmentTypeSelect).toBeVisible();

      const modalityAppointmentTypeSelectLabel =
        getModalityAppointmentTypeSelectLabel(
          mockedAppointmentTypeOption,
          mockedServiceLine.serviceLineId,
          modality.id
        );
      expect(modalityAppointmentTypeSelectLabel).toBeVisible();
      expect(modalityAppointmentTypeSelectLabel).toHaveTextContent(
        'Select Appointment Type'
      );
    }
  });

  it('should call SelectAppointmentType fn on appointment types menu item click', async () => {
    const { user } = setup();

    const modalityAppointmentTypeSelect = getModalityAppointmentTypeSelect(
      mockedAppointmentTypeOption,
      mockedServiceLine.serviceLineId,
      mockedModality.id
    );

    const modalityAppointmentTypeSelectButton = within(
      modalityAppointmentTypeSelect
    ).getByRole('button');

    await user.click(modalityAppointmentTypeSelectButton);

    const appointmentTypeOption = await findModalityAppointmentTypeSelectOption(
      mockedAppointmentTypeOption,
      mockedServiceLine.serviceLineId,
      mockedModality.id,
      mockedAppointmentType.id
    );
    await user.click(appointmentTypeOption);
    expect(mockedSelectAppointmentTypeFn).toHaveBeenCalled();
  });

  it('should render disabled modalities form', () => {
    setup({ isDisabled: true });

    for (const modality of mockedModalities) {
      const modalityHeader = getModalityHeader(
        mockedAppointmentTypeOption,
        mockedServiceLine.serviceLineId,
        modality.id
      );
      expect(modalityHeader).toBeVisible();
      expect(modalityHeader).toHaveTextContent(modality.displayName);

      const modalityAppointmentTypeSelect = getModalityAppointmentTypeSelect(
        mockedAppointmentTypeOption,
        mockedServiceLine.serviceLineId,
        modality.id
      );
      const modalityAppointmentTypeSelectButton = within(
        modalityAppointmentTypeSelect
      ).getByRole('button');

      expect(modalityAppointmentTypeSelect).toBeVisible();
      expect(modalityAppointmentTypeSelectButton).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    }
  });
});
