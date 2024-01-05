import { FC, useState } from 'react';
import {
  PatientDetails as PatientDetailsUI,
  PageSection,
  PATIENT_MENU_LIST_ITEM_SECTIONS_IDS,
  ResponsiveModal,
  Confirmation,
} from '@*company-data-covered*/patient-portal/ui';
import { PATIENT_DETAILS_TEST_IDS } from './testIds';
import { ValueOf } from '@*company-data-covered*/shared/util/types';
import { useNavigate } from 'react-router-dom';
import {
  NAVIGATION_TO_SETTINGS_PARAMS,
  PATIENT_PORTAL_ROUTES,
} from '../../constants';

//TODO(PT-1619): this is temporary, will be removed after data-access is implemented
export const PATIENT_DATA_MOCK = {
  firstName: 'Alexandra',
  lastName: 'Anderson',
  email: 'aanderson87@gmail.com',
  dateOfBirth: '09/28/1987',
  phoneNumber: '(508) 555-1234',
  legalSex: 'Male',
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

const PatientDetails: FC = () => {
  const navigate = useNavigate();
  const [isDeleteModalShow, setIsDeleteModalShow] = useState(false);
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

  const onDeletePatient = () => {
    navigate(PATIENT_PORTAL_ROUTES.LANDING_PAGE);
    setIsDeleteModalShow(false);
  };

  const onRemovePatient = () => {
    setIsDeleteModalShow(true);
  };

  const handleCloseModal = () => {
    setIsDeleteModalShow(false);
  };

  return (
    <PageSection
      testIdPrefix={PATIENT_DETAILS_TEST_IDS.TITLE}
      title="Patient Details"
      backButtonOptions={NAVIGATION_TO_SETTINGS_PARAMS}
    >
      <PatientDetailsUI
        onSectionEdit={onSectionEdit}
        onSectionInfo={onSectionInfo}
        onRemovePatient={onRemovePatient}
        patientDetails={PATIENT_DATA_MOCK}
      />
      <ResponsiveModal
        testIdPrefix={PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION_MODAL}
        title="Remove this Patient?"
        open={isDeleteModalShow}
        onClose={handleCloseModal}
      >
        <Confirmation
          testIdPrefix={PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION}
          handleSubmit={onDeletePatient}
          buttonText="Yes, Remove this Patient"
          alertMessage="Are you sure you want to remove this patient from your account?"
        />
      </ResponsiveModal>
    </PageSection>
  );
};

export default PatientDetails;
