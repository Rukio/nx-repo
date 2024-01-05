import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  CloseIcon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  useCreateCallVisit,
  useGetVisitTypes,
  useUpdateCallVisit,
} from '@*company-data-covered*/caremanager/data-access';
import {
  FormikInputField,
  FormikSelectField,
} from '@*company-data-covered*/caremanager/ui';

export const callVisitModalTestIds = {
  CANCEL_BUTTON: 'new-call-cancel-button',
  CALL_SUMMARY_INPUT: 'new-call-summary-input',
  CALL_TYPE_DROPDOWN: 'new-call-type-dropdown',
  NEW_CALL_MODAL: 'new-call-modal',
  SAVE_BUTTON: 'new-call-save-button',
};

const styles = makeSxStyles({
  formBox: {
    display: 'grid',
    gap: '12px',
    padding: '0',
    width: {
      xs: '200px',
      sm: '320px',
      md: '520px',
    },
  },
  callSummaryInputBox: {
    height: '136px',
  },
  callTypeInputBox: {
    height: '76px',
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    color: (theme) => theme.palette.grey[700],
  },
});

interface FormSchema {
  callType: string;
  callSummary: string;
}

const validationSchema = Yup.object({
  callType: Yup.string().required('Required'),
  callSummary: Yup.string().required('Required'),
});

interface Props {
  episodeId: string;
  visitId?: string;
  isOpen: boolean;
  visitTypeId?: string;
  summary?: string;
  onClose: () => void;
}

export const CallVisitFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  episodeId,
  visitId,
  visitTypeId,
  summary,
}) => {
  const { data: visitTypesData, isLoading: isLoadingVisitTypes } =
    useGetVisitTypes();
  const { mutate: createCallVisit } = useCreateCallVisit();
  const { mutate: updateCallVisit } = useUpdateCallVisit(episodeId);

  const onSubmit = (values: FormSchema) => {
    if (visitId) {
      updateCallVisit({
        visitId,
        body: {
          visitTypeId: values.callType,
          summary: values.callSummary,
        },
      });
    } else {
      createCallVisit({
        body: {
          episodeId: episodeId,
          visitTypeId: values.callType,
          summary: values.callSummary,
        },
      });
    }
    onClose();
  };

  if (isLoadingVisitTypes) {
    return null;
  }

  const visitTypeOptions = (visitTypesData?.visitTypes || [])
    .filter((visitType) => visitType.isCallType)
    .map((callType) => ({
      id: callType.id,
      name: callType.name,
    }));

  return (
    <Dialog data-testid={callVisitModalTestIds.NEW_CALL_MODAL} open={isOpen}>
      <DialogTitle>
        {visitId ? 'Update Call' : 'New Call'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={styles.closeButton}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Formik
        initialValues={{
          callType: visitTypeId || '',
          callSummary: summary || '',
        }}
        onSubmit={onSubmit}
        validationSchema={validationSchema}
      >
        <Form>
          <DialogContent dividers>
            <Box sx={styles.formBox}>
              <Box
                data-testid={callVisitModalTestIds.CALL_TYPE_DROPDOWN}
                sx={styles.callTypeInputBox}
              >
                <FormikSelectField
                  options={visitTypeOptions}
                  label="Call Type"
                  name="callType"
                  fullWidth
                />
              </Box>
              <Box
                data-testid={callVisitModalTestIds.CALL_SUMMARY_INPUT}
                sx={styles.callSummaryInputBox}
              >
                <FormikInputField
                  fieldData={{
                    label: 'Call Summary',
                    name: 'callSummary',
                  }}
                  fullWidth
                  multiline
                  rows={4}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={onClose}
              data-testid={callVisitModalTestIds.CANCEL_BUTTON}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              data-testid={callVisitModalTestIds.SAVE_BUTTON}
              disableElevation
            >
              Save
            </Button>
          </DialogActions>
        </Form>
      </Formik>
    </Dialog>
  );
};
