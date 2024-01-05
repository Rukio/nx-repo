import React, { useState } from 'react';
import {
  AddIcon,
  Box,
  Button,
  Divider,
  SearchIcon,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { Insurance } from '@*company-data-covered*/caremanager/data-access-types';
import { DetailsCard } from '@*company-data-covered*/caremanager/ui';
import InsuranceDetails from '../InsuranceDetails';
import InsuranceFormModal from '../InsuranceFormModal';

export const PATIENT_INSURANCES_CARD_TEST_ID = 'patient-insurances-card';
export const ADD_BUTTON_TEST_ID = 'patient-insurances-card-add-button';

const styles = makeSxStyles({
  searchIcon: {
    fontSize: '3.3rem',
    color: (theme) => theme.palette.text.disabled,
  },
  divider: { marginBottom: 2 },
  addWrapper: {
    marginLeft: -3,
    marginRight: -3,
    marginBottom: -3,
  },
  addButton: { padding: 1.5, borderRadius: 0 },
});

const priorityLabels = ['Primary', 'Secondary', 'Tertiary'];

type Props = {
  patientId: string;
  insurances: Insurance[];
};

const PatientInsurancesCard: React.FC<Props> = ({ patientId, insurances }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <DetailsCard title="Insurance" testId={PATIENT_INSURANCES_CARD_TEST_ID}>
      {!insurances.length ? (
        <Box textAlign="center" paddingTop={1} paddingBottom={5}>
          <SearchIcon sx={styles.searchIcon} />
          <Typography
            variant="body1"
            color={(theme) => theme.palette.text.secondary}
            marginBottom={2}
          >
            There is no insurance information yet
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            size="large"
            onClick={handleOpenCreateModal}
          >
            Add Primary Insurance
          </Button>
        </Box>
      ) : (
        insurances
          .sort((a, b) => a.priority - b.priority)
          .map((insurance, index) => (
            <React.Fragment key={insurance.id}>
              <InsuranceDetails
                insurance={insurance}
                priorityLabel={priorityLabels[index]}
              />
              {index < insurances.length - 1 && <Divider sx={styles.divider} />}
            </React.Fragment>
          ))
      )}
      {!!insurances.length && insurances.length < 3 && (
        <Box sx={styles.addWrapper}>
          <Divider />
          <Button
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
            fullWidth
            sx={styles.addButton}
            data-testid={ADD_BUTTON_TEST_ID}
          >
            Add {priorityLabels[insurances.length]}
          </Button>
        </Box>
      )}
      <InsuranceFormModal
        patientId={patientId}
        priorityLabel={priorityLabels[insurances.length]}
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />
    </DetailsCard>
  );
};

export default PatientInsurancesCard;
