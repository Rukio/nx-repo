import { CreatePatientForm } from '@*company-data-covered*/patient-portal/feature';
import { Page } from '@*company-data-covered*/patient-portal/ui';

export const CREATE_PATIENT_TEST_ID_PREFIX = 'create-patient';

export const PatientCreatePage = () => (
  <Page testIdPrefix={CREATE_PATIENT_TEST_ID_PREFIX}>
    <CreatePatientForm />
  </Page>
);

export default PatientCreatePage;
