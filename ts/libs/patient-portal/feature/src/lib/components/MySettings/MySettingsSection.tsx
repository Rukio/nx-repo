import { FC } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import {
  MySettings,
  PATIENT_MENU_LIST_ITEM_SECTIONS_IDS,
  PageSection,
} from '@*company-data-covered*/patient-portal/ui';
import { MY_SETTINGS_SECTION_TEST_IDS } from './testIds';
import { PATIENT_PORTAL_ROUTES } from '../../constants';
import { ValueOf } from '@*company-data-covered*/shared/util/types';

const SETTINGS_DATA_MOCK = {
  firstName: 'Alexandra',
  lastName: 'Anderson',
  email: 'aanderson87@gmail.com',
  dateOfBirth: '09/28/1987',
  phoneNumber: '(508) 555-1234',
  assignedSexAtBirth: 'Female',
  genderIdentity: 'Female',
  billingAddress: {
    id: 'RANDOM_ID',
    streetAddress1: '1000 Elm St',
    streetAddress2: '#203',
    city: 'Denver',
    state: 'CO',
    zipCode: '80205',
  },
};

const MYSETTINGS_PROPS_MOCK = {
  settingsData: SETTINGS_DATA_MOCK,
  hasPatientDetails: false,
  hasRequestedCareForSelf: true,
};

const MySettingsSection: FC = () => {
  const navigate = useNavigate();

  const onAddPatientDetails = () => {
    navigate(
      generatePath(PATIENT_PORTAL_ROUTES.PATIENT_DETAILS, {
        patientId: 'MOCK_PATIENT_ID',
      })
    );
  };
  const onSectionEdit = (
    sectionId: ValueOf<typeof PATIENT_MENU_LIST_ITEM_SECTIONS_IDS>
  ) => {
    console.info(`${sectionId}-edit`);
  };
  const onSectionInfo = (
    sectionId: ValueOf<typeof PATIENT_MENU_LIST_ITEM_SECTIONS_IDS>
  ) => {
    console.info(`${sectionId}-info`);
  };

  return (
    <PageSection
      testIdPrefix={MY_SETTINGS_SECTION_TEST_IDS.mySettingsTestIdPrefix}
      title="My Settings"
    >
      <MySettings
        {...MYSETTINGS_PROPS_MOCK}
        onAddPatientDetails={onAddPatientDetails}
        onSectionEdit={onSectionEdit}
        onSectionInfo={onSectionInfo}
        testIdPrefix={MY_SETTINGS_SECTION_TEST_IDS.mySettingsTestIdPrefix}
      />
    </PageSection>
  );
};

export default MySettingsSection;
