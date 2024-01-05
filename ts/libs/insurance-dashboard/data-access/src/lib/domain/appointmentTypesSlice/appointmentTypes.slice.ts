import { insuranceDashboardApiSlice } from '../apiSlice';
import { DomainAppointmentType } from '../../types';

export const APPOINTMENT_TYPES_API_PATH = 'appointment_types';

export const buildAppointmentTypesPath = () => {
  return APPOINTMENT_TYPES_API_PATH;
};

export const appointmentTypesSlice = insuranceDashboardApiSlice.injectEndpoints(
  {
    endpoints: (builder) => ({
      getAppointmentTypes: builder.query<DomainAppointmentType[], void>({
        query: () => APPOINTMENT_TYPES_API_PATH,
        transformResponse: ({
          appointmentTypes,
        }: {
          appointmentTypes: DomainAppointmentType[];
        }) => appointmentTypes,
      }),
    }),
  }
);

export const selectDomainAppointmentTypes =
  appointmentTypesSlice.endpoints.getAppointmentTypes.select();

export const { useGetAppointmentTypesQuery } = appointmentTypesSlice;
