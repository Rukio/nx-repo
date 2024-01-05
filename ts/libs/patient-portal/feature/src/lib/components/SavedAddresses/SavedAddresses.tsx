import { FC, useState } from 'react';
import {
  SavedAddresses as SavedAddressesUI,
  ADDRESSES_MOCKS,
  PageSection,
  AddressObject,
} from '@*company-data-covered*/patient-portal/ui';
import { SAVED_ADDRESSES_TEST_IDS } from './testIds';
import { EditAddressModal } from '../EditAddressModal';

const SavedAddresses: FC = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  //TODO(PT-1619): move address to edit to data-access
  const [addressToEdit, setAddressToEdit] = useState<AddressObject | undefined>(
    undefined
  );
  const onAddAddress = () => {
    //TODO(PT-1619): this is temporary, will be removed after data-access is implemented
    console.info('onAddAddress');
  };

  const onEditAddress = (addressId: string) => {
    setIsEditModalOpen(true);

    const address = ADDRESSES_MOCKS.find((address) => address.id === addressId);
    setAddressToEdit(address);
  };

  const onCloseAddressModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <PageSection
      testIdPrefix={SAVED_ADDRESSES_TEST_IDS.TITLE}
      title="Saved Addresses"
      subtitle="Addresses where we deliver care"
    >
      <SavedAddressesUI
        onAddAddress={onAddAddress}
        onEditAddress={onEditAddress}
        addresses={ADDRESSES_MOCKS}
      />
      {addressToEdit && (
        <EditAddressModal
          address={addressToEdit}
          open={isEditModalOpen}
          onClose={onCloseAddressModal}
        />
      )}
    </PageSection>
  );
};

export default SavedAddresses;
