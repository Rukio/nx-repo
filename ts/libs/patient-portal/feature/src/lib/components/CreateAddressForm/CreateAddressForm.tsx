import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CreateAddressForm as CreateAddressFormUI,
  AddressPayload,
  PageSection,
} from '@*company-data-covered*/patient-portal/ui';
import { CREATE_ADDRESS_FORM_TEST_IDS } from './testIds';
import { NAVIGATION_TO_SETTINGS_PARAMS } from '../../constants';
import { addressValidationSchema } from '../../utils/validation';

const CreateAddressForm: FC = () => {
  const navigate = useNavigate();
  const { control, handleSubmit, formState } = useForm<AddressPayload>({
    defaultValues: {
      streetAddress1: '',
      streetAddress2: '',
      locationDetails: '',
      city: '',
      state: '',
    },
    mode: 'onBlur',
    resolver: yupResolver(addressValidationSchema),
  });

  const onSubmit = (data: AddressPayload) => {
    //TODO(PT-1619): this is temporary, will be removed after data-access is implemented
    console.info(data);
    navigate('/');
  };

  return (
    <PageSection
      testIdPrefix={CREATE_ADDRESS_FORM_TEST_IDS.TITLE}
      title="Add Address"
      backButtonOptions={NAVIGATION_TO_SETTINGS_PARAMS}
    >
      <CreateAddressFormUI
        control={control}
        isSubmitButtonDisabled={!formState.isValid}
        handleSubmit={handleSubmit(onSubmit)}
      />
    </PageSection>
  );
};

export default CreateAddressForm;
