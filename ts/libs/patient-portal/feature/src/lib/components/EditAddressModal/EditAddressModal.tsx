import { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  EditAddressForm as EditAddressFormUI,
  AddressPayload,
  ResponsiveModal,
  Confirmation,
} from '@*company-data-covered*/patient-portal/ui';
import { EDIT_ADDRESS_MODAL_TEST_IDS } from './testIds';
import { addressValidationSchema } from '../../utils/validation';

export type EditAddressModalProps = {
  address: AddressPayload;
  open: boolean;
  onClose: () => void;
};

const EditAddressModal: FC<EditAddressModalProps> = ({
  open,
  onClose,
  address,
}) => {
  const [isDeleteModalShow, setIsDeleteModalShow] = useState(false);

  const { control, handleSubmit, formState } = useForm<AddressPayload>({
    defaultValues: {
      streetAddress1: address?.streetAddress1,
      streetAddress2: address?.streetAddress2,
      locationDetails: address?.locationDetails,
      city: address?.city,
      state: address?.state,
      zipCode: address?.zipCode,
    },
    mode: 'onBlur',
    resolver: yupResolver(addressValidationSchema),
  });

  const onSubmit = (data: AddressPayload) => {
    //TODO(PT-1619): this is temporary, will be removed after data-access is implemented
    console.info(data);
  };

  const onDeleteButtonPress = () => {
    setIsDeleteModalShow(true);
  };

  const handleCloseModal = () => {
    onClose();
    setIsDeleteModalShow(false);
  };

  const onDelete = () => {
    //TODO(PT-1619): this is temporary, will be removed after data-access is implemented
    console.info('Address deleted');
    handleCloseModal();
  };

  return (
    <ResponsiveModal
      testIdPrefix={EDIT_ADDRESS_MODAL_TEST_IDS.MODAL}
      title={isDeleteModalShow ? 'Delete this Address?' : 'Edit Address'}
      open={open}
      onClose={handleCloseModal}
    >
      {isDeleteModalShow ? (
        <Confirmation
          testIdPrefix={EDIT_ADDRESS_MODAL_TEST_IDS.DELETE_ADDRESS_CONFIRMATION}
          handleSubmit={onDelete}
          buttonText="Yes, Remove this Address"
          alertMessage="Are you sure you want to remove this address from your account?"
        />
      ) : (
        <EditAddressFormUI
          control={control}
          isSubmitButtonDisabled={!formState.isValid}
          handleSubmit={handleSubmit(onSubmit)}
          handleDelete={onDeleteButtonPress}
        />
      )}
    </ResponsiveModal>
  );
};

export default EditAddressModal;
