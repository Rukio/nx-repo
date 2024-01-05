import { useState } from 'react';
import { calculateAge, formattedDOB } from '@*company-data-covered*/caremanager/utils';
import { Patient } from '@*company-data-covered*/caremanager/data-access-types';
import { DetailsCard, DetailsCardRow } from '@*company-data-covered*/caremanager/ui';
import EditPatientDemographicsModal from '../EditPatientDemographicsModal';

export const PATIENT_DEMOGRAPHICS_CARD_TEST_ID = 'patient-demographics-card';
const PATIENT_DEMOGRAPHICS_FIRST_NAME = 'patient-demographics-first-name';
const PATIENT_DEMOGRAPHICS_MIDDLE_NAME = 'patient-demographics-middle-name';
const PATIENT_DEMOGRAPHICS_LAST_NAME = 'patient-demographics-last-name';
const PATIENT_DEMOGRAPHICS_DOB = 'patient-demographics-dob';
const PATIENT_DEMOGRAPHICS_SEX = 'patient-demographics-sex';
const PATIENT_DEMOGRAPHICS_ATHENA_ID = 'patient-demographics-athena-id';

type Props = {
  patient: Patient;
};

const PatientDemographicsCard: React.FC<Props> = ({ patient }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <>
      <DetailsCard
        title="Patient Demographics"
        actions={[{ label: 'Edit', handler: handleOpenEditModal }]}
        testId={PATIENT_DEMOGRAPHICS_CARD_TEST_ID}
      >
        <DetailsCardRow
          label="First Name"
          testId={PATIENT_DEMOGRAPHICS_FIRST_NAME}
        >
          {patient.firstName}
        </DetailsCardRow>
        <DetailsCardRow
          label="Middle Name"
          testId={PATIENT_DEMOGRAPHICS_MIDDLE_NAME}
        >
          {patient.middleName}
        </DetailsCardRow>
        <DetailsCardRow
          label="Last Name"
          appendDivider
          testId={PATIENT_DEMOGRAPHICS_LAST_NAME}
        >
          {patient.lastName}
        </DetailsCardRow>
        <DetailsCardRow label="Date of Birth" testId={PATIENT_DEMOGRAPHICS_DOB}>
          {formattedDOB(patient.dateOfBirth)} (
          {calculateAge(patient.dateOfBirth)}
          yo)
        </DetailsCardRow>
        <DetailsCardRow
          label="Sex at Birth"
          testId={PATIENT_DEMOGRAPHICS_SEX}
          appendDivider
        >
          {patient.sex}
        </DetailsCardRow>
        <DetailsCardRow
          label="MRN/Athena ID"
          testId={PATIENT_DEMOGRAPHICS_ATHENA_ID}
        >
          {patient.athenaId}
        </DetailsCardRow>
      </DetailsCard>
      <EditPatientDemographicsModal
        patientId={patient.id}
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
      />
    </>
  );
};

export default PatientDemographicsCard;
