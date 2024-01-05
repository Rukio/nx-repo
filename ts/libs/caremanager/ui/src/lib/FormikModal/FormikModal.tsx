import { Form, Formik, FormikValues } from 'formik';
import { PropsWithChildren } from 'react';
import * as Yup from 'yup';
import {
  Button,
  CloseIcon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  SxStylesValue,
  makeSxStyles,
  theme,
  useMediaQuery,
} from '@*company-data-covered*/design-system';

type FormikModalProps<T extends Yup.ISchema<unknown>, I = Yup.InferType<T>> = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  testIdPrefix: string;
  onSubmit: (values: I) => void; // The same here for future implementations
  isSubmitting?: boolean;
  contentSx?: SxStylesValue;
  titleSx?: SxStylesValue;

  /**
   * This initial values for the Formik form.
   *
   * The shape of this object will be informed by the validationSchema provided.
   */
  initialValues: I;

  /**
   * The Yup schema to validate the form.
   *
   * The values in the schema will inform the shape of the object that needs to be supplied for initialValues.
   */
  validationSchema: T;
};

const styles = makeSxStyles({
  title: { margin: 0, padding: 2 },
  closeIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
    color: () => theme.palette.grey[500],
  },
});

export const FormikModal = <T extends Yup.ISchema<unknown>>({
  children,
  title,
  isOpen,
  onClose,
  testIdPrefix,
  initialValues,
  validationSchema,
  onSubmit,
  isSubmitting,
  contentSx,
  titleSx,
}: PropsWithChildren<FormikModalProps<T>>) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby={testIdPrefix}
      open={isOpen}
      data-testid={`${testIdPrefix}-dialog`}
      fullScreen={isMobile}
      maxWidth={false}
    >
      <DialogTitle
        data-testid={`${testIdPrefix}-title`}
        sx={{ ...styles.title, ...titleSx }}
      >
        {title}
        <IconButton aria-label="close" onClick={onClose} sx={styles.closeIcon}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Formik
        initialValues={initialValues as FormikValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ dirty }) => (
          <Form data-testid={`${testIdPrefix}-form`}>
            <DialogContent dividers sx={contentSx}>
              {children}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={onClose}
                data-testid={`${testIdPrefix}-cancel-button`}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                data-testid={`${testIdPrefix}-save-button`}
                variant="contained"
                color="primary"
                type="submit"
                disabled={isSubmitting || !dirty}
                disableElevation
              >
                Save
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};
