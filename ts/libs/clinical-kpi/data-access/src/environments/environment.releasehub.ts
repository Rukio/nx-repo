import { ClinicalKpiDataAccessEnvironment } from './environment.base';

export const environment: ClinicalKpiDataAccessEnvironment = {
  serviceURL: process.env['NX_CLINICALKPI_DASHBOARD_API_URL'] + '/v1/' ?? '',
  stationURL: process.env['NX_CLINICALKPI_DASHBOARD_STATION_URL'] ?? '',
};
