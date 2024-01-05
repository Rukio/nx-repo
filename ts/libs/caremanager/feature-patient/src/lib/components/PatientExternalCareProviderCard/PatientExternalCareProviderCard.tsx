import { useState } from 'react';
import { Link, makeSxStyles } from '@*company-data-covered*/design-system';
import { useGetProviderTypes } from '@*company-data-covered*/caremanager/data-access';
import { ExternalCareProvider } from '@*company-data-covered*/caremanager/data-access-types';
import { DetailsCard, DetailsCardRow } from '@*company-data-covered*/caremanager/ui';
import ExternalCareProviderFormModal from '../ExternalCareProviderFormModal';
import DeleteExternalCareProviderDialog from '../DeleteExternalCareProviderDialog';

export const EXTERNAL_CARE_PROVIDER_CARD_TEST_ID =
  'external-care-provider-card';

const styles = makeSxStyles({
  link: { textDecoration: 'none' },
});

type Props = {
  externalCareProvider: ExternalCareProvider;
};

const PatientExternalCareProviderCard: React.FC<Props> = ({
  externalCareProvider,
}) => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [, providerType] = useGetProviderTypes(
    externalCareProvider.providerTypeId
  );

  const handleOpenUpdateModal = () => {
    setIsUpdateModalOpen(true);
  };
  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
  };
  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <DetailsCard
      horizontal
      title={providerType?.name ?? 'Unknown Provider type'}
      actions={[
        { label: 'Edit', handler: handleOpenUpdateModal },
        {
          label: 'Delete',
          handler: handleOpenDeleteDialog,
          isDestructive: true,
        },
      ]}
      testId={`${EXTERNAL_CARE_PROVIDER_CARD_TEST_ID}-${externalCareProvider.id}`}
    >
      <DetailsCardRow
        label="Name"
        appendDivider
        testId={`patient-provider-name-${externalCareProvider.id}`}
      >
        {externalCareProvider.name}
      </DetailsCardRow>
      <DetailsCardRow
        label="Phone Number"
        testId={`patient-provider-phone-number-${externalCareProvider.id}`}
      >
        {externalCareProvider.phoneNumber}
      </DetailsCardRow>
      <DetailsCardRow
        label="Fax Number"
        appendDivider
        testId={`patient-provider-fax-number-${externalCareProvider.id}`}
      >
        {externalCareProvider.faxNumber}
      </DetailsCardRow>
      <DetailsCardRow
        label="Address"
        testId={`patient-provider-address-${externalCareProvider.id}`}
      >
        {externalCareProvider?.address && (
          <Link
            href={`https://maps.google.com/?q=${externalCareProvider.address}`}
            target="_blank"
            sx={styles.link}
          >
            {externalCareProvider.address}
          </Link>
        )}
      </DetailsCardRow>
      <ExternalCareProviderFormModal
        externalCareProvider={externalCareProvider}
        open={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
      />
      <DeleteExternalCareProviderDialog
        externalCareProvider={externalCareProvider}
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      />
    </DetailsCard>
  );
};

export default PatientExternalCareProviderCard;
