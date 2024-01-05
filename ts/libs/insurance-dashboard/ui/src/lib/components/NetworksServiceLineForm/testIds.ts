import { ServiceLineAppointmentOption } from './ModalitiesGroup';

const networkServiceLineFormPrefixText = 'network-service-line-form';

export const NETWORKS_SERVICE_LINE_FORM_TEST_IDS = {
  getServiceLineFormTestId: (serviceLineId: number | string) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}`,
  getServiceLineFormHeaderTestId: (serviceLineId: number | string) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}-header`,
  getServiceLineAlertTestId: (serviceLineId: number | string) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}-alert`,
  getServiceLineActiveAppointmentTypesRadioLabelTestId: (
    serviceLineId: number | string
  ) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}-appointment-types-active-radio`,
  getServiceLineInactiveAppointmentTypesRadioLabelTestId: (
    serviceLineId: number | string
  ) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}-appointment-types-inactive-radio`,
  getModalitiesGroupRoot: (
    ServiceLineAppointmentFor: ServiceLineAppointmentOption,
    serviceLineId: string | number
  ) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}-appointment-types-modalities-group-${ServiceLineAppointmentFor}`,
  getModalityRootTestId: (
    ServiceLineAppointmentFor: ServiceLineAppointmentOption,
    serviceLineId: string | number,
    modalityId: string | number
  ) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}-${ServiceLineAppointmentFor}-patients-modality-${modalityId}`,
  getModalityHeaderTestId: (
    ServiceLineAppointmentFor: ServiceLineAppointmentOption,
    serviceLineId: string | number,
    modalityId: string | number
  ) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}-${ServiceLineAppointmentFor}-patients-modality-${modalityId}-header`,
  getModalityAppointmentTypeSelectTestId: (
    ServiceLineAppointmentFor: ServiceLineAppointmentOption,
    serviceLineId: string | number,
    modalityId: string | number
  ) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}-${ServiceLineAppointmentFor}-patients-modality-${modalityId}-appointment-type-select`,
  getModalityAppointmentTypeSelectLabelTestId: (
    ServiceLineAppointmentFor: ServiceLineAppointmentOption,
    serviceLineId: string | number,
    modalityId: string | number
  ) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}-${ServiceLineAppointmentFor}-patients-modality-${modalityId}-appointment-type-select-label`,
  getModalityAppointmentTypeSelectOptionTestId: (
    ServiceLineAppointmentFor: ServiceLineAppointmentOption,
    serviceLineId: string | number,
    modalityId: string | number,
    appointmentTypeId: string | number
  ) =>
    `${networkServiceLineFormPrefixText}-${serviceLineId}-${ServiceLineAppointmentFor}-patients-modality-${modalityId}-appointment-type-select-option-${appointmentTypeId}`,
};
