import { ServiceLineAppointmentType } from '../../lib/types';
import { NetworkAppointmentType } from '../../lib/components/NetworksServiceLineForm/ModalitiesGroup';

export const getAppointmentTypesMock = (): ServiceLineAppointmentType[] => [
  {
    name: 'Vaccinations',
    id: '1',
  },
  {
    name: 'Eye Care',
    id: '2',
  },
  {
    name: 'Dental',
    id: '3',
  },
];

export const getNetworkAppointmentTypesMock = (
  appointmentTypesCount: number,
  isSameAppointmentTypes?: boolean
): NetworkAppointmentType[] =>
  Array(appointmentTypesCount)
    .fill(0)
    .map((_, index) => ({
      id: String(index),
      networkId: String(index),
      serviceLineId: String(index),
      modalityType: String(index),
      newPatientAppointmentType: String(index),
      existingPatientAppointmentType: String(
        isSameAppointmentTypes ? index : index + 1
      ),
    }));
