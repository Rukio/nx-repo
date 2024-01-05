import * as Yup from 'yup';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeSxStyles,
  TextField,
} from '@*company-data-covered*/design-system';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { Formik, Field, Form } from 'formik';
import { useRejectServiceRequest } from '@*company-data-covered*/caremanager/data-access';

export const SUBMIT_BUTTON_TEST_ID = 'reject-service-submit-button';

const styles = makeSxStyles({
  actions: { padding: 3, width: 600 },
  content: { paddingBottom: 0 },
});

type Props = {
  serviceRequestId?: string;
  open: boolean;
  onClose: () => void;
};

export const validationSchema = Yup.object({
  isOtherOpen: Yup.boolean(),
  other: Yup.string().when('isOtherOpen', {
    is: true,
    then: (schema) => schema.required('Required'),
  }),
  rejectReasons: Yup.array()
    .of(Yup.string())
    .when('isOtherOpen', {
      is: true,
      then: (schema) => schema.min(0),
      otherwise: (schema) => schema.min(1),
    }),
});

const RejectServiceRequestDialog: React.FC<Props> = ({
  serviceRequestId,
  open,
  onClose,
}) => {
  const { mutateAsync: rejectServiceRequest, isLoading } =
    useRejectServiceRequest();
  const handleSubmit = async (formValues: {
    rejectReasons: string[];
    isOtherOpen: boolean;
    other: string;
  }) => {
    if (!serviceRequestId) {
      return;
    }
    const rejectReasons = [...formValues.rejectReasons];
    if (formValues.isOtherOpen) {
      rejectReasons.push(formValues.other);
    }
    await rejectServiceRequest({
      serviceRequestId,
      body: { rejectReason: rejectReasons.join('|') },
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Are you sure you want to reject?</DialogTitle>
      <Formik
        initialValues={{
          rejectReasons: [] as string[],
          isOtherOpen: false,
          other: '',
        }}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
      >
        {({ values, handleChange, errors, dirty }) => (
          <Form>
            <DialogContent sx={styles.content}>
              <DialogContentText>
                Please select a reason for rejecting
              </DialogContentText>
              <FormGroup>
                <FormControlLabel
                  label="Insurance not eligible"
                  control={
                    <Field
                      data-testid="insurance-checkbox"
                      type="checkbox"
                      name="rejectReasons"
                      as={Checkbox}
                      value="Insurance not eligible"
                    />
                  }
                />
                <FormControlLabel
                  label="Clinically not eligible"
                  control={
                    <Field
                      data-testid="clinical-checkbox"
                      type="checkbox"
                      name="rejectReasons"
                      as={Checkbox}
                      value="Clinically not eligible"
                    />
                  }
                />
                <FormControlLabel
                  label="Other"
                  control={
                    <Field
                      data-testid="other-checkbox"
                      type="checkbox"
                      as={Checkbox}
                      name="isOtherOpen"
                    />
                  }
                />
                {values.isOtherOpen && (
                  <TextField
                    fullWidth
                    multiline
                    inputProps={{
                      'data-testid': 'other-reject-reason-text-field',
                    }}
                    placeholder="Type the reason for reject"
                    name="other"
                    onChange={handleChange}
                    value={values.other}
                  />
                )}
              </FormGroup>
            </DialogContent>
            <DialogActions sx={styles.actions}>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                color="error"
                variant="contained"
                data-testid={SUBMIT_BUTTON_TEST_ID}
                type="submit"
                disabled={
                  !!errors.rejectReasons ||
                  !!errors.other ||
                  !dirty ||
                  isLoading
                }
              >
                Reject
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default RejectServiceRequestDialog;
