import { PatientDetails } from '@*company-data-covered*/patient-portal/feature';
import { Page } from '@*company-data-covered*/patient-portal/ui';

export const PATIENT_DETAILS_TEST_ID_PREFIX = 'patient-details';

export const PatientDetailsPage = () => {
  return (
    <Page testIdPrefix={PATIENT_DETAILS_TEST_ID_PREFIX}>
      <PatientDetails />
    </Page>
  );
};

export default PatientDetailsPage;
