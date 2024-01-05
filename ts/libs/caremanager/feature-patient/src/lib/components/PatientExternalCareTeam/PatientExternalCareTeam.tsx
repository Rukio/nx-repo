import { useState } from 'react';
import {
  AddIcon,
  Box,
  Button,
  SearchIcon,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  ExternalCareProvider,
  Patient,
} from '@*company-data-covered*/caremanager/data-access-types';
import PatientExternalCareProviderCard from '../PatientExternalCareProviderCard';
import ExternalCareProviderFormModal from '../ExternalCareProviderFormModal';

export const PATIENT_EXTERNAL_CARE_TEAM_TEST_ID = 'patient-external-care-team';

const styles = makeSxStyles({
  titleWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  searchIconWrapper: {
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
});

const AddExternalCareProviderButton: React.FC<{
  variant: 'contained' | 'outlined';
  onClick: () => void;
}> = ({ variant, onClick }) => {
  return (
    <Button
      startIcon={<AddIcon />}
      onClick={onClick}
      variant={variant}
      data-testid="add-external-care-team-member"
    >
      Add Team Member
    </Button>
  );
};

type Props = {
  patientId: Patient['id'];
  externalCareProviders?: ExternalCareProvider[];
};

const PatientExternalCareTeam: React.FC<Props> = ({
  patientId,
  externalCareProviders,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <Box data-testid={PATIENT_EXTERNAL_CARE_TEAM_TEST_ID}>
      <Box sx={styles.titleWrapper}>
        <Typography variant="h6" flex={1}>
          External Care Team
        </Typography>
        <AddExternalCareProviderButton
          onClick={handleOpenCreateModal}
          variant="outlined"
        />
      </Box>
      {externalCareProviders?.length ? (
        externalCareProviders.map((externalCareProvider) => (
          <PatientExternalCareProviderCard
            key={externalCareProvider.id}
            externalCareProvider={externalCareProvider}
          />
        ))
      ) : (
        <Box sx={styles.searchIconWrapper}>
          <SearchIcon sx={styles.searchIcon} />
          <Typography
            variant="body1"
            color={(theme) => theme.palette.text.secondary}
            mb={2}
          >
            No one has been added to the External Care Team yet
          </Typography>
          <AddExternalCareProviderButton
            onClick={handleOpenCreateModal}
            variant="contained"
          />
        </Box>
      )}
      <ExternalCareProviderFormModal
        patientId={patientId}
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />
    </Box>
  );
};

export default PatientExternalCareTeam;
