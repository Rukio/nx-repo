import { FC } from 'react';
import { PageSection } from '@*company-data-covered*/patient-portal/ui';
import { OTHER_PATIENTS_SECTION_TEST_IDS } from './testIds';

const OtherPatientsSection: FC = () => {
  return (
    <PageSection
      testIdPrefix={OTHER_PATIENTS_SECTION_TEST_IDS.otherPatientsTestIdPrefix}
      title="Other Patients"
    ></PageSection>
  );
};

export default OtherPatientsSection;
