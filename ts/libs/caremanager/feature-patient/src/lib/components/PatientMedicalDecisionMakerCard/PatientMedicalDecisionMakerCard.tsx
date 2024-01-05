import { useState } from 'react';
import {
  AddIcon,
  Box,
  Button,
  Divider,
  Link,
  SearchIcon,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  MedicalDecisionMaker,
  Patient,
} from '@*company-data-covered*/caremanager/data-access-types';
import { DetailsCard, DetailsCardRow } from '@*company-data-covered*/caremanager/ui';
import MedicalDecisionMakerModal from '../EditMedicalDecisionMakerModal';

export const PATIENT_MEDICAL_DECISION_MAKER_CARD_TEST_ID =
  'patient-medical-decision-maker-card';
export const PATIENT_CREATE_MDM_BUTTON_TEST_ID = 'patient-create-mdm-button';
type Props = {
  medicalDecisionMaker?: MedicalDecisionMaker;
  patientId: Patient['id'];
};

const styles = makeSxStyles({
  searchIcon: {
    fontSize: '3.3rem',
    color: (theme) => theme.palette.text.disabled,
  },
  divider: { marginBottom: 2 },
  link: { textDecoration: 'none' },
});

const PatientMedicalDecisionMakerCard: React.FC<Props> = ({
  medicalDecisionMaker,
  patientId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <DetailsCard
      title="Medical Decision Maker"
      testId={PATIENT_MEDICAL_DECISION_MAKER_CARD_TEST_ID}
      actions={
        medicalDecisionMaker
          ? [
              {
                label: 'Edit',
                handler: () => setIsModalOpen(true),
              },
            ]
          : undefined
      }
    >
      {!medicalDecisionMaker ? (
        <Box textAlign="center" paddingTop={1} paddingBottom={5}>
          <SearchIcon sx={styles.searchIcon} />
          <Typography
            variant="body1"
            color={(theme) => theme.palette.text.secondary}
            marginBottom={2}
          >
            There is no medical decision maker yet
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            size="large"
            onClick={() => setIsModalOpen(true)}
            data-testid={PATIENT_CREATE_MDM_BUTTON_TEST_ID}
          >
            Add Medical Decision Maker
          </Button>
        </Box>
      ) : (
        <>
          <DetailsCardRow
            label="First Name"
            testId="patient-decision-maker-first-name"
          >
            {medicalDecisionMaker?.firstName}
          </DetailsCardRow>
          <DetailsCardRow
            label="Last Name"
            testId="patient-decision-maker-last-name"
          >
            {medicalDecisionMaker?.lastName}
          </DetailsCardRow>
          <Divider sx={styles.divider}></Divider>
          <DetailsCardRow
            label="Address"
            testId="patient-decision-maker-address"
          >
            <Link
              href={`https://maps.google.com/?q=${medicalDecisionMaker?.address}`}
              target="_blank"
              sx={styles.link}
            >
              {medicalDecisionMaker?.address}
            </Link>
          </DetailsCardRow>
          <Divider sx={styles.divider}></Divider>
          <DetailsCardRow
            label="Phone Number"
            testId="patient-decision-maker-phone-number"
          >
            {medicalDecisionMaker?.phoneNumber}
          </DetailsCardRow>
          <Divider sx={styles.divider}></Divider>
          <DetailsCardRow
            label="Relationship"
            testId="patient-decision-maker-relationship"
          >
            {medicalDecisionMaker?.relationship}
          </DetailsCardRow>
        </>
      )}
      <MedicalDecisionMakerModal
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
        patientId={patientId}
      />
    </DetailsCard>
  );
};

export default PatientMedicalDecisionMakerCard;
