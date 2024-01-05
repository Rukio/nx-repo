import { useState } from 'react';
import {
  AddIcon,
  Box,
  Button,
  Link,
  SearchIcon,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  Patient,
  Pharmacy,
} from '@*company-data-covered*/caremanager/data-access-types';
import { DetailsCard, DetailsCardRow } from '@*company-data-covered*/caremanager/ui';
import PharmacyFormModal from '../PharmacyFormModal';

export const PATIENT_PHARMACY_CARD_TEST_ID = 'patient-pharmacy-card';

const styles = makeSxStyles({
  noPharmacyWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 2,
  },
  searchIcon: {
    fontSize: '3.3rem',
    color: (theme) => theme.palette.text.disabled,
    marginBottom: 1,
  },
  link: { textDecoration: 'none' },
});

type Props = {
  pharmacy?: Pharmacy;
  patientId: Patient['id'];
};

const PatientPharmacyCard: React.FC<Props> = ({ pharmacy, patientId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {!pharmacy ? (
        <DetailsCard title="Pharmacy">
          <Box sx={styles.noPharmacyWrapper}>
            <SearchIcon sx={styles.searchIcon} />
            <Typography
              variant="body1"
              color={(theme) => theme.palette.text.secondary}
              marginBottom={2}
            >
              There are no pharmacies associated with this patient yet
            </Typography>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              size="large"
              onClick={handleOpenModal}
              data-testId="add-pharmacy-button"
            >
              Add Pharmacy
            </Button>
          </Box>
        </DetailsCard>
      ) : (
        <DetailsCard
          horizontal
          title="Pharmacy"
          actions={[
            {
              label: 'Edit',
              handler: handleOpenModal,
            },
          ]}
          testId={PATIENT_PHARMACY_CARD_TEST_ID}
        >
          <DetailsCardRow
            label="Name"
            appendDivider
            testId="patient-pharmacy-name"
          >
            {pharmacy.name}
          </DetailsCardRow>
          <DetailsCardRow
            label="Phone Number"
            testId="patient-pharmacy-phone-number"
          >
            {pharmacy.phoneNumber}
          </DetailsCardRow>
          <DetailsCardRow
            label="Fax Number"
            appendDivider
            testId="patient-pharmacy-fax-number"
          >
            {pharmacy.faxNumber}
          </DetailsCardRow>
          <DetailsCardRow label="Address" testId="patient-pharmacy-address">
            {pharmacy.address && (
              <Link
                href={`https://maps.google.com/?q=${pharmacy.address}`}
                target="_blank"
                sx={styles.link}
              >
                {pharmacy.address}
              </Link>
            )}
          </DetailsCardRow>
        </DetailsCard>
      )}
      <PharmacyFormModal
        pharmacy={pharmacy}
        patientId={patientId}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default PatientPharmacyCard;
