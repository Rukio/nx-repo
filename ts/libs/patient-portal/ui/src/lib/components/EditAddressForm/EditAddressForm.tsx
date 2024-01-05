import { FC, FormEventHandler } from 'react';
import { Control } from 'react-hook-form';
import { Box, Button, makeSxStyles } from '@*company-data-covered*/design-system';
import { EDIT_ADDRESS_FORM_TEST_IDS } from './testIds';
import { AddressPayload } from '../../types';
import { AddressForm } from '../AddressForm';

export type EditAddressFormProps = {
  handleSubmit: FormEventHandler<HTMLFormElement>;
  handleDelete: () => void;
  isSubmitButtonDisabled: boolean;
  control: Control<AddressPayload>;
};

const makeStyles = () =>
  makeSxStyles({
    formControl: {
      mt: 3,
    },
    buttonsWrapper: (theme) => ({
      mt: 3,
      gap: 16,
      display: 'flex',
      justifyContent: 'space-between',
      [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
        gap: 2,
      },
    }),
    defaultSelectValue: {
      color: 'text.disabled',
    },
  });

const EditAddressForm: FC<EditAddressFormProps> = ({
  handleSubmit,
  handleDelete,
  control,
  isSubmitButtonDisabled,
}) => {
  const styles = makeStyles();

  return (
    <form onSubmit={handleSubmit}>
      <AddressForm
        control={control}
        testIdPrefix={EDIT_ADDRESS_FORM_TEST_IDS.EDIT_FORM_PREFIX}
      />

      <Box sx={styles.buttonsWrapper}>
        <Button
          data-testid={EDIT_ADDRESS_FORM_TEST_IDS.SUBMIT_BUTTON}
          variant="contained"
          disabled={isSubmitButtonDisabled}
          type="submit"
          fullWidth
        >
          Save
        </Button>
        <Button
          data-testid={EDIT_ADDRESS_FORM_TEST_IDS.DELETE_BUTTON}
          variant="outlined"
          onClick={handleDelete}
          color="error"
          fullWidth
        >
          Delete Address
        </Button>
      </Box>
    </form>
  );
};

export default EditAddressForm;
