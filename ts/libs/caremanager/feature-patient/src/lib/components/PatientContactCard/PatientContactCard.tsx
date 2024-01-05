import { useState } from 'react';
import { Divider, Link, makeSxStyles } from '@*company-data-covered*/design-system';
import { Patient } from '@*company-data-covered*/caremanager/data-access-types';
import { DetailsCard, DetailsCardRow } from '@*company-data-covered*/caremanager/ui';
import EditPatientContactInformationModal from '../EditPatientContactInformationModal';

const styles = makeSxStyles({
  link: { textDecoration: 'none' },
  divider: { marginBottom: 2 },
});

export const PATIENT_CONTACT_CARD_TEST_ID = 'patient-contact-card';

const getAddress = (patient: Patient) =>
  `${[patient.addressStreet, patient.addressStreet2, patient.addressCity]
    .filter((item) => item)
    .join(' ')}, ${patient.addressState} ${patient.addressZipcode}`;

type Props = {
  patient: Patient;
};

const PatientContactCard: React.FC<Props> = ({ patient }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const fullAddress = getAddress(patient);

  return (
    <>
      <DetailsCard
        title="Patient Contact Information"
        actions={[
          {
            label: 'Edit',
            handler: () => {
              setEditModalOpen(true);
            },
          },
        ]}
        testId={PATIENT_CONTACT_CARD_TEST_ID}
      >
        <DetailsCardRow label="Address" testId="patient-contact-address">
          <Link
            href={`https://maps.google.com/?q=${fullAddress}`}
            target="_blank"
            sx={styles.link}
          >
            {fullAddress}
          </Link>
        </DetailsCardRow>
        <Divider sx={styles.link} />
        <DetailsCardRow
          label="Phone Number"
          testId="patient-contact-phone-number"
        >
          {patient.phoneNumber}
        </DetailsCardRow>
        <Divider sx={styles.link} />
        <DetailsCardRow label="Note" testId="patient-contact-address-notes">
          {patient.addressNotes}
        </DetailsCardRow>
      </DetailsCard>
      <EditPatientContactInformationModal
        onClose={() => setEditModalOpen(false)}
        open={editModalOpen}
        patientId={patient.id}
      />
    </>
  );
};

export default PatientContactCard;
