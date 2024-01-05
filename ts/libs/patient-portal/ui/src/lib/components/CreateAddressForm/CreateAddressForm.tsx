import { FC, FormEventHandler } from 'react';
import { Control } from 'react-hook-form';
import { Button, makeSxStyles } from '@*company-data-covered*/design-system';
import { CREATE_ADDRESS_FORM_TEST_IDS } from './testIds';
import { AddressPayload } from '../../types';
import { AddressForm } from '../AddressForm';

export type CreateAddressFormProps = {
  handleSubmit: FormEventHandler<HTMLFormElement>;
  isSubmitButtonDisabled: boolean;
  control: Control<AddressPayload>;
};

const makeStyles = () =>
  makeSxStyles({
    formControl: {
      mt: 3,
    },
  });

const CreateAddressForm: FC<CreateAddressFormProps> = ({
  handleSubmit,
  control,
  isSubmitButtonDisabled,
}) => {
  const styles = makeStyles();

  return (
    <form onSubmit={handleSubmit}>
      <AddressForm
        control={control}
        testIdPrefix={CREATE_ADDRESS_FORM_TEST_IDS.CREATE_FORM_PREFIX}
      />

      <Button
        sx={styles.formControl}
        data-testid={CREATE_ADDRESS_FORM_TEST_IDS.SUBMIT_BUTTON}
        variant="contained"
        disabled={isSubmitButtonDisabled}
        type="submit"
        fullWidth
      >
        Save
      </Button>
    </form>
  );
};

export default CreateAddressForm;
