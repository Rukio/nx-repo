import { MouseEvent, useState } from 'react';
import {
  Box,
  Divider,
  IconButton,
  MoreHorizIcon,
  Stack,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { Insurance } from '@*company-data-covered*/caremanager/data-access-types';
import { DetailsCardRow, GenericMenu } from '@*company-data-covered*/caremanager/ui';
import InsuranceFormModal from '../InsuranceFormModal';
import DeleteInsuranceDialog from '../DeleteInsuranceDialog';

const styles = makeSxStyles({
  container: {
    height: 24,
    marginBottom: 3,
    fontSize: 12,
    color: (theme) => theme.palette.text.secondary,
    textTransform: 'uppercase',
  },
  divider: { marginBottom: 2 },
  deleteOption: { color: (theme) => theme.palette.error.main },
});

type Props = {
  insurance: Insurance;
  priorityLabel: string;
  testId?: string;
};

const InsuranceDetails: React.FC<Props> = ({ insurance, priorityLabel }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleCloseOptions = () => {
    setMenuAnchorEl(null);
  };
  const handleOpenUpdateModal = () => {
    setIsUpdateModalOpen(true);
    handleCloseOptions();
  };
  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
  };
  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
    handleCloseOptions();
  };
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Stack direction="row" alignItems="center" sx={styles.container}>
        <Box flex={1} data-testid={`patient-insurance-title-${insurance.id}`}>
          {priorityLabel} insurance
        </Box>
        <Box>
          <IconButton
            onClick={handleClick}
            data-testid={`patient-insurance-${insurance.id}-options-open`}
          >
            <MoreHorizIcon></MoreHorizIcon>
          </IconButton>
          <GenericMenu
            items={[
              { text: 'Edit', onClick: handleOpenUpdateModal },
              {
                text: 'Delete',
                onClick: handleOpenDeleteDialog,
                styles: styles.deleteOption,
              },
            ]}
            onClose={handleCloseOptions}
            anchorEl={menuAnchorEl}
            testIdPrefix="details-card"
          />
        </Box>
      </Stack>
      <DetailsCardRow
        label="Payer"
        testId={`patient-insurance-payer-${insurance.id}`}
      >
        {insurance.name}
      </DetailsCardRow>
      <Divider sx={styles.divider} />
      <DetailsCardRow
        label="Member ID"
        testId={`patient-insurance-member-id-${insurance.id}`}
      >
        {insurance.memberId}
      </DetailsCardRow>
      <InsuranceFormModal
        insurance={insurance}
        priorityLabel={priorityLabel}
        open={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
      />
      <DeleteInsuranceDialog
        insurance={insurance}
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      />
    </>
  );
};

export default InsuranceDetails;
